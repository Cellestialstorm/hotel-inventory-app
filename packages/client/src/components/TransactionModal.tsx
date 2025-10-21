import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IItem, ITransaction, TransactionType, IDepartment, IHotel } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: IItem | null;
  onSave: () => void;
}

const transactionTypes = [
  { value: TransactionType.OPENING_BALANCE, label: 'Opening Balance' },
  { value: TransactionType.ADDED, label: 'Add Stock' },
  { value: TransactionType.RETURNED_TO_VENDOR, label: 'Return to Vendor' },
  { value: TransactionType.DAMAGE, label: 'Record Damage' },
  { value: TransactionType.TRANSFER_OUT_DEPT, label: 'Transfer to Department' },
  { value: TransactionType.TRANSFER_OUT_HOTEL, label: 'Transfer to Hotel' },
];

const TransactionModal = ({ open, onOpenChange, item, onSave }: TransactionModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: '' as TransactionType | '',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    toDepartmentId: '',
    toHotelId: '',
  });
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);

  useEffect(() => {
    if (open) {
      const allDepartments: IDepartment[] = JSON.parse(localStorage.getItem('departments') || '[]');
      const allHotels: IHotel[] = JSON.parse(localStorage.getItem('hotels') || '[]');
      setDepartments(allDepartments);
      setHotels(allHotels);
    } else {
      // Reset on close
      setStep(1);
      setFormData({
        transactionType: '',
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        toDepartmentId: '',
        toHotelId: '',
      });
    }
  }, [open]);

  const calculateNewStock = () => {
    if (!item || !formData.transactionType) return item?.currentStock || 0;

    const current = item.currentStock;
    const qty = formData.quantity;

    switch (formData.transactionType) {
      case TransactionType.OPENING_BALANCE:
      case TransactionType.ADDED:
        return current + qty;
      case TransactionType.RETURNED_TO_VENDOR:
      case TransactionType.DAMAGE:
      case TransactionType.TRANSFER_OUT_DEPT:
      case TransactionType.TRANSFER_OUT_HOTEL:
        return current - qty;
      default:
        return current;
    }
  };

  const handleSubmit = () => {
    if (!item) return;

    setLoading(true);

    setTimeout(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const items: IItem[] = JSON.parse(localStorage.getItem('items') || '[]');
      const transactions: ITransaction[] = JSON.parse(localStorage.getItem('transactions') || '[]');

      // Create transaction
      const newTransaction: ITransaction = {
        id: 't' + Date.now(),
        itemId: item.id,
        transactionType: formData.transactionType as TransactionType,
        quantity: formData.quantity,
        date: new Date(formData.date),
        notes: formData.notes,
        performedBy: currentUser.id,
        toDepartmentId: formData.toDepartmentId || undefined,
        toHotelId: formData.toHotelId || undefined,
      };

      transactions.push(newTransaction);

      // Update item stock
      const itemIndex = items.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        items[itemIndex].currentStock = calculateNewStock();
      }

      localStorage.setItem('transactions', JSON.stringify(transactions));
      localStorage.setItem('items', JSON.stringify(items));

      toast.success('Transaction recorded successfully');
      setLoading(false);
      onSave();
      onOpenChange(false);
    }, 500);
  };

  const filteredDepartments = departments.filter(d => 
    formData.toHotelId ? d.hotelId === formData.toHotelId : d.hotelId === item?.hotelId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Transaction - {item?.itemName}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <Label>Select Transaction Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {transactionTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    formData.transactionType === type.value ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, transactionType: type.value })}
                >
                  <CardContent className="p-4">
                    <p className="font-medium text-sm">{type.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                placeholder="Enter quantity"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {(formData.transactionType === TransactionType.TRANSFER_OUT_DEPT) && (
              <div className="space-y-2">
                <Label htmlFor="toDepartment">Destination Department *</Label>
                <Select value={formData.toDepartmentId} onValueChange={(value) => setFormData({ ...formData, toDepartmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.filter(d => d.id !== item?.departmentId).map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.transactionType === TransactionType.TRANSFER_OUT_HOTEL) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="toHotel">Destination Hotel *</Label>
                  <Select value={formData.toHotelId} onValueChange={(value) => setFormData({ ...formData, toHotelId: value, toDepartmentId: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.filter(h => h.id !== item?.hotelId).map(hotel => (
                        <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.toHotelId && (
                  <div className="space-y-2">
                    <Label htmlFor="toDepartment">Destination Department *</Label>
                    <Select value={formData.toDepartmentId} onValueChange={(value) => setFormData({ ...formData, toDepartmentId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>

            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Current Stock:</span>
                  <span className="font-bold">{item?.currentStock} {item?.unit}</span>
                </div>
                <div className="flex items-center justify-center my-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>After Transaction:</span>
                  <span className="font-bold text-primary">{calculateNewStock()} {item?.unit}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold text-lg">Confirm Transaction</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item:</span>
                <span className="font-medium">{item?.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {transactionTypes.find(t => t.value === formData.transactionType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{formData.quantity} {item?.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{formData.date}</span>
              </div>
              {formData.notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="font-medium">{formData.notes}</span>
                </div>
              )}
            </div>
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">New Stock Level:</span>
                  <span className="font-bold text-lg text-primary">
                    {calculateNewStock()} {item?.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              disabled={step === 1 && !formData.transactionType || step === 2 && formData.quantity <= 0}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Recording...' : 'Confirm'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
