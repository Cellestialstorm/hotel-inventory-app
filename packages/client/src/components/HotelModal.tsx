import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IHotel } from '@hotel-inventory/shared';
import { toast } from 'sonner';
import apiClient from '@/api/axios';

interface HotelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel?: IHotel | null;
  onSave: () => void;
}

const HotelModal = ({ open, onOpenChange, hotel, onSave }: HotelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        location: hotel.location || '',
      });
    } else {
      setFormData({
        name: '',
        location: '',
      });
    }
    setErrors({});
  }, [open, hotel]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hotel Name is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        location: formData.location,
      };

      if (hotel) {
        await apiClient.put(`/hotels/${hotel._id}`, payload, {
          headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
        });
      } else {
        await apiClient.post('/hotels', payload, {
          headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
        });
      }
      toast.success(hotel ? 'Hotel updated successfully!' : 'Hotel created successfully!');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to create hotel. Try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{hotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Hotel Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter hotel name"
            />
            {errors.name && <p className="text-sm text-danger">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter hotel location"
            />
            {errors.location && <p className="text-sm text-danger">{errors.location}</p>}
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

export default HotelModal;
