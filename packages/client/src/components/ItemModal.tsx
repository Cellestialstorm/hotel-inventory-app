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
import { printReceipt } from '@/utils/printReceipt'; // <-- IMPORTED!

const ItemModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { user, accessToken, selectedHotelId } = useAuth();
  const [form, setForm] = useState({ name: '', departmentId: '', quantityAdded: 0, minStock: 0 });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State to hold the fetched Hotel Name for the receipt
  const [hotelName, setHotelName] = useState('Main Property');

  useEffect(() => {
    if (!open) return;
    const loadDeptsAndHotel = async () => {
      try {
        const params: any = {};
      
        // Fetch departments based on the correct Hotel ID
        if (user?.role === UserRole.SUPER_ADMIN) {
          if (selectedHotelId) params.hotelId = selectedHotelId;
        } else {
          if (user?.assignedHotelId) params.hotelId = user.assignedHotelId;
          if (user?.role === UserRole.HOD && user?.assignedDepartmentId) {
             params.departmentId = user.assignedDepartmentId;
          }
        }

        if (!params.hotelId) return;

        const res = await apiClient.get('/departments', { headers: { Authorization: `Bearer ${accessToken}` }, params});
        const fetchedDepts = res.data.data || [];
        setDepartments(fetchedDepts);

        if (!item && fetchedDepts.length === 1) {
            setForm(prev => ({ ...prev, departmentId: fetchedDepts[0]._id }));
        }

        // --- FETCH HOTEL NAME FOR RECEIPT ---
        const hotelRes = await apiClient.get('/hotels', { headers: { Authorization: `Bearer ${accessToken}` } });
        const targetId = params.hotelId;
        const foundHotel = (hotelRes.data.data || []).find((h: any) => h._id === targetId);
        if (foundHotel) setHotelName(foundHotel.name);

      } catch (e) {
        console.error(e);
      }
    };
    loadDeptsAndHotel();
  }, [open, user, selectedHotelId, accessToken, item]);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({ 
        name: item.name || '', 
        departmentId: item.departmentId?._id || item.departmentId || '', 
        quantityAdded: 0, 
        minStock: item.minStock || 0 
      });
    } else {
      setForm({ 
        name: '', 
        departmentId: user?.role === UserRole.HOD && user?.assignedDepartmentId ? user.assignedDepartmentId.toString() : '', 
        quantityAdded: 0, 
        minStock: 0 
      });
    }
  }, [open, item, user]);

  // Pass 'shouldPrint' into the submit function
  const submit = async (shouldPrint: boolean = false) => {
    if (!form.name || !form.departmentId) { 
        toast.error('Item Name and Department are required'); 
        return; 
    }

    const finalHotelId = user?.role === UserRole.SUPER_ADMIN ? selectedHotelId : user?.assignedHotelId;

    if (!finalHotelId && !item) {
        toast.error('No Hotel selected. Please select a hotel from the dashboard first.');
        return;
    }

    setLoading(true);
    try {
      let txIdToPrint = undefined;

      if (item) {
        // Edit Mode
        await apiClient.put(`/items/${item._id}`, { 
            name: form.name, 
            minStock: form.minStock, 
            departmentId: form.departmentId 
        }, { headers: { Authorization: `Bearer ${accessToken}` }});
        toast.success('Item updated successfully');
      } else {
        // Create Mode
        const res = await apiClient.post('/items', { 
            name: form.name, 
            hotelId: finalHotelId, 
            departmentId: form.departmentId, 
            quantityAdded: form.quantityAdded, 
            minStock: form.minStock 
        }, { headers: { Authorization: `Bearer ${accessToken}` }});
        
        // If the backend returns the initial ADD transaction ID, grab it
        txIdToPrint = res.data?.data?.transaction?._id; 
        toast.success('Item created successfully');
      }

      // --- FIRE THE RECEIPT ---
      if (shouldPrint) {
        const selectedDept = departments.find(d => d._id === form.departmentId);
        printReceipt({
          txId: txIdToPrint,
          hotelName: hotelName,
          departmentName: selectedDept?.name || "Assigned Department",
          itemName: form.name,
          actionText: item ? 'ITEM EDITED' : 'ADD (INITIAL INVENTORY)',
          quantity: item ? form.minStock : form.quantityAdded, 
          createdBy: user?.name || 'System',
          designation: user?.role,
          remarks: item ? 'Updated Item Details' : 'New Item'
        });
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
        <DialogHeader><DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Item Name *</Label>
            <Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="e.g. Bath Towels" />
          </div>
          <div>
            <Label>Department *</Label>
            <Select 
                value={form.departmentId} 
                onValueChange={(v:any)=>setForm({...form, departmentId:v})}
                disabled={user?.role === UserRole.HOD}
            >
              <SelectTrigger><SelectValue placeholder="Select Department"/></SelectTrigger>
              <SelectContent>
                  {departments.map((d:any)=>(<SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {!item && (
            <div>
              <Label>Initial Quantity</Label>
              <Input type="number" min="0" value={form.quantityAdded} onChange={e=>setForm({...form, quantityAdded: Number(e.target.value)})} />
            </div>
          )}
          <div>
            <Label>Minimum Stock Level Warning</Label>
            <Input type="number" min="0" value={form.minStock} onChange={e=>setForm({...form, minStock: Number(e.target.value)})} />
          </div>
        </div>
        
        {/* THE NEW SPLIT BUTTON LAYOUT */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => submit(false)} disabled={loading}>
            Save Only
          </Button>
          <Button onClick={() => submit(true)} disabled={loading}>
            {loading ? 'Saving...' : 'Save & Print Receipt'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;