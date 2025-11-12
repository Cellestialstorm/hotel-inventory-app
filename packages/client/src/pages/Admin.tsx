import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { IUSER, IHotel, IDepartment } from '@hotel-inventory/shared';
import UserModal from '@/components/UserModal';
import DepartmentModal from '@/components/DepartmentModal';
import HotelModal from '@/components/HotelModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/axios';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<IUSER[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<IHotel | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<IDepartment | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState({
    users: '',
    hotels: '',
    departments: '',
  });
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUSER | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<'user' | 'department' | 'hotel' | null>(null);


  useEffect(() => {
    loadData();
  }, []);

  const { accessToken } = useAuth();

  const loadData = async () => {
    try {
      if (!accessToken) {
        console.error('No Token found');
        toast.error('You are not authenticated');
        return;
      }

      const [userRes, hotelRes, deptRes] = await Promise.all([
        apiClient.get('/users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        apiClient.get('/hotels', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        apiClient.get('/departments', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      setUsers(userRes.data.data || []);
      setHotels(hotelRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to load data';
      toast.error(msg);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: IUSER) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = (user: IUSER) => {
    setSelectedUser(user);
    setSelectedHotel(null);
    setSelectedDepartment(null);
    setDeleteType('user');
    setDeleteDialogOpen(true);
  };

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setDepartmentModalOpen(true);
  };

  const handleEditDepartment = (department: IDepartment) => {
    setSelectedDepartment(department);
    setDepartmentModalOpen(true);
  };

  const handleDeleteDepartment = (department: IDepartment) => {
    console.log("Deleting department:", department);
    setSelectedDepartment(department);
    setSelectedHotel(null);
    setSelectedUser(null);
    setDeleteType('department');
    setDeleteDialogOpen(true);
  };

  const handleAddHotel = () => {
    setSelectedHotel(null);
    setHotelModalOpen(true);
  };

  const handleDeleteHotel = (hotel: IHotel) => {
    console.log("Deleting hotel:", hotel);
    setSelectedHotel(hotel);
    setSelectedUser(null);
    setSelectedDepartment(null);
    setDeleteType('hotel');
    setDeleteDialogOpen(true);
  };

  const handleEditHotel = (hotel: IHotel) => {
    setSelectedHotel(hotel);
    setHotelModalOpen(true);
  };

  const confirmDelete = async () => {
    
    setDeleteLoading(true);

    try {
      if (!accessToken) {
        toast.error('Authentication token not found.');
        setDeleteLoading(false);
        return;
      }

      if (deleteType === 'user' && selectedUser) {
        await apiClient.delete(`/users/${selectedUser.userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success(`User "${selectedUser.username}" deleted successfully!`);
      }

      if (deleteType === 'department' && selectedDepartment) {
        await apiClient.delete(`/departments/${selectedDepartment.departmentId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success(`Department "${selectedDepartment.name}" deleted successfully!`);
      }

      if (deleteType === 'hotel' && selectedHotel) {
        await apiClient.delete(`/hotels/${selectedHotel._id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success(`Hotel "${selectedHotel.name}" deleted successfully!`);
      }

      loadData();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      const msg = error.response?.data?.message || 'Failed to delete item';
      toast.error(msg);
     } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteType(null);
      setSelectedUser(null);
      setSelectedDepartment(null);
      setSelectedHotel(null);
     }
  };

  const getHotelName = (hotelId?: string) => {
    if (!hotelId) return '-';
    const hotel = hotels.find(h => h._id === hotelId || h.hotelId === hotelId);
    return hotel?.name || '-';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '-';
    const dept = departments.find(d => d._id === departmentId || d.departmentId === departmentId);
    return dept?.name || '-';
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.users.toLowerCase())
  );

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.departments.toLowerCase()) ||
    getHotelName(dept.hotelId).toLowerCase().includes(searchTerm.departments.toLowerCase())
  );

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.hotels.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage users, hotels, and departments</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>User Management</CardTitle>
              <Button className="gap-2" onClick={handleAddUser}>
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm.users}
                    onChange={(e) => setSearchTerm({ ...searchTerm, users: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium">Username</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Hotel</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Department</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{user.username}</td>
                        <td className="py-3 px-4">
                          <Badge variant='default'>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{getHotelName(user.assignedHotelId?.toString() || '')}</td>
                        <td className="py-3 px-4 text-sm">{getDepartmentName(user.assignedDepartmentId?.toString() || '')}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-danger hover:text-danger"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hotel Management</CardTitle>
              <Button className="gap-2" onClick={handleAddHotel}>
                <Plus className="w-4 h-4" />
                Add Hotel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search hotels..."
                    value={searchTerm.hotels}
                    onChange={(e) => setSearchTerm({ ...searchTerm, hotels: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium">Hotel Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Total Departments</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHotels.map((hotel) => {

                      const deptCount = departments.filter(
                        (dept) => dept.hotelId === hotel._id || dept.hotelId === hotel.hotelId
                      ).length;

                      return (
                      <tr key={hotel._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{hotel.name}</td>
                        <td className="py-3 px-4 text-sm">{hotel.location}</td>
                        <td className="py-3 px-4 text-sm">{deptCount}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleEditHotel(hotel)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-danger hover:text-danger"
                              onClick={() => handleDeleteHotel(hotel)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Department Management</CardTitle>
              <Button className="gap-2" onClick={handleAddDepartment}>
                <Plus className="w-4 h-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search departments..."
                    value={searchTerm.departments}
                    onChange={(e) => setSearchTerm({ ...searchTerm, departments: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium">Department Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Hotel Name</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((department) => {
                      const hotelName = getHotelName(department.hotelId)
                      return (
                      <tr key={department._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{department.name}</td>
                        <td className="py-3 px-4 text-sm">{hotelName}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-danger hover:text-danger"
                              onClick={() => handleDeleteDepartment(department)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUser}
        onSave={loadData}
      />

      <DepartmentModal
        open={departmentModalOpen}
        onOpenChange={setDepartmentModalOpen}
        department={selectedDepartment}
        onSave={loadData}
      />

      <HotelModal
        open={hotelModalOpen}
        onOpenChange={setHotelModalOpen}
        hotel={selectedHotel}
        onSave={loadData}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedUser?.username || selectedDepartment?.name || selectedHotel?.name || ''}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Admin;
