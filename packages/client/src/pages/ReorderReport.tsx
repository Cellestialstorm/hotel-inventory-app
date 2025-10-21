import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, AlertTriangle } from 'lucide-react';
import { IItem } from '@/types';
import { getReorderItems } from '@/lib/mockData';
import { toast } from 'sonner';

const ReorderReport = () => {
  const [reorderItems, setReorderItems] = useState<IItem[]>([]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const items = getReorderItems(currentUser.hotelId, currentUser.departmentId);
    setReorderItems(items);
  }, []);

  const getUrgencyBadge = (item: IItem) => {
    const shortage = item.minimumStock - item.currentStock;
    const percentageShort = (shortage / item.minimumStock) * 100;

    if (percentageShort > 80) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (percentageShort > 50) {
      return <Badge className="bg-warning text-warning-foreground">High</Badge>;
    } else {
      return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const handleExport = () => {
    toast.success('Exporting reorder report...');
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
                  {reorderItems.length} item{reorderItems.length !== 1 ? 's' : ''} below minimum stock
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reorderItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">All Items Sufficiently Stocked</h3>
              <p className="text-muted-foreground">
                No items are below minimum stock level at this time
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium">Item Code</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Item Name</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Current</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Minimum</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Shortage</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Unit</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.map((item) => {
                    const shortage = item.minimumStock - item.currentStock;
                    return (
                      <tr key={item.id} className="border-b bg-danger/10 hover:bg-danger/20 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{item.itemCode}</td>
                        <td className="py-3 px-4 text-sm">{item.itemName}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-danger">
                          {item.currentStock}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">{item.minimumStock}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-danger">
                          {shortage}
                        </td>
                        <td className="py-3 px-4 text-sm">{item.unit}</td>
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
