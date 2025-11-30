import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import ReorderReport from './ReorderReport';
import ItemReport from './ItemReport';
import StockReport from './StockReport';
import { toast } from 'sonner';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../../../shared/src';

const Reports = () => {
  const { user, accessToken, selectedHotelId } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'stock';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [deptLoading, setDeptLoading] = useState(true);

  const loadDepartments = async () => {
    setDeptLoading(true);
    try {
      const params: any = {};
      if (user?.role === UserRole.ADMIN) {
        if (selectedHotelId) params.hotelId = selectedHotelId;
      } else {
        params.hotelId = user?.assignedHotelId;
      }

      const res = await apiClient.get('/departments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      const list = res.data.data || [];
      setDepartments(list);

      let defaultDept = '';
      if (user?.assignedDepartmentId) {
        defaultDept = user.assignedDepartmentId.toString();
      } else if (list.length > 0) {
        defaultDept = list[0]._id?.toString() ?? '';
      }

      setSelectedDepartment(defaultDept);
    } catch (error: any) {
      console.error('loadDepartments error', error);
      toast.error('Failed to load departments');
      setDepartments([]);
      setSelectedDepartment('');
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [selectedHotelId, user?.assignedHotelId]);

  useEffect(() => {
    if (!selectedDepartment && departments.length > 0) {
      setSelectedDepartment(departments[0]._id.toString());
    }
  }, [departments, selectedDepartment]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [activeTab]);

  if (deptLoading || !selectedDepartment) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading departments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and export inventory reports
          </p>
        </div>
        <Select
          value={selectedDepartment}
          onValueChange={setSelectedDepartment}
          disabled={departments.length === 0}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept._id} value={dept._id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock" className="text-xs sm:text-sm">Stock</TabsTrigger>
          <TabsTrigger value="item" className="text-xs sm:text-sm">Item</TabsTrigger>
          <TabsTrigger value="reorder" className="text-xs sm:text-sm">Reorder</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <StockReport filters={{ selectedDepartment }} />
        </TabsContent>

        <TabsContent value="reorder">
          <ReorderReport filters={{ selectedDepartment }} />
        </TabsContent>

        <TabsContent value="item">
          <ItemReport filters={{ selectedDepartment }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;