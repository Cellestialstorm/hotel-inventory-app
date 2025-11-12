import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
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
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchReorderItems = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setItemsLoading(true);

    try {
      if (user?.role === UserRole.ADMIN && !selectedHotelId) {
        setReorderItems([]);
        if (isInitial) setLoading(true);
        else setItemsLoading(true);
        return;
      }

      const params: any = {};
      if (user?.role === UserRole.ADMIN) params.hotelId = selectedHotelId;
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
      if (isInitial) setLoading(false);
      else setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchReorderItems(true);
  }, [selectedHotelId, user?.assignedHotelId]);

  useEffect(() => {
    fetchReorderItems(false);
  }, [selectedDepartment]);

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
            <div className="text-center py-12">Loading initial data...</div>
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
              {itemsLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
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
