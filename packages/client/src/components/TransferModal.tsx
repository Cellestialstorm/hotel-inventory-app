import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TransferModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { accessToken } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [toHotel, setToHotel] = useState<string>('');
  const [toDept, setToDept] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (!open) { setToHotel(''); setToDept(''); setQty(1); } }, [open]);

  useEffect(()=>{
    if (!open) return;
    const load = async () => {
      try {
        const h = await apiClient.get('/hotels', { headers: { Authorization: `Bearer ${accessToken}` }});
        setHotels(h.data.data || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, [open, accessToken]);

  useEffect(()=>{
    if (!toHotel) { setDepartments([]); return; }
    const load = async () => {
      try {
        const res = await apiClient.get('/departments', { headers: { Authorization: `Bearer ${accessToken}` }, params: { hotelId: toHotel }});
        setDepartments(res.data.data || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, [toHotel, accessToken]);

  const submit = async () => {
    if (!qty || qty <= 0) { toast.error('Quantity invalid'); return; }
    setLoading(true);
    try {
      await apiClient.post('/items/transfer', { itemId: item._id, toHotelId: toHotel || undefined, toDepartmentId: toDept || undefined, quantity: qty }, { headers: { Authorization: `Bearer ${accessToken}` }});
      toast.success('Transfer complete');
      onSave(); onOpenChange(false);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed transfer'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Transfer</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Item</Label><div>{item?.name}</div></div>
          <div>
            <Label>To Hotel</Label>
            <Select value={toHotel} onValueChange={(v:any)=>setToHotel(v)}>
              <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
              <SelectContent>{hotels.map((h:any)=>(<SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>To Department</Label>
            <Select value={toDept} onValueChange={(v:any)=>setToDept(v)}>
              <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
              <SelectContent>{departments.map((d:any)=>(<SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div><Label>Quantity</Label><Input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading?'Transferring...':'Transfer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default TransferModal;