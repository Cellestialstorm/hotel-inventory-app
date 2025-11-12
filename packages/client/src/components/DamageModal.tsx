import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const DamageModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { accessToken } = useAuth();
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (!open) { setQty(1); setRemarks(''); } }, [open]);

  const submit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/items/damage', { itemId: item._id, quantity: qty, remarks }, { headers: { Authorization: `Bearer ${accessToken}` }});
      toast.success('Damage recorded');
      onSave(); onOpenChange(false);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Report Damage</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Item</Label><div>{item?.name}</div></div>
          <div><Label>Quantity</Label><Input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} min={1} /></div>
          <div><Label>Remarks</Label><Input value={remarks} onChange={e=>setRemarks(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading?'Saving...':'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default DamageModal;