import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, Edit, Lock, History, User, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';
import { printReceipt } from '@/utils/printReceipt';

const ITEMS_PER_PAGE = 50;

const AuditLogs = () => {
  const { user, accessToken, selectedHotelId } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | string>('');
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. Fetch Departments
  useEffect(() => {
    if (user?.role === UserRole.HOD) return;

    const fetchDepartments = async () => {
      try {
        const hotelId = user?.role === UserRole.SUPER_ADMIN ? selectedHotelId : user?.assignedHotelId;
        if (!hotelId) return;

        const res = await apiClient.get('/departments', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { hotelId }
        });
        
        const fetchedDepts = res.data.data || [];
        setDepartments(fetchedDepts);
        
        if (fetchedDepts.length > 0) {
          setSelectedDeptId(fetchedDepts[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
    fetchDepartments();
  }, [user, selectedHotelId, accessToken]);

  // 2. Fetch the actual logs
  const fetchTransactions = async () => {
    try {
      if (user?.role !== UserRole.HOD && !selectedDeptId) return;

      setLoading(true);
      const params: any = {};
      
      if (selectedDeptId) {
        params.departmentId = selectedDeptId;
      }
      if (user?.role === UserRole.SUPER_ADMIN && selectedHotelId) {
        params.hotelId = selectedHotelId;
      }

      const res = await apiClient.get('/transactions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
      });
      
      const fetchedData = res.data.data || [];
      
      // --- THE FIX: Sort Ascending (Oldest First) ---
      const sortedData = fetchedData.sort((a: any, b: any) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setTransactions(sortedData);
      
      // --- THE FIX: Map user instantly to Page N (The Latest Page) ---
      const calculatedTotalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE) || 1;
      setCurrentPage(calculatedTotalPages);

    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    const interval = setInterval(() => {
      setTransactions((prev) => [...prev]); 
    }, 60000);
    return () => clearInterval(interval);
  }, [accessToken, selectedDeptId, selectedHotelId]); 

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      // Show first page, last page, and pages immediately surrounding the current page
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  // --- THE FRONTEND TIME-LOCK CHECKER ---
  const canEditTransaction = (tx: any) => {
    if (!user) return false;
    
    const now = new Date();
    const txDate = new Date(tx.createdAt);

    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    if (user.role === UserRole.MANAGER) {
      return txDate.toDateString() === now.toDateString();
    } 
    
    if (user.role === UserRole.HOD) {
      const hoursElapsed = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
      const dbCreator = tx.createdBy?.trim() || '';
      const currentUser = user.username?.trim() || '';
      const currentId = user.userId?.toString().trim() || '';
      
      const isOwner = (dbCreator === currentUser) || (dbCreator === currentId);
      return (hoursElapsed <= 6) && isOwner;
    }

    return false;
  };

  const openEditModal = (tx: any) => {
    setSelectedTx(tx);
    setNewQuantity(tx.quantity);
    setEditReason('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (newQuantity === '' || Number(newQuantity) < 0) {
      toast.error("Please enter a valid quantity. (Use 0 to reverse the transaction)");
      return;
    }
    if (!editReason.trim()) {
      toast.error("A reason is required for the audit log.");
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/transactions/${selectedTx._id}`, 
        { 
          quantity: Number(newQuantity), 
          reason: editReason 
        }, 
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      toast.success("Transaction updated and inventory corrected successfully!");
      setEditModalOpen(false);
      fetchTransactions(); 
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to edit transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintReceipt = (tx: any) => {
    let displayRole = 'Staff';
    if (user?.role === UserRole.SUPER_ADMIN) {
      displayRole = 'Owner'; 
    } else if (user?.role === UserRole.HOD) {
      displayRole = 'Head of Department';
    } else if (user?.role === UserRole.MANAGER) {
      displayRole = 'Manager';
    }

    printReceipt({
      txId: tx._id,
      date: tx.createdAt,
      hotelName: tx.hotelId?.name || 'Main Property',
      departmentName: tx.departmentId?.name || 'All',
      itemName: tx.itemId?.name || 'Deleted Item',
      actionText: tx.type.replace('_', ' '),
      quantity: tx.quantity,
      createdBy: tx.creatorName || tx.createdBy || 'System User',
      designation: displayRole,
      remarks: tx.remarks || 'None'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-primary" />
            Activity & Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Review recent transactions. 
            {user?.role === UserRole.HOD && " You have 6 hours to correct your own entries."}
            {user?.role === UserRole.MANAGER && " You can make corrections to any entry until midnight."}
          </p>
        </div>

        {user?.role !== UserRole.HOD && departments.length > 0 && (
          <div className="w-full md:w-64 flex flex-col justify-end">
            <Label className="text-xs text-muted-foreground mb-1 block">Filter by Department</Label>
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading history...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No recent activity found for this department.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-3 px-4 text-left font-semibold">Date & Time</th>
                      <th className="py-3 px-4 text-left font-semibold">Logged By</th>
                      <th className="py-3 px-4 text-left font-semibold">Item</th>
                      <th className="py-3 px-4 text-left font-semibold">Action</th>
                      <th className="py-3 px-4 text-right font-semibold">Qty</th>
                      <th className="py-3 px-4 text-left font-semibold">Remarks</th>
                      <th className="py-3 px-4 text-center font-semibold">Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map((tx) => {
                      const isEditable = canEditTransaction(tx);
                      const wasEdited = tx.editHistory && tx.editHistory.length > 0;
                      
                      return (
                        <tr key={tx._id} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-medium">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {tx.creatorName || tx.createdBy || 'Unknown User'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold">
                            {tx.itemId?.name || 'Deleted Item'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {tx.type.replace('_', ' ')}
                              </span>
                              {wasEdited && (
                                <span className="text-[10px] text-orange-600 font-semibold italic">Edited</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-lg">
                            {tx.quantity}
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate" title={tx.remarks}>
                            {tx.remarks || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isEditable ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 w-[85px]"
                                  onClick={() => openEditModal(tx)}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                </Button>
                              ) : (
                                <div className="inline-flex items-center justify-center text-xs text-muted-foreground bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 w-[85px]">
                                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Locked
                                </div>
                              )}

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-gray-100 hover:text-black text-muted-foreground"
                                onClick={() => handlePrintReceipt(tx)}
                                title="Print Receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(endIndex, transactions.length)}</span> of <span className="font-medium text-foreground">{transactions.length}</span> entries
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {getPageNumbers().map((pageNumber, index) => (
                      pageNumber === '...' ? (
                        <span key={index} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button 
                          key={index} 
                          variant={currentPage === pageNumber ? "default" : "outline"} 
                          size="sm" 
                          className="w-8 h-8" 
                          onClick={() => setCurrentPage(pageNumber as number)}
                        >
                          {pageNumber}
                        </Button>
                      )
                    ))}
                    
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal (Unchanged) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Correct Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm flex items-start gap-2 border border-orange-100">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Changing this quantity will automatically mathematically correct the physical stock of <strong>{selectedTx?.itemId?.name}</strong>.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label>Correct Quantity</Label>
              <Input 
                type="number" 
                value={newQuantity} 
                onChange={(e) => setNewQuantity(e.target.value)} 
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Original entered quantity: {selectedTx?.quantity}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Reason for Edit *</Label>
              <Input 
                placeholder="e.g., Typo, counted wrong..." 
                value={editReason} 
                onChange={(e) => setEditReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Applying Math...' : 'Save & Correct Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;