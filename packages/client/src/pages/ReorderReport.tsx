import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2 } from 'lucide-react';
import apiClient from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '@hotel-inventory/shared';

interface ReportProps {
  filters: {
    selectedDepartment: string;
  };
}

const ReorderReport = ({ filters }: ReportProps) => {
  const { selectedDepartment } = filters;
  const { user, accessToken, selectedHotelId } = useAuth();
  const [reorderItems, setReorderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReorderItems = async (isInitial = false) => {
    if (isInitial) setLoading(true);

    try {
      if (user?.role === UserRole.SUPER_ADMIN && !selectedHotelId) {
        setReorderItems([]);
        setLoading(false); 
        return;
      }

      const params: any = {};
      if (user?.role === UserRole.SUPER_ADMIN) params.hotelId = selectedHotelId;
      else {
        if (user?.assignedHotelId) params.hotelId = user.assignedHotelId;
      }

      if (selectedDepartment !== 'all') {
        params.departmentId = selectedDepartment;
      }

      const res = await apiClient.get('/items', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      const items = res.data.data || [];
      const filtered = items.filter((i: any) => i.currentStock < i.minStock);
      setReorderItems(filtered);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReorderItems(true);
  }, [selectedHotelId, user?.assignedHotelId, selectedDepartment]);

  const getUrgencyBadge = (item: any) => {
    const shortage = item.minStock - item.currentStock;
    const percentShort = (shortage / item.minStock) * 100;
    if (percentShort > 80) return <Badge variant="destructive">Critical</Badge>;
    if (percentShort > 50) return <Badge className="bg-warning text-warning-foreground">High</Badge>;
    return <Badge variant="secondary">Medium</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-danger" />
              <div>
                <CardTitle>Reorder Report</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {reorderItems.length} item
                  {reorderItems.length !== 1 ? 's' : ''} below minimum stock
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary/60 mb-4" />
              <p className="text-sm font-medium">Report Loading...</p>
              <p className="text-xs opacity-70 mt-1">This will just take a second</p>
            </div>
          ) : reorderItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">
                All Items Sufficiently Stocked
              </h3>
              <p className="text-muted-foreground">
                No items are below minimum stock level at this time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Item Name</th>
                    <th className="text-right py-3 px-4">Current</th>
                    <th className="text-right py-3 px-4">Minimum</th>
                    <th className="text-right py-3 px-4">Shortage</th>
                    <th className="text-center py-3 px-4">Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.map((item) => {
                    const shortage = item.minStock - item.currentStock;
                    return (
                      <tr
                        key={item._id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-right text-danger font-semibold">
                          {item.currentStock}
                        </td>
                        <td className="py-3 px-4 text-right">{item.minStock}</td>
                        <td className="py-3 px-4 text-right text-danger font-semibold">
                          {shortage}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getUrgencyBadge(item)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReorderReport;
