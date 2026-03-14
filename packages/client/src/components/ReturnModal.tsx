import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/printReceipt';
import { UserRole } from '@hotel-inventory/shared';

const ReturnModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { accessToken, user, selectedHotelId } = useAuth();
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State to hold the actual Hotel Name for the receipt
  const [hotelName, setHotelName] = useState('Main Property');

  useEffect(() => { 
    if (!open) { 
        setQty(1); 
        setRemarks(''); 
    } 
  }, [open]);

  // Silently fetch the real hotel name when the modal opens
  useEffect(() => {
    if (!open) return;
    
    const fetchHotelName = async () => {
      try {
        if (item?.hotelId?.name) {
          setHotelName(item.hotelId.name);
          return;
        }

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
    if (!qty || qty <= 0) {
        toast.error('Please enter a valid quantity');
        return;
    }
    
    if (item && qty > item.currentStock) {
        toast.error(`Cannot return more than current stock (${item.currentStock})`);
        return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/items/return', { 
        itemId: item._id, 
        quantity: qty, 
        remarks 
      }, { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      });
      
      toast.success('Returned to vendor successfully');

      // --- PRINT RECEIPT LOGIC ---
      if (shouldPrint) {
        printReceipt({
          txId: res.data?.data?.transaction?._id,
          hotelName: hotelName, 
          departmentName: item?.departmentId?.name || "Assigned Department",
          itemName: item?.name,
          actionText: 'RETURN TO VENDOR',
          quantity: qty,
          createdBy: user?.name || user?.username || 'System',
          designation: user?.role,
          remarks: remarks || 'Vendor Return'
        });
      }

      // THE FIX: Empty onSave prevents the old double-popup!
      onSave(); 
      onOpenChange(false);
    } catch (e:any) { 
        toast.error(e.response?.data?.message || 'Failed to return item'); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Return to Vendor</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground">Item Name</Label>
            <div className="font-medium text-lg">{item?.name}</div>
          </div>
          
          <div>
            <Label htmlFor="return-qty">Quantity to Return</Label>
            <Input 
                id="return-qty"
                type="number" 
                value={qty} 
                onChange={e=>setQty(Number(e.target.value))} 
                min={1} 
                max={item?.currentStock}
            />
          </div>
          
          <div>
            <Label htmlFor="return-remarks">Reason / Remarks</Label>
            <Input 
                id="return-remarks"
                placeholder="e.g., Defective, Expired, Overstock"
                value={remarks} 
                onChange={e=>setRemarks(e.target.value)} 
            />
          </div>
        </div>
        
        {/* THE NEW SPLIT BUTTON LAYOUT */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => submit(false)} disabled={loading}>
            Save Only
          </Button>
          <Button onClick={() => submit(true)} disabled={loading}>
            {loading ? 'Processing...' : 'Save & Print Receipt'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default ReturnModal;