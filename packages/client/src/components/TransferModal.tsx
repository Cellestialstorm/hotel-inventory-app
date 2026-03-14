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
import { printReceipt } from '@/utils/printReceipt';

const TransferModal = ({ open, onOpenChange, item, onSave }: any) => {
  const { accessToken, user, selectedHotelId } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [toHotel, setToHotel] = useState<string>('');
  const [toDept, setToDept] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [remarks, setRemarks] = useState<string>(''); 
  const [loading, setLoading] = useState(false);
  
  // State to hold the actual Hotel Name for the receipt (The Origin)
  const [hotelName, setHotelName] = useState('Main Property');

  const itemHotelId = typeof item?.hotelId === 'object' ? item?.hotelId?._id : item?.hotelId;
  const itemDeptId = typeof item?.departmentId === 'object' ? item?.departmentId?._id : item?.departmentId;
  
  useEffect(() => {
    if (!open) {
      setToHotel('');
      setToDept('');
      setQty(1);
      setRemarks('');
    } else {
      if (user?.role === UserRole.HOD && user?.assignedHotelId) {
        setToHotel(user.assignedHotelId.toString());
      }
    }
  }, [open, user]);

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
        const fetchedHotels = res.data.data || [];
        const targetId = user?.role === UserRole.SUPER_ADMIN ? selectedHotelId : user?.assignedHotelId;
        const foundHotel = fetchedHotels.find((h: any) => h._id === targetId || h._id === item?.hotelId);
        if (foundHotel) {
          setHotelName(foundHotel.name);
        }
      } catch (e) {
        console.error("Failed to fetch hotel name for receipt", e);
      }
    };
    fetchHotelName();
  }, [open, item, user, selectedHotelId, accessToken]);

  // Fetch Hotels for Manager/Admin dropdown
  useEffect(() => {
    if (!open) return;
    if (user?.role === UserRole.HOD) return;
    const load = async () => {
      try {
        const h = await apiClient.get('/hotels', { headers: { Authorization: `Bearer ${accessToken}` } });
        setHotels(h.data.data || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, [open, accessToken, user]);

  // Fetch Departments based on selected destination Hotel
  useEffect(() => {
    if (!toHotel) { setDepartments([]); return; }
    const load = async () => {
      try {
        const res = await apiClient.get('/departments', { headers: { Authorization: `Bearer ${accessToken}` }, params: { hotelId: toHotel } });
        setDepartments(res.data.data || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, [toHotel, accessToken]);

  const submit = async (shouldPrint: boolean = false) => {
    if (!qty || qty <= 0) { toast.error('Quantity invalid'); return; }
    if (!toDept) { toast.error('Please select a destination department'); return; }
    
    setLoading(true);
    try {
      const res = await apiClient.post('/items/transfer', { 
        itemId: item._id, 
        toHotelId: toHotel || undefined, 
        toDepartmentId: toDept || undefined, 
        quantity: qty,
        remarks: remarks 
      }, { headers: { Authorization: `Bearer ${accessToken}` } });
      
      toast.success('Transfer complete');

      // --- ADVANCED PRINT RECEIPT LOGIC ---
      if (shouldPrint) {
        const destDept = departments.find(d => d._id === toDept);
        const destHotelObj = hotels.find(h => h._id === toHotel);
        
        // If they are an HOD (hotels array is empty), or the dest hotel matches origin, it's internal.
        const destHotelName = destHotelObj ? destHotelObj.name : hotelName;
        const isExternal = hotelName !== destHotelName;

        const originDeptName = item?.departmentId?.name || 'Origin Dept';
        const destDeptName = destDept?.name || 'Dest Dept';

        printReceipt({
          txId: res.data?.data?.transaction?._id,
          // If external, show "Hotel A ➔ Hotel B". If internal, just show "Hotel A"
          hotelName: isExternal ? `${hotelName} ➔ ${destHotelName}` : hotelName, 
          // Always show "Dept A ➔ Dept B"
          departmentName: `${originDeptName} ➔ ${destDeptName}`, 
          itemName: item?.name,
          actionText: isExternal ? 'EXTERNAL TRANSFER' : 'INTERNAL TRANSFER',
          quantity: qty,
          createdBy: user?.name || user?.username || 'System',
          designation: user?.role,
          remarks: remarks || (isExternal ? 'Cross-Property Transfer' : 'Internal Department Transfer')
        });
      }

      onSave(); 
      onOpenChange(false);
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Failed transfer'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Transfer Inventory</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground">Item</Label>
            <div className="font-medium text-lg">{item?.name}</div>
            <div className="text-xs text-muted-foreground mt-1">Current Stock: {item?.currentStock}</div>
          </div>
          
          {user?.role !== UserRole.HOD && (
            <div>
              <Label>To Hotel</Label>
              <Select value={toHotel} onValueChange={(v: any) => { setToHotel(v); setToDept(''); }}>
                <SelectTrigger><SelectValue placeholder="Select destination hotel" /></SelectTrigger>
                <SelectContent>
                  {hotels.map((h: any) => (<SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label>To Department</Label>
            <Select value={toDept} onValueChange={(v: any) => setToDept(v)} disabled={!toHotel}>
              <SelectTrigger><SelectValue placeholder="Select destination dept" /></SelectTrigger>
              <SelectContent>
                {departments
                  .filter((d: any) => {
                    const isInternalTransfer = toHotel === itemHotelId?.toString();
                    if (isInternalTransfer && d._id.toString() === itemDeptId?.toString()) {
                      return false;
                    }
                    return true;
                  })
                  .map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Quantity to Transfer</Label>
            <Input type="number" min="1" max={item?.currentStock || 1} value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>

          <div>
            <Label>Reason / Remarks (Optional)</Label>
            <Input 
              placeholder="e.g., Covering a shortage, Event supplies..." 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
            />
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
            {loading ? 'Processing...' : 'Save & Print Receipt'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
export default TransferModal;