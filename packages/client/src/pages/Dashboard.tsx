import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, Building2, Flame, Plus, Minus, Trash2, ArrowRightLeft, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';

import ItemModal from '@/components/ItemModal';
import DamageModal from '@/components/DamageModal';
import TransferModal from '@/components/TransferModal';
import ReturnModal from '@/components/ReturnModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, accessToken, selectedHotelId } = useAuth();

  // Basic Data States
  const [allItems, setAllItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [belowMinItems, setBelowMinItems] = useState(0);
  const [criticalItems, setCriticalItems] = useState(0);
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [reorderItems, setReorderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal States
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDeptId, setSearchDeptId] = useState<string>('all');
  const [actionType, setActionType] = useState<'ISSUE' | 'DISCARD' | 'TRANSFER' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Transaction Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!selectedHotelId && user?.role === UserRole.SUPER_ADMIN) return;

      const hotelId = user?.role === UserRole.SUPER_ADMIN ? selectedHotelId : user?.assignedHotelId;
      if (!hotelId) return;

      // Fetch all items for the hotel
      const itemsRes = await apiClient.get('/items', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { hotelId },
      });

      const items = itemsRes.data.data || [];
      setAllItems(items);
      setTotalItems(items.length);

      // Below minimum
      const belowMin = items.filter((i: any) => i.currentStock < i.minStock);
      setBelowMinItems(belowMin.length);

      // Critical (below 50% of minStock)
      const critical = items.filter(
        (i: any) => i.currentStock < i.minStock * 0.5
      );
      setCriticalItems(critical.length);

      // Sort by severity and limit to 5
      const sortedReorder = belowMin
        .sort(
          (a: any, b: any) =>
            (a.currentStock / a.minStock) - (b.currentStock / b.minStock)
        )
        .slice(0, 5);
      setReorderItems(sortedReorder);

      // Fetch departments for this hotel
      const deptRes = await apiClient.get('/departments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { hotelId },
      });
      const fetchedDepts = deptRes.data.data || [];
      setDepartments(fetchedDepts);
      setDepartmentsCount(fetchedDepts.length);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotelId, user?.assignedHotelId]);

  // Handle clicking a Quick Action button
  const handleActionClick = (type: 'ADD' | 'ISSUE' | 'DISCARD' | 'TRANSFER') => {
    if (type === 'ADD') {
      setSelectedItem(null);
      setItemModalOpen(true);
    } else {
      setActionType(type);
      setSearchQuery('');
      setSearchDeptId('all'); // Reset department filter when opening
      setSearchModalOpen(true);
    }
  };

  // Handle selecting an item from the search modal
  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    setSearchModalOpen(false);

    setTimeout(() => {
      if (actionType === 'DISCARD') setDamageModalOpen(true);
      if (actionType === 'TRANSFER') setTransferModalOpen(true);
      if (actionType === 'ISSUE') setReturnModalOpen(true);
    }, 150);
  };

  const handleTransactionComplete = () => {
    fetchDashboardData();
  };

  const summaryCards = [
    { title: 'Total Items', value: totalItems, icon: Package, color: 'text-primary' },
    { title: 'Below Minimum', value: belowMinItems, icon: AlertTriangle, color: 'text-danger' },
    { title: 'Critical Shortages', value: criticalItems, icon: Flame, color: 'text-warning' },
    ...(user?.role === UserRole.MANAGER || user?.role === UserRole.SUPER_ADMIN
      ? [{ title: 'Departments Active', value: departmentsCount, icon: Building2, color: 'text-success' }]
      : []),
  ];

  const quickActions = [
    { label: 'Add Inventory', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-100', type: 'ADD' as const },
    { label: 'Return to Vendor', icon: Minus, color: 'text-orange-600', bg: 'bg-orange-100', type: 'ISSUE' as const },
    { label: 'Discard Items', icon: Trash2, color: 'text-red-600', bg: 'bg-red-100', type: 'DISCARD' as const },
    user?.role === UserRole.HOD
      ? { label: 'Internal Transfers', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100', type: 'TRANSFER' as const }
      : { label: 'Internal/External Transfers', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100', type: 'TRANSFER' as const }
  ];

  // Double Filter: Matches Search Query AND Selected Department
  const filteredSearchItems = allItems.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const deptId = i.departmentId?._id || i.departmentId;
    const matchesDept = searchDeptId === 'all' || deptId === searchDeptId;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your hotel’s inventory health
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary/60 mb-4" />
          <p className="text-sm font-medium">Dashboard Loading...</p>
          <p className="text-xs opacity-70 mt-1">This will just take a second</p>
        </div>
      ) : (
        <>
          {/* QUICK ACTIONS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer border-transparent hover:border-gray-200"
                onClick={() => handleActionClick(action.type)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-3">
                  <div className={`p-3 rounded-full ${action.bg}`}>
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <span className="font-semibold text-sm">{action.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Basic Info Summary Cards */}
          <div className={`grid gap-4 md:grid-cols-2 ${summaryCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
            {summaryCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Shortened Reorder Warning Section */}
          {reorderItems.length > 0 ? (
            <Card className="border-danger">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-danger" />
                      🚨 Urgent Reorder Required
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {belowMinItems} item{belowMinItems !== 1 ? 's' : ''} below
                      minimum stock level
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/reports?tab=reorder')}
                  >
                    View Reports
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1.5 px-2 font-medium">Item Name</th>
                        <th className="text-left py-1.5 px-2 font-medium">Department</th>
                        <th className="text-right py-1.5 px-2 font-medium">Current</th>
                        <th className="text-right py-1.5 px-2 font-medium">Minimum</th>
                        <th className="text-right py-1.5 px-2 font-medium">Shortage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reorderItems.map((item: any) => {
                        const shortage = item.minStock - item.currentStock;
                        return (
                          <tr key={item._id} className="border-b hover:bg-muted/50">
                            <td className="py-1.5 px-2 font-medium">{item.name}</td>
                            <td className="py-1.5 px-2">{item.departmentId?.name || '-'}</td>
                            <td className="py-1.5 px-2 text-right text-danger font-semibold">
                              {item.currentStock}
                            </td>
                            <td className="py-1.5 px-2 text-right">{item.minStock}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-danger">
                              {shortage}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-lg font-semibold mb-1">All Items Sufficiently Stocked</h3>
                <p className="text-sm text-muted-foreground">
                  No items are below minimum stock level at this time
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* --- MODALS & DIALOGS --- */}

      {/* Item Search Dialog */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="capitalize">Select Item to {actionType?.toLowerCase()}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {user?.role !== UserRole.HOD && (
              <Select value={searchDeptId} onValueChange={setSearchDeptId}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {departments.map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto mt-4 space-y-2 pr-2">
            {filteredSearchItems.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No items found.</p>
            ) : (
              filteredSearchItems.map(item => (
                <Button
                  key={item._id}
                  variant="outline"
                  className="w-full justify-between font-normal"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="flex flex-col items-start truncate mr-2">
                    <span>{item.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{item.departmentId?.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                    Stock: {item.currentStock}
                  </span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reused Transaction Modals */}
      <ItemModal open={itemModalOpen} onOpenChange={setItemModalOpen} item={selectedItem} onSave={handleTransactionComplete} />
      <DamageModal open={damageModalOpen} onOpenChange={setDamageModalOpen} item={selectedItem} onSave={handleTransactionComplete} />
      <TransferModal open={transferModalOpen} onOpenChange={setTransferModalOpen} item={selectedItem} onSave={handleTransactionComplete} />
      <ReturnModal open={returnModalOpen} onOpenChange={setReturnModalOpen} item={selectedItem} onSave={handleTransactionComplete} />

    </div>
  );
};

export default Dashboard;