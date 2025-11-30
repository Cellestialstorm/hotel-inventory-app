import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const ReturnModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { accessToken } = useAuth();
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ 
    if (!open) { 
        setQty(1); 
        setRemarks(''); 
    } 
  }, [open]);

  const submit = async () => {
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
      await apiClient.post('/items/return', { 
        itemId: item._id, 
        quantity: qty, 
        remarks 
      }, { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      });
      toast.success('Returned to vendor successfully');
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
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default ReturnModal;