import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { printReceipt } from '@/utils/printReceipt';
import { toast } from 'sonner';
import { UserRole } from '@hotel-inventory/shared';

const DamageModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { accessToken, user, selectedHotelId } = useAuth();
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [hotelName, setHotelName] = useState('Main Property');

  useEffect(() => { 
    if (!open) { 
      setQty(1); 
      setRemarks(''); 
    } 
  }, [open]);

  // THE FIX: Silently fetch the real hotel name when the modal opens
  useEffect(() => {
    if (!open) return;
    
    const fetchHotelName = async () => {
      try {
        // If the item object already has it populated from the backend, use it instantly!
        if (item?.hotelId?.name) {
          setHotelName(item.hotelId.name);
          return;
        }

        // Otherwise, fetch the list of hotels and find the matching name
        const res = await apiClient.get('/hotels', { headers: { Authorization: `Bearer ${accessToken}` } });
        const hotels = res.data.data || [];
        
        const targetId = user?.role === UserRole.SUPER_ADMIN ? selectedHotelId : user?.assignedHotelId;
        const foundHotel = hotels.find((h: any) => h._id === targetId || h._id === item?.hotelId);
        
        if (foundHotel) {
          setHotelName(foundHotel.name);
        }
      } catch (e) {
        console.error("Failed to fetch hotel name for receipt", e);
      }
    };

    fetchHotelName();
  }, [open, item, user, selectedHotelId, accessToken]);

  const submit = async (shouldPrint: boolean = false) => {
    if (!qty || qty <= 0) { toast.error('Invalid quantity'); return; }
    if (!remarks) { toast.error('Reason is required for damages'); return; }
    
    setLoading(true);
    try {
      const res = await apiClient.post('/items/damage', { 
        itemId: item._id, 
        quantity: qty, 
        remarks 
      }, { headers: { Authorization: `Bearer ${accessToken}` }});
      
      toast.success('Damage recorded');

      // --- PRINT RECEIPT WITH REAL HOTEL NAME ---
      if (shouldPrint) {
        let displayRole = 'Staff';
        if (user?.role === UserRole.SUPER_ADMIN) {
          displayRole = 'Owner'; // <--- Change this to 'General Manager' or anything else later!
        } else if (user?.role === UserRole.HOD) {
          displayRole = 'Head of Department';
        } else if (user?.role === UserRole.MANAGER) {
          displayRole = 'Manager';
        }

        printReceipt({
          txId: res.data?.data?.transaction?._id,
          hotelName: hotelName, 
          departmentName: item?.departmentId?.name || "Assigned Department",
          itemName: item?.name,
          actionText: 'DISCARD / DAMAGE',
          quantity: qty,
          createdBy: user?.name || user?.username || 'System',
          designation: displayRole,
          remarks: remarks
        });
      }

      onSave();
      onOpenChange(false);
    } catch (e:any) { 
      toast.error(e.response?.data?.message || 'Failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Report Damage</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Item</Label>
            <div className="font-medium text-lg">{item?.name}</div>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} min={1} />
          </div>
          <div>
            <Label>Reason / Remarks</Label>
            <Input value={remarks} placeholder="e.g., Defective, Expired, Overstock" onChange={e=>setRemarks(e.target.value)} />
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
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

export default DamageModal;