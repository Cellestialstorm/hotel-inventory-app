import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IUSER, IHotel, IDepartment } from '@hotel-inventory/shared';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@hotel-inventory/shared';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUSER | null;
  onSave: () => void;
}

const UserModal = ({ open, onOpenChange, user, onSave }: UserModalProps) => {
  useEffect(() => {
    if (open) {
      fetchHotelsAndDepartments();
    }
  }, [open]);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: '',
    assignedHotelId: '',
    assignedDepartmentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<IDepartment[]>([]);

  const { accessToken } = useAuth();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        password: '',
        confirmPassword: '',
        role: user.role || UserRole.HOD,
        assignedHotelId: user.assignedHotelId ? user.assignedHotelId.toString() : '',
        assignedDepartmentId: user.assignedDepartmentId ? user.assignedDepartmentId.toString() : '',
      });
    } else {
      setFormData({
        username: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: UserRole.HOD,
        assignedHotelId: '',
        assignedDepartmentId: '',
      });
    }
    setErrors({});
  }, [user]);

  useEffect(() => {
    if (formData.assignedHotelId && departments.length > 0) {
      const selectedHotel = hotels.find((h) => h.hotelId === formData.assignedHotelId || h._id === formData.assignedHotelId);
      const filtered = departments.filter((dept) => dept.hotelId === selectedHotel?._id || dept.hotelId === formData.assignedHotelId);

      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments([]);
    }
  }, [formData.assignedHotelId, departments, hotels]);

  const fetchHotelsAndDepartments = async () => {
    try {
      if (!accessToken) {
        console.error("No access token found");
        return { hotels: [], departments: [] };
      }

      const [hotelRes, deptRes] = await Promise.all([
        apiClient.get('/hotels', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }),
        apiClient.get('/departments', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }),
      ]);

      const hotels = hotelRes.data.data || [];
      const departments = deptRes.data.data || [];
      setHotels(hotels);
      setDepartments(departments);

      return { hotels, departments };
    } catch (err) {
      toast.error('Failed to load hotels or departments');
      return { hotels: [], departments: [] };
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Full Name Required';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === UserRole.MANAGER || formData.role === UserRole.HOD) {
      if (!formData.assignedHotelId) {
        newErrors.hotelId = 'Hotel is required for non-admin users';
      }
      if (formData.role === UserRole.HOD && !formData.assignedDepartmentId) {
        newErrors.departmentId = 'Department is required for non-admin users';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHotelChange = (hotelId: string) => {
    setFormData({
      ...formData,
      assignedHotelId: hotelId,
      assignedDepartmentId: '',
    });

    const selectedHotel = hotels.find(
      (h) => h.hotelId === hotelId || h._id === hotelId
    )

    const filtered = departments.filter(
      (dept) => dept.hotelId === selectedHotel?._id || dept.hotelId === hotelId
    );

    setFilteredDepartments(filtered);
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim().toLowerCase(),
        name: formData.name.trim(),
        password: formData.password,
        role: formData.role,
        assignedHotelId:
          formData.role !== UserRole.SUPER_ADMIN ? formData.assignedHotelId : undefined,
        assignedDepartmentId:
          formData.role !== UserRole.SUPER_ADMIN && formData.role !== UserRole.MANAGER ? formData.assignedDepartmentId : undefined,
      };

      const headers = {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      };

      if (user) {
        await apiClient.put(`/users/${user.userId}`, payload, { headers });
        toast.success('User updated successfully');
      } else {
        await apiClient.post('/auth/register', payload, { headers });
        toast.success('User registered successfully!');
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to register user. Try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Increased max width slightly so the 2 columns have room to breathe */}
      <DialogContent className="sm:max-w-[600px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        {/* THE FIX: Changed from space-y-4 to a 2-column Grid layout! */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          
          {/* Row 1 */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rohan Sharma"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Login Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
            />
            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
          </div>

          {/* Row 2 */}
          <div className="space-y-2">
            <Label htmlFor="password">Password {!user && '*'}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={user ? 'Leave blank' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-danger">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="text-sm text-danger">{errors.confirmPassword}</p>}
          </div>

          {/* Row 3 */}
          <div className="space-y-2">
            <Label htmlFor="role">User Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value, assignedDepartmentId: value === 'MANAGER' ? '' : formData.assignedDepartmentId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="HOD">Head of Department (HOD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== UserRole.SUPER_ADMIN && (
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel *</Label>
              <Select value={formData.assignedHotelId} onValueChange={(value) => handleHotelChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hotel" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel._id} value={hotel._id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.hotelId && <p className="text-sm text-red-500">{errors.hotelId}</p>}
            </div>
          )}

          {/* Row 4 (Only shows for HOD) - Spans both columns to look clean */}
          {formData.role !== UserRole.SUPER_ADMIN && formData.role === UserRole.HOD && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.assignedDepartmentId} onValueChange={(value) => setFormData({ ...formData, assignedDepartmentId: value })} disabled={!formData.assignedHotelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {filteredDepartments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId}</p>}
            </div>
          )}
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

export default UserModal;