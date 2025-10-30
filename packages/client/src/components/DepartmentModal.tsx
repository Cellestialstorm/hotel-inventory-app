import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IHotel, IDepartment } from '@hotel-inventory/shared';
import { toast } from 'sonner';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: IDepartment | null;
  onSave: () => void;
}

const DepartmentModal = ({ open, onOpenChange, department, onSave }: UserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    hotelId: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hotels, setHotels] = useState<IHotel[]>([]);

  const { accessToken } = useAuth();

  useEffect(() => {
    if (open) {
      fetchHotelsAndDepartments();

      if (department) {
        setFormData({
          name: department?.name || '',
          hotelId: department?.hotelId || '',
        });
      } else {
        setFormData({
          name: '',
          hotelId: '',
        });
      }
      setErrors({});
    }
  }, [open, department]);

  const fetchHotelsAndDepartments = async () => {
    try {
      if (!accessToken) {
        console.error("No access token found");
        return
      }

      const [hotelRes] = await Promise.all([
        apiClient.get('/hotels', {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
        }),
      ]);
      setHotels(hotelRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load hotels or departments');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.hotelId) {
      newErrors.hotelId = 'Hotel is required';
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

    try {
      const payload = {
        name: formData.name,
        hotelId: formData.hotelId,
      };

      apiClient.post('/departments', payload, {
        headers: {Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`}
      });
      toast.success('Department created successfully!');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to create department. Try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter department name"
            />
            {errors.name && <p className="text-sm text-danger">{errors.name}</p>}
          </div>

          <div className="space-y-2">
                <Label htmlFor="hotel">Hotel *</Label>
                <Select value={formData.hotelId} onValueChange={(value) => setFormData({ ...formData, hotelId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.hotelId} value={hotel.hotelId}>{hotel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hotelId && <p className="text-sm text-danger">{errors.hotelId}</p>}
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

export default DepartmentModal;
