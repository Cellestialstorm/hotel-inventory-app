import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ReorderReport from './ReorderReport';
import { toast } from 'sonner';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('stock');

  const handleExport = () => {
    toast.success('Exporting report...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">View and export various reports</p>
        </div>
        <Button className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
          <TabsTrigger value="history">Item History</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Report</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Stock report content will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item History Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Item history content will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder" className="space-y-4">
          <ReorderReport />
        </TabsContent>

        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumption Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Consumption analysis will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
