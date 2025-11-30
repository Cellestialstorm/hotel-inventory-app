import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';

const ItemModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { user, accessToken, selectedHotelId } = useAuth();
  const [form, setForm] = useState({ name: '', departmentId: '', quantityAdded: 0, minStock: 0 });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const params: any = {};
      
        if (user?.role === UserRole.ADMIN) {
          if (selectedHotelId) params.hotelId = selectedHotelId;
        } else {
          if (user?.assignedHotelId) params.hotelId = user.assignedHotelId;
          if (user?.assignedDepartmentId) params.departmentId = user.assignedDepartmentId;
        }

        const res = await apiClient.get('/departments', { headers: { Authorization: `Bearer ${accessToken}` }, params});
        setDepartments(res.data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [open, user?.assignedHotelId, accessToken]);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({ name: item.name || '', departmentId: item.departmentId?._id || item.departmentId, quantityAdded: 0, minStock: item.minStock || 0 });
    } else {
      setForm({ name: '', departmentId: user?.assignedDepartmentId ? user.assignedDepartmentId.toString() : '', quantityAdded: 0, minStock: 0 });
    }
  }, [open, item, user?.assignedDepartmentId]);

  const submit = async () => {
    if (!form.name || !form.departmentId) { toast.error('Fill required'); return; }
    setLoading(true);
    try {
      if (item) {
        await apiClient.put(`/items/${item._id}`, { name: form.name, minStock: form.minStock, departmentId: form.departmentId }, { headers: { Authorization: `Bearer ${accessToken}` }});
        toast.success('Updated');
      } else {
        await apiClient.post('/items', { name: form.name, hotelId: user?.assignedHotelId, departmentId: form.departmentId, quantityAdded: form.quantityAdded, minStock: form.minStock }, { headers: { Authorization: `Bearer ${accessToken}` }});
        toast.success('Created');
      }
      onSave();
      onOpenChange(false);
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>{item ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Item Name</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
          <div>
            <Label>Department</Label>
            <Select value={form.departmentId} onValueChange={(v:any)=>setForm({...form, departmentId:v})}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{departments.map((d:any)=>(<SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          {!item && <div><Label>Quantity</Label><Input type="number" value={form.quantityAdded} onChange={e=>setForm({...form, quantityAdded: Number(e.target.value)})} /></div>}
          <div><Label>Min Stock</Label><Input type="number" value={form.minStock} onChange={e=>setForm({...form, minStock: Number(e.target.value)})} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading?'Saving...':'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;