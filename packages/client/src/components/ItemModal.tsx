import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IItem } from '@/types';
import { toast } from 'sonner';

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: IItem | null;
  onSave: () => void;
}

const categories = ['Housekeeping', 'Kitchen', 'Restaurant', 'Bar', 'Maintenance'];
const units = ['kg', 'liters', 'pieces', 'boxes', 'sets', 'rolls'];

const ItemModal = ({ open, onOpenChange, item, onSave }: ItemModalProps) => {
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    category: '',
    unit: '',
    minimumStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        unit: item.unit,
        minimumStock: item.minimumStock,
      });
    } else {
      setFormData({
        itemCode: '',
        itemName: '',
        category: '',
        unit: '',
        minimumStock: 0,
      });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    if (!formData.itemCode.trim()) {
      newErrors.itemCode = 'Item code is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    if (formData.minimumStock < 0) {
      newErrors.minimumStock = 'Minimum stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const items: IItem[] = JSON.parse(localStorage.getItem('items') || '[]');

      if (item) {
        // Update existing item
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          items[index] = { ...items[index], ...formData };
        }
        toast.success('Item updated successfully');
      } else {
        // Create new item
        const newItem: IItem = {
          id: 'i' + Date.now(),
          ...formData,
          currentStock: 0,
          hotelId: currentUser.hotelId || localStorage.getItem('selectedHotel') || '',
          departmentId: currentUser.departmentId || localStorage.getItem('selectedDepartment') || '',
        };
        items.push(newItem);
        toast.success('Item created successfully');
      }

      localStorage.setItem('items', JSON.stringify(items));
      setLoading(false);
      onSave();
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name *</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              placeholder="Enter item name"
            />
            {errors.itemName && <p className="text-sm text-danger">{errors.itemName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemCode">Item Code *</Label>
            <Input
              id="itemCode"
              value={formData.itemCode}
              onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
              placeholder="Enter item code"
            />
            {errors.itemCode && <p className="text-sm text-danger">{errors.itemCode}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-danger">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit && <p className="text-sm text-danger">{errors.unit}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumStock">Minimum Stock *</Label>
            <Input
              id="minimumStock"
              type="number"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
              placeholder="Enter minimum stock"
              min="0"
            />
            {errors.minimumStock && <p className="text-sm text-danger">{errors.minimumStock}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
