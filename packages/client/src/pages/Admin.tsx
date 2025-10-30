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

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<IUSER[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<IHotel | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<IDepartment | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUSER | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers: IUSER[] = JSON.parse(localStorage.getItem('users') || '[]');
    const allHotels: IHotel[] = JSON.parse(localStorage.getItem('hotels') || '[]');
    const allDepartments: IDepartment[] = JSON.parse(localStorage.getItem('departments') || '[]');
    
    setUsers(allUsers);
    setHotels(allHotels);
    setDepartments(allDepartments);
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
    setDeleteDialogOpen(true);
  };

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setDepartmentModalOpen(true);
  };

  const handleAddHotel = () => {
    setSelectedHotel(null);
    setHotelModalOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    
    setDeleteLoading(true);
    setTimeout(() => {
      const users: IUSER[] = JSON.parse(localStorage.getItem('users') || '[]');
      const filtered = users.filter(u => u.id !== selectedUser.id);
      localStorage.setItem('users', JSON.stringify(filtered));
      
      toast.success('User deleted successfully');
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      loadData();
    }, 500);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getHotelName = (hotelId?: string) => {
    if (!hotelId) return '-';
    const hotel = hotels.find(h => h.hotelId === hotelId);
    return hotel?.name || '-';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '-';
    const dept = departments.find(d => d.hotelId === departmentId);
    return dept?.name || '-';
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                      <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{user.username}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
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
              <p className="text-muted-foreground">Hotel management content will be displayed here</p>
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
              <p className="text-muted-foreground">Department management content will be displayed here</p>
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
        itemName={selectedUser?.username || ''}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Admin;
