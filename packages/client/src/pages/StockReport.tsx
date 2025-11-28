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
import { Eye, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
    optionalColumns.map((c) => c.key)
  );

  // Detail modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const fetchReport = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setReportsLoading(true);

    try {
      const params: any = { from, to };

      if (user?.role === UserRole.ADMIN) {
        params.hotelId = selectedHotelId;
        params.departmentId = selectedDepartment;
      } else {
        params.hotelId = user?.assignedHotelId;
        params.departmentId = user?.assignedDepartmentId;
      }

      const res = await apiClient.get('/reports/stock', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      setData(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch stock report');
    } finally {
      setLoading(false);
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(true);
  }, [selectedHotelId, user?.assignedHotelId]);

  useEffect(() => {
    fetchReport(false);
  }, [selectedDepartment]);

  useEffect(() => {
    if (from && to) fetchReport(false);
  }, [from, to]);

  const openDetails = (row: any) => {
    setSelectedRow(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setSelectedRow(null);
    setDetailsOpen(false);
  };

  // Normalize backend fields for transfers
  const normalizeTransfers = (row: any) => {
    if (!row) return [];

    let transfers = row.transferDetails || row.transferLogs || [];

    return transfers.map((t: any) => ({
      type: t.type || t.transactionType,
      quantity: t.quantity || 0,
      date: t.date || t.createdAt,
      remarks: t.remarks || '',
      fromDept: t.fromDeptName || t.fromDepartmentName || t.fromDepartment || null,
      toDept: t.toDeptName || t.toDepartmentName || t.toDepartment || null,
      fromHotel: t.fromHotelName || null,
      toHotel: t.toHotelName || null,
    }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Stock Report
              <span className="ml-2 text-sm text-muted-foreground">
                ({from === to ? 'Today' : `${from} → ${to}`})
              </span>
            </CardTitle>

            <div className="flex items-end gap-2">
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
                  max={today || undefined}
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
          {loading ? (
            <p>Loading report...</p>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No report data available for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="p-2 text-left">Item Name</th>

                    {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <th className="p-2 text-right" key={col.key}>
                            {col.label}
                          </th>
                        )
                    )}

                    {mandatoryColumns.map((col) => (
                      <th className="p-2 text-right" key={col.key}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.itemId}
                      onClick={() => openDetails(r)}
                      className={`
                        border-b cursor-pointer 
                        ${r.shortage > 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/50'}
                      `}
                    >
                      <td className="p-2">{r.name}</td>

                      {optionalColumns.map(
                        (col) =>
                          visibleColumns.includes(col.key) && (
                            <td className="p-2 text-right" key={col.key}>
                              {r[col.key] ?? 0}
                            </td>
                          )
                      )}

                      {mandatoryColumns.map((col) => (
                        <td className="p-2 text-right" key={col.key}>
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

      {/* DETAILS MODAL */}
      <Dialog open={detailsOpen} onOpenChange={(v) => !v && closeDetails()}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{selectedRow?.name} — Details</DialogTitle>
          </DialogHeader>

          {/* DAMAGE DETAILS */}
          <div className="mt-4">
            <p className="text-sm font-medium">Damage Remarks</p>

            {selectedRow?.damageDetails?.length > 0 ? (
              <div className="mt-2 space-y-3 max-h-48 overflow-y-auto">
                {selectedRow.damageDetails.map((d: any, i: number) => (
                  <div
                    key={i}
                    className="border rounded-md p-3 bg-red-50 border-red-200"
                  >
                    <p className="font-semibold text-red-600">
                      -{d.quantity} damaged
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.date).toLocaleString()}
                    </p>
                    <p className="text-sm mt-1">
                      {d.remarks || (
                        <span className="italic text-muted-foreground">
                          No remarks
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="italic text-muted-foreground mt-1">No damage remarks</p>
            )}
          </div>

          {/* TRANSFER DETAILS */}
          <div className="mt-6">
            <p className="text-sm font-medium">Transfer Details</p>

            {normalizeTransfers(selectedRow).length > 0 ? (
              <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
                {normalizeTransfers(selectedRow).map((t: any, i: number) => (
                  <div
                    key={i}
                    className="border rounded-md p-3 bg-blue-50 border-blue-200"
                  >
                    <p className="font-semibold text-blue-600">
                      {t.type} — {t.quantity}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleString()}
                    </p>

                    <div className="text-sm mt-1">
                      {t.fromDept && t.toDept && (
                        <p>
                          <strong>{t.fromDept}</strong> {'-->'} <strong>{t.toDept}</strong>
                        </p>
                      )}
                      {t.fromHotel !== t.toHotel && (
                        <p>
                          <strong>{t.fromHotel}</strong> {'-->'} <strong>{t.toHotel}</strong>
                        </p>
                      )}

                      {t.remarks && (
                        <p className="mt-1 italic text-muted-foreground">
                          {t.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="italic text-muted-foreground mt-2">No transfers found</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDetails}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockReport;
