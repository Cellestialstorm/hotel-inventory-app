import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { UserRole } from '@hotel-inventory/shared';

interface ItemProps {
  filters: {
    selectedDepartment: string;
  };
}

const ItemReport = ({ filters }: ItemProps) => {
  const { selectedDepartment } = filters;
  const { accessToken, user, selectedHotelId } = useAuth();

  const getTodayString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };
  const [today] = useState(getTodayString());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const mandatoryColumns = [
    { key: 'closingBalance', label: 'Closing' },
    { key: 'shortage', label: 'Shortage' },
  ];

  const optionalColumns = [
    { key: 'openingBalance', label: 'Opening' },
    { key: 'added', label: 'Added' },
    { key: 'returnedToVendor', label: 'Returned' },
    { key: 'damages', label: 'Damaged' },
    { key: 'transferInterDeptIn', label: 'Dept In' },
    { key: 'transferInterDeptOut', label: 'Dept Out' },
    { key: 'transferInterHotelIn', label: 'Hotel In' },
    { key: 'transferInterHotelOut', label: 'Hotel Out' },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    optionalColumns.map((col) => col.key)
  );

  const loadItems = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (user?.role === UserRole.ADMIN) {
        if (selectedHotelId) params.hotelId = selectedHotelId;
        if (selectedDepartment) params.departmentId = selectedDepartment
      } else {
        params.hotelId = user?.assignedHotelId;
        params.departmentId = selectedDepartment;
      }

      const res = await apiClient.get('/items', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      const itemList = res.data.data || [];
      setItems(itemList);

      if (itemList.length > 0) setSelectedItem(itemList[0]._id);
      else setSelectedItem('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHotelId || selectedDepartment !== undefined) loadItems();
  }, [selectedHotelId, selectedDepartment, user?.assignedHotelId]);

  const fetchReport = async () => {
    if (!selectedItem) return;

    setReportsLoading(true);
    try {
      const params: any = { itemId: selectedItem, from, to };

      if (user?.role === UserRole.ADMIN) {
        params.hotelId = selectedHotelId;
        if (selectedDepartment !== 'all') params.departmentId = selectedDepartment;
      } else {
        params.hotelId = user?.assignedHotelId;
      }

      const res = await apiClient.get('/reports/item', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      setData(res.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch report');
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem) fetchReport();
  }, [selectedItem, from, to]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Item Report
              <span className="text-sm text-muted-foreground ml-2 font-normal block sm:inline">
                ({from === to ? 'Today' : `${from} → ${to}`})
              </span>
            </CardTitle>
          </div>

          {/* Flexible Filter Container */}
          <div className="flex flex-col sm:flex-row gap-4 items-end justify-between w-full">
            
            {/* Item Selector (Left) */}
            <div className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-[300px]">
              <label className="text-xs text-muted-foreground block mb-1.5 ml-1">Item</label>
              <Select
                value={selectedItem}
                onValueChange={setSelectedItem}
                disabled={items.length === 0 || loading}
              >
                <SelectTrigger className="w-full h-9">
                  {loading ? (
                    <span>Loading items...</span>
                  ) : (
                    <SelectValue placeholder="Select Item" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Columns (Right) */}
            <div className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-[140px]">
                  <label className="text-xs text-muted-foreground block mb-1.5 ml-1">From</label>
                  <Input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full h-9 text-sm"
                  />
                </div>
                <div className="w-full sm:w-[140px]">
                  <label className="text-xs text-muted-foreground block mb-1.5 ml-1">To</label>
                  <Input
                    type="date"
                    value={to}
                    max={today || undefined}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full h-9 text-sm"
                  />
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 gap-2 w-full sm:w-auto">
                    <Eye className="w-4 h-4" /> <span className="inline">Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.length === optionalColumns.length}
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        checked ? optionalColumns.map((c) => c.key) : []
                      )
                    }
                  >
                    {visibleColumns.length === optionalColumns.length
                      ? 'Hide All'
                      : 'Show All'}
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  {optionalColumns.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={(checked) => {
                        setVisibleColumns((prev) =>
                          checked
                            ? [...prev, col.key]
                            : prev.filter((k) => k !== col.key)
                        );
                      }}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {reportsLoading ? (
          <p className="py-8 text-center text-muted-foreground">Loading report...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No report data available for the selected item or department.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted whitespace-nowrap">
                  <th className="p-2 text-left min-w-[100px]">Date</th>
                  {optionalColumns.map(
                    (col) =>
                      visibleColumns.includes(col.key) && (
                        <th key={col.key} className="p-2 text-right min-w-[80px]">
                          {col.label}
                        </th>
                      )
                  )}
                  {mandatoryColumns.map((col) => (
                    <th key={col.key} className="p-2 text-right min-w-[80px]">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} 
                    className={`
                      border-b cursor-pointer whitespace-nowrap
                      ${row.shortage > 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/50'}
                    `}
                  >
                    <td className="p-2">{row.date}</td>
                    {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <td
                            key={col.key}
                            className={`p-2 text-right ${
                              col.key === 'damages' && row[col.key] > 0
                                ? 'text-danger font-semibold'
                                : ''
                            }`}
                          >
                            {row[col.key] ?? 0}
                          </td>
                        )
                    )}
                    {mandatoryColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`p-2 text-right ${
                          col.key === 'shortage' && row.shortage > 0
                            ? 'text-red-600 font-semibold'
                            : ''
                        }`}
                      >
                        {row[col.key] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemReport;