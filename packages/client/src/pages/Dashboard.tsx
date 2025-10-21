import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { IItem } from '@/types';
import { getReorderItems } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [reorderItems, setReorderItems] = useState<IItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsBelowMin, setItemsBelowMin] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const items: IItem[] = JSON.parse(localStorage.getItem('items') || '[]');
    
    let filteredItems = items;
    if (currentUser.hotelId) {
      filteredItems = filteredItems.filter(item => item.hotelId === currentUser.hotelId);
    }
    if (currentUser.departmentId) {
      filteredItems = filteredItems.filter(item => item.departmentId === currentUser.departmentId);
    }

    setTotalItems(filteredItems.length);
    
    const reorder = getReorderItems(currentUser.hotelId, currentUser.departmentId);
    setReorderItems(reorder.slice(0, 5)); // Show top 5
    setItemsBelowMin(reorder.length);
  }, []);

  const summaryCards = [
    { title: 'Total Items', value: totalItems, icon: Package, color: 'text-primary' },
    { title: 'Below Minimum', value: itemsBelowMin, icon: AlertTriangle, color: 'text-danger' },
    { title: 'Stock Value', value: '$125,450', icon: DollarSign, color: 'text-success' },
    { title: 'Last Updated', value: 'Just now', icon: Clock, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your inventory status</p>
      </div>

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

      {reorderItems.length > 0 && (
        <Card className="border-danger">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  🚨 Urgent Reorder Required
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {itemsBelowMin} item{itemsBelowMin !== 1 ? 's' : ''} below minimum stock level
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium">Item Code</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Item Name</th>
                    <th className="text-right py-2 px-2 text-sm font-medium">Current</th>
                    <th className="text-right py-2 px-2 text-sm font-medium">Minimum</th>
                    <th className="text-right py-2 px-2 text-sm font-medium">Shortage</th>
                    <th className="text-left py-2 px-2 text-sm font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.map((item) => (
                    <tr key={item.id} className="border-b bg-danger/10">
                      <td className="py-3 px-2 text-sm font-medium">{item.itemCode}</td>
                      <td className="py-3 px-2 text-sm">{item.itemName}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-danger">
                        {item.currentStock}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">{item.minimumStock}</td>
                      <td className="py-3 px-2 text-sm text-right font-bold text-danger">
                        {item.minimumStock - item.currentStock}
                      </td>
                      <td className="py-3 px-2 text-sm">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reorderItems.length === 0 && (
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
    </div>
  );
};

export default Dashboard;
