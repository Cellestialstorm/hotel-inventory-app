import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { UserRole } from '@hotel-inventory/shared';

interface ReportProps {
  filters: {
    selectedDepartment: string;
  };
}

const StockReport = ({ filters }: ReportProps) => {
  const { selectedDepartment } = filters;
  const { accessToken, user, selectedHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
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
    { key: 'damages', label: 'Damaged' },
    { key: 'returnedToVendor', label: 'Returned' },
    { key: 'transferInterDeptIn', label: 'Dept In' },
    { key: 'transferInterDeptOut', label: 'Dept Out' },
    { key: 'transferInterHotelIn', label: 'Hotel In' },
    { key: 'transferInterHotelOut', label: 'Hotel Out' },
    { key: 'minReorderQty', label: 'Min' },
  ];


  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    optionalColumns.map((col) => col.key)
  );

  const fetchReport = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setReportsLoading(true);

    try {
      if (user?.role === UserRole.ADMIN && !selectedHotelId) {
        setData([]);
        setLoading(false);
        setReportsLoading(true);
        return;
      }

      const params: any = {
        from,
        to
      };

      if (user?.role === UserRole.ADMIN) {
        params.hotelId = selectedHotelId;
        if (selectedDepartment) params.departmentId = selectedDepartment
      } else {
        params.hotelId = user?.assignedHotelId;
        params.departmentId = selectedDepartment;
      }

      const res = await apiClient.get('/reports/stock', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      setData(res.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch stock report');
    } finally {
      if (isInitial) setLoading(false);
      else setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(true);
  }, [selectedHotelId, user?.assignedHotelId]);

  useEffect(() => {
    fetchReport(false);
  }, [selectedDepartment])

  useEffect(() => {
    if (from && to) {
      fetchReport(false);
    }
  }, [from, to]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Stock Report
            <span className="text-sm text-muted-foreground ml-2">
              ({from === to ? 'Today' : `${from} → ${to}`})
            </span>
          </CardTitle>
          <div className="flex gap-2 items-end">
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
                  {visibleColumns.length === optionalColumns.length ? 'Hide All' : 'Show All'}
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
        {loading ? (
          <p>Loading report...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No report data available for the selected period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {reportsLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="p-2 text-left">Item Name</th>

                  {/* Optional columns */}
                  {optionalColumns.map(
                    (col) =>
                      visibleColumns.includes(col.key) && (
                        <th key={col.key} className="p-2 text-right">
                          {col.label}
                        </th>
                      )
                  )}

                  {/* Mandatory columns (always visible) */}
                  {mandatoryColumns.map((col) => (
                    <th key={col.key} className="p-2 text-right">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((r) => (
                  <tr key={r.itemId} className="border-b hover:bg-muted/50">
                    <td className="p-2">{r.name}</td>

                    {/* Optional columns */}
                    {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <td
                            key={col.key}
                            className={`p-2 text-right ${col.key === 'damages' && r[col.key] > 0
                                ? 'text-danger font-semibold'
                                : ''
                              }`}
                          >
                            {r[col.key] ?? 0}
                          </td>
                        )
                    )}

                    {/* Mandatory columns */}
                    {mandatoryColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`p-2 text-right ${col.key === 'shortage' && r.shortage > 0
                            ? 'text-danger font-semibold'
                            : ''
                          }`}
                      >
                        {r[col.key] ?? 0}
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

export default StockReport;
