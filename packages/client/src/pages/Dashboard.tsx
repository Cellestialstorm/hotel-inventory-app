import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Building2, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, accessToken, selectedHotelId } = useAuth();

  const [totalItems, setTotalItems] = useState(0);
  const [belowMinItems, setBelowMinItems] = useState(0);
  const [criticalItems, setCriticalItems] = useState(0);
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [reorderItems, setReorderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!selectedHotelId && user?.role === UserRole.ADMIN) return;

      const hotelId = user?.role === UserRole.ADMIN ? selectedHotelId : user?.assignedHotelId;
      if (!hotelId) return;

      // Fetch all items for the hotel
      const itemsRes = await apiClient.get('/items', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { hotelId },
      });

      const items = itemsRes.data.data || [];
      setTotalItems(items.length);

      // Below minimum
      const belowMin = items.filter((i: any) => i.currentStock < i.minStock);
      setBelowMinItems(belowMin.length);

      // Critical (below 50% of minStock)
      const critical = items.filter(
        (i: any) => i.currentStock < i.minStock * 0.5
      );
      setCriticalItems(critical.length);

      // Sort by severity and limit to 5
      const sortedReorder = belowMin
        .sort(
          (a: any, b: any) =>
            (a.currentStock / a.minStock) - (b.currentStock / b.minStock)
        )
        .slice(0, 5);
      setReorderItems(sortedReorder);

      // Fetch departments for this hotel
      const deptRes = await apiClient.get('/departments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { hotelId },
      });
      setDepartmentsCount(deptRes.data.data?.length || 0);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotelId, user?.assignedHotelId]);

  const summaryCards = [
    { title: 'Total Items', value: totalItems, icon: Package, color: 'text-primary' },
    { title: 'Below Minimum', value: belowMinItems, icon: AlertTriangle, color: 'text-danger' },
    { title: 'Critical Shortages', value: criticalItems, icon: Flame, color: 'text-warning' },
    { title: 'Departments Active', value: departmentsCount, icon: Building2, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your hotel’s inventory health
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reorder Warning Section */}
          {reorderItems.length > 0 ? (
            <Card className="border-danger">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-danger" />
                      🚨 Urgent Reorder Required
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {belowMinItems} item{belowMinItems !== 1 ? 's' : ''} below
                      minimum stock level
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/reports?tab=reorder')}
                  >
                    View Reports
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Item Name</th>
                        <th className="text-left py-2 px-2 font-medium">Department</th>
                        <th className="text-right py-2 px-2 font-medium">Current</th>
                        <th className="text-right py-2 px-2 font-medium">Minimum</th>
                        <th className="text-right py-2 px-2 font-medium">Shortage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reorderItems.map((item: any) => {
                        const shortage = item.minStock - item.currentStock;
                        return (
                          <tr key={item._id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium">{item.name}</td>
                            <td className="py-3 px-2">{item.departmentId?.name || '-'}</td>
                            <td className="py-3 px-2 text-right text-danger font-semibold">
                              {item.currentStock}
                            </td>
                            <td className="py-3 px-2 text-right">{item.minStock}</td>
                            <td className="py-3 px-2 text-right font-bold text-danger">
                              {shortage}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold mb-2">All Items Sufficiently Stocked</h3>
                <p className="text-muted-foreground">
                  No items are below minimum stock level at this time
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
