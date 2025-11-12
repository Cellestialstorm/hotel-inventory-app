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

  const today = new Date().toISOString().split('T')[0];
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

  // re-fetch when item or date changes
  useEffect(() => {
    if (selectedItem) fetchReport();
  }, [selectedItem, from, to]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Item Report
            <span className="text-sm text-muted-foreground ml-2">
              ({from === to ? 'Today' : `${from} → ${to}`})
            </span>
          </CardTitle>

          <div className="flex gap-2 items-end">
            {/* Item Selector */}
            <div>
              <label className="text-sm text-muted-foreground">Item</label>
              <Select
                value={selectedItem}
                onValueChange={setSelectedItem}
                disabled={items.length === 0}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select Item" />
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

            {/* Date Range */}
            <div>
              <label className="text-sm text-muted-foreground">From</label>
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">To</label>
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {/* Columns Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" /> Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
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
      </CardHeader>

      <CardContent>
        {reportsLoading ? (
          <p>Loading report...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No report data available for the selected item or department.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="p-2 text-left">Date</th>
                  {optionalColumns.map(
                    (col) =>
                      visibleColumns.includes(col.key) && (
                        <th key={col.key} className="p-2 text-right">
                          {col.label}
                        </th>
                      )
                  )}
                  {mandatoryColumns.map((col) => (
                    <th key={col.key} className="p-2 text-right">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
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
                            ? 'text-danger font-semibold'
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
