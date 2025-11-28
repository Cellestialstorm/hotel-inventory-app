import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Home, Package, BarChart3, Settings, LogOut, User, Menu, X } from 'lucide-react';
import { IHotel } from '@hotel-inventory/shared';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';
import apiClient from '@/api/axios';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, selectedHotelId, setSelectedHotelId, accessToken } = useAuth()

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) return;

    const fetchHotels = async () => {
      try {
        const res = await apiClient.get('/hotels', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setHotels(res.data.data || []);
      } catch (error: any) {
        toast.error('Failed to load hotels');
      }
    };
    fetchHotels();
  }, [user, accessToken]);

  useEffect(() => {
    if (selectedHotelId) {
      localStorage.setItem('selectedHotelId', selectedHotelId);
    } else {
      localStorage.removeItem('selectedHotelId');
    }
  }, [selectedHotelId]);

  const handleLogout = () => logout();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    ...(user?.role === UserRole.ADMIN ? [{ name: 'Admin', path: '/admin', icon: Settings }] : []),
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'destructive';
      case UserRole.USER:
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-16 items-center px-4 gap-4 justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="flex items-center gap-2 font-semibold text-lg">
            <Package className="w-6 h-6 text-primary" />
            <span className="hidden sm:inline">Hotel Inventory</span>
          </div>

          <div className="flex-1 flex items-center gap-2 justify-end">
            {user?.role === UserRole.ADMIN && (
              <>
                <Select value={selectedHotelId ?? undefined} onValueChange={(v) => setSelectedHotelId(v)}>
                  <SelectTrigger className="w-[180px] shrink-0">
                    <SelectValue placeholder="Select Hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <Badge variant={getRoleBadgeVariant(user?.role || '')} className="w-fit">
                      {user?.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-danger">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar transition-transform duration-300 flex flex-col ${ // ADDED: flex flex-col
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <nav className="flex flex-col gap-1 p-4 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`justify-start gap-3 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'
                    }`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          <div className="p-4 pt-2 text-xs text-sidebar-foreground/50 border-t border-sidebar-border">
            Made by students of Medhavi
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
            {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;