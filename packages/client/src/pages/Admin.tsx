import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { IUSER, IHotel, IDepartment } from '../../../shared/src';
import UserModal from '../components/UserModal';
import DepartmentModal from '../components/DepartmentModal';
import HotelModal from '../components/HotelModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<IUSER[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<IHotel | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<IDepartment | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  
  // Search terms
  const [searchTerm, setSearchTerm] = useState({
    users: '',
    hotels: '',
    departments: '',
  });

  // Filter states
  const [filterHotel, setFilterHotel] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('all');

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

  // Set initial hotel filter when hotels load
  useEffect(() => {
    if (hotels.length > 0 && !filterHotel) {
      setFilterHotel(hotels[0]._id);
    }
  }, [hotels, filterHotel]);

  // Reset filters when tab changes
  useEffect(() => {
    setFilterDept('all');
  }, [activeTab]);

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

  const getHotelName = (hotelId?: string | any) => {
    if (!hotelId) return '-';
    const id = typeof hotelId === 'object' ? hotelId._id : hotelId;
    const hotel = hotels.find(h => h._id === id || h.hotelId === id);
    return hotel?.name || '-';
  };

  const getDepartmentName = (departmentId?: string | any) => {
    if (!departmentId) return '-';
    const id = typeof departmentId === 'object' ? departmentId._id : departmentId;
    const dept = departments.find(d => d._id === id || d.departmentId === id);
    return dept?.name || '-';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.users.toLowerCase());
    
    const userHotelId = typeof user.assignedHotelId === 'object' ? (user.assignedHotelId as any)._id : user.assignedHotelId;
    const matchesHotel = filterHotel ? userHotelId === filterHotel : true;

    const userDeptId = typeof user.assignedDepartmentId === 'object' ? (user.assignedDepartmentId as any)._id : user.assignedDepartmentId;
    const matchesDept = filterDept && filterDept !== 'all' ? userDeptId === filterDept : true;

    return matchesSearch && matchesHotel && matchesDept;
  });

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.departments.toLowerCase()) ||
    getHotelName(dept.hotelId).toLowerCase().includes(searchTerm.departments.toLowerCase());
    
    const deptHotelId = typeof dept.hotelId === 'object' ? (dept.hotelId as any)._id : dept.hotelId;
    const matchesHotel = filterHotel ? deptHotelId === filterHotel : true;
    
    return matchesSearch && matchesHotel;
  });

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.hotels.toLowerCase())
  );

  // Helper to get departments for specific hotel filter
  const getFilteredDeptsForSelect = () => {
    if (!filterHotel) return departments;
    return departments.filter(d => {
        const hId = typeof d.hotelId === 'object' ? (d.hotelId as any)._id : d.hotelId;
        return hId === filterHotel;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage users, hotels, and departments</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Evenly spread tabs as requested */}
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>User Management</CardTitle>
              <Button className="gap-2" size="sm" onClick={handleAddUser}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add User</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm.users}
                    onChange={(e) => setSearchTerm({ ...searchTerm, users: e.target.value })}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterHotel || (hotels.length > 0 ? hotels[0]._id : '')} onValueChange={(v) => { setFilterHotel(v); setFilterDept('all'); }}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select Hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(h => <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filterDept} onValueChange={setFilterDept} disabled={!filterHotel}>
                   <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {getFilteredDeptsForSelect().map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium min-w-[120px]">Username</th>
                      <th className="text-left p-3 font-medium min-w-[150px] md:w-1/4">Hotel</th>
                      <th className="text-left p-3 font-medium min-w-[150px] md:w-1/4">Department</th>
                      <th className="text-center p-3 font-medium min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{user.username}</td>
                        <td className="p-3 truncate max-w-[150px] md:max-w-xs" title={getHotelName(user.assignedHotelId)}>
                          {getHotelName(user.assignedHotelId)}
                        </td>
                        <td className="p-3 truncate max-w-[150px] md:max-w-xs" title={getDepartmentName(user.assignedDepartmentId)}>
                          {getDepartmentName(user.assignedDepartmentId)}
                        </td>
                        <td className="p-3 text-center">
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

        <TabsContent value="hotels" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hotel Management</CardTitle>
              <Button className="gap-2" size="sm" onClick={handleAddHotel}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Hotel</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
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
                <table className="w-full whitespace-nowrap text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium min-w-[150px]">Hotel Name</th>
                      <th className="text-left p-3 font-medium min-w-[150px]">Location</th>
                      <th className="text-left p-3 font-medium min-w-[120px]">Total Departments</th>
                      <th className="text-center p-3 font-medium min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHotels.map((hotel) => {

                      const deptCount = departments.filter(
                        (dept) => {
                          const hId = typeofQHId(dept.hotelId);
                          return hId === hotel._id;
                        }
                      ).length;
                      
                      // Helper to avoid complex expression in filter
                      function typeofQHId(id: any) { return typeof id === 'object' ? id._id : id; }

                      return (
                      <tr key={hotel._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{hotel.name}</td>
                        <td className="p-3">{hotel.location}</td>
                        <td className="p-3">{deptCount}</td>
                        <td className="p-3 text-center">
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

        <TabsContent value="departments" className="space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Department Management</CardTitle>
              <Button className="gap-2" size="sm" onClick={handleAddDepartment}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Department</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search departments..."
                    value={searchTerm.departments}
                    onChange={(e) => setSearchTerm({ ...searchTerm, departments: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <Select value={filterHotel || (hotels.length > 0 ? hotels[0]._id : '')} onValueChange={setFilterHotel}>
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Select Hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(h => <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium min-w-[150px]">Department Name</th>
                      <th className="text-left p-3 font-medium min-w-[150px]">Hotel Name</th>
                      <th className="text-center p-3 font-medium min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((department) => {
                      const hotelName = getHotelName(department.hotelId)
                      return (
                      <tr key={department._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{department.name}</td>
                        <td className="p-3">{hotelName}</td>
                        <td className="p-3 text-center">
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