import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Package, ArrowRightLeft } from 'lucide-react';
import ItemModal from '@/components/ItemModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DamageModal from '@/components/DamageModal';
import TransferModal from '@/components/TransferModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';

const Inventory = () => {
  const { user, accessToken, selectedHotelId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const loadDepartments = async () => {
    try {
      const params: any = {};
      if (user?.role === UserRole.ADMIN) {
        if (selectedHotelId) params.hotelId = selectedHotelId;
      } else {
        params.hotelId = user?.assignedHotelId;
      }

      const res = await apiClient.get('/departments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      setDepartments(res.data.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load departments');
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [selectedHotelId, user?.assignedHotelId]);

  useEffect(() => {
    setSelectedDepartment('all');
  }, [selectedHotelId]);

  const loadItems = async () => {
    setLoading(true);
    try {
      if (user?.role === UserRole.ADMIN && !selectedHotelId) {
        setItems([]);
        setLoading(false);
        return;
      }

      const params: any = {};

      if (user?.role === UserRole.ADMIN) {
        if (selectedHotelId) params.hotelId = selectedHotelId;
      } else {
        if (user?.assignedHotelId) params.hotelId = user?.assignedHotelId;
      }

      if (selectedDepartment !== 'all') {
        params.departmentId = selectedDepartment;
      }

      const res = await apiClient.get('/items', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      setItems(res.data.data || []);
    } catch (err:any) {
      console.error(err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [selectedHotelId, user?.assignedHotelId, selectedDepartment, accessToken]);

  const filtered = items.filter(i =>
    (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onAdd = () => { setSelectedItem(null); setItemModalOpen(true); };
  const onEdit = (it:any) => { setSelectedItem(it); setItemModalOpen(true); };
  const onDamage = (it:any) => { setSelectedItem(it); setDamageModalOpen(true); };
  const onTransfer = (it:any) => { setSelectedItem(it); setTransferModalOpen(true); };
  const onDelete = (it:any) => { setSelectedItem(it); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/items/${selectedItem._id}`, { headers: { Authorization: `Bearer ${accessToken}` }});
      toast.success('Item deleted');
      setDeleteDialogOpen(false);
      loadItems();
    } catch (err:any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Items for your hotel/department</p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="gap-2" onClick={onAdd}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          {loading ? <div className="text-center py-12">Loading...</div> :
            filtered.length === 0 ? <div className="text-center py-12">No items</div> :
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Item Name</th>
                    <th className="py-3 px-4 text-left">Department</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Min Stock</th>
                    <th className="py-3 px-4 text-right">Shortage</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const shortage = Math.max(0, (it.minStock || 0) - (it.currentStock || 0));
                    return (
                      <tr key={it._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{it.name}</td>
                        <td className="py-3 px-4">{it.departmentId?.name || '-'}</td>
                        <td className="py-3 px-4 text-right">{it.currentStock}</td>
                        <td className="py-3 px-4 text-right">{it.minStock}</td>
                        <td className="py-3 px-4 text-right">{shortage}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {user?.role === 'ADMIN' && (
                              <Button size="icon" variant="ghost" onClick={() => onEdit(it)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => onDamage(it)}>
                              <Package className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => onTransfer(it)}>
                              <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                            {user?.role === 'ADMIN' && (
                              <Button size="icon" variant="ghost" className="text-danger" onClick={() => onDelete(it)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        </CardContent>
      </Card>

      <ItemModal open={itemModalOpen} onOpenChange={setItemModalOpen} item={selectedItem} onSave={loadItems} />
      <DamageModal open={damageModalOpen} onOpenChange={setDamageModalOpen} item={selectedItem} onSave={loadItems} />
      <TransferModal open={transferModalOpen} onOpenChange={setTransferModalOpen} item={selectedItem} onSave={loadItems} />
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} itemName={selectedItem?.name || ''} onConfirm={confirmDelete} loading={deleteLoading} />
    </div>
  );
};

export default Inventory;