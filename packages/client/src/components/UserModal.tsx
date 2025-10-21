import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IUser, IHotel, IDepartment } from '@/types';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUser | null;
  onSave: () => void;
}

const UserModal = ({ open, onOpenChange, user, onSave }: UserModalProps) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'STAFF' as 'ADMIN' | 'MANAGER' | 'STAFF',
    hotelId: '',
    departmentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);

  useEffect(() => {
    if (open) {
      const allHotels: IHotel[] = JSON.parse(localStorage.getItem('hotels') || '[]');
      const allDepartments: IDepartment[] = JSON.parse(localStorage.getItem('departments') || '[]');
      setHotels(allHotels);
      setDepartments(allDepartments);
    }

    if (user) {
      setFormData({
        username: user.username,
        password: '',
        confirmPassword: '',
        role: user.role,
        hotelId: user.hotelId || '',
        departmentId: user.departmentId || '',
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'STAFF',
        hotelId: '',
        departmentId: '',
      });
    }
    setErrors({});
  }, [user, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
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

    if (formData.role !== 'ADMIN') {
      if (!formData.hotelId) {
        newErrors.hotelId = 'Hotel is required for non-admin users';
      }
      if (!formData.departmentId) {
        newErrors.departmentId = 'Department is required for non-admin users';
      }
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
      const users: IUser[] = JSON.parse(localStorage.getItem('users') || '[]');

      if (user) {
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users[index] = {
            ...users[index],
            username: formData.username,
            role: formData.role,
            hotelId: formData.role !== 'ADMIN' ? formData.hotelId : undefined,
            departmentId: formData.role !== 'ADMIN' ? formData.departmentId : undefined,
          };
        }
        toast.success('User updated successfully');
      } else {
        const newUser: IUser = {
          id: 'u' + Date.now(),
          username: formData.username,
          role: formData.role,
          hotelId: formData.role !== 'ADMIN' ? formData.hotelId : undefined,
          departmentId: formData.role !== 'ADMIN' ? formData.departmentId : undefined,
          isActive: true,
        };
        users.push(newUser);
        toast.success('User created successfully');
      }

      localStorage.setItem('users', JSON.stringify(users));
      setLoading(false);
      onSave();
      onOpenChange(false);
    }, 500);
  };

  const filteredDepartments = departments.filter(d => d.hotelId === formData.hotelId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
            />
            {errors.username && <p className="text-sm text-danger">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password {!user && '*'}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
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

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value, hotelId: '', departmentId: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== 'ADMIN' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel *</Label>
                <Select value={formData.hotelId} onValueChange={(value) => setFormData({ ...formData, hotelId: value, departmentId: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hotelId && <p className="text-sm text-danger">{errors.hotelId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-sm text-danger">{errors.departmentId}</p>}
              </div>
            </>
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
