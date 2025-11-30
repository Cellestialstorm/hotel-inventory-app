import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import { Eye, AlertTriangle, ArrowRightLeft, Undo2, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { toast } from 'sonner';
import { UserRole } from '../../../shared/src';

interface ReportProps {
  filters: {
    selectedDepartment: string;
  };
}

type DetailType = 'damage' | 'transfer' | 'return' | null;

const StockReport = ({ filters }: ReportProps) => {
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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectionOpen, setSelectionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [detailType, setDetailType] = useState<DetailType>(null);

  const mandatoryColumns = [
    { key: 'closingBalance', label: 'Closing' },
    { key: 'shortage', label: 'Shortage' },
  ];

  const optionalColumns = [
    { key: 'openingBalance', label: 'Opening' },
    { key: 'added', label: 'Added' },
    { key: 'damages', label: 'Damaged', hasDetails: true },
    { key: 'returnedToVendor', label: 'Returned', hasDetails: true },
    { key: 'transferInterDeptIn', label: 'Dept In', hasDetails: true },
    { key: 'transferInterDeptOut', label: 'Dept Out', hasDetails: true },
    { key: 'transferInterHotelIn', label: 'Hotel In', hasDetails: true },
    { key: 'transferInterHotelOut', label: 'Hotel Out', hasDetails: true },
    { key: 'minReorderQty', label: 'Min' },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    optionalColumns.map((c) => c.key)
  );

  const fetchReport = async (isInitial = false) => {
    if (isInitial) setLoading(true);

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

  const openSelectionMenu = (row: any) => {
    setSelectedRow(row);
    setSelectionOpen(true);
  };

  const selectReportType = (type: DetailType) => {
    setSelectionOpen(false);
    setTimeout(() => {
      setDetailType(type);
      setDetailsOpen(true);
    }, 150);
  };

  const goBackToSelection = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      setDetailType(null);
      setSelectionOpen(true);
    }, 150);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      setSelectedRow(null);
      setDetailType(null);
    }, 300);
  };

  const normalizeTransfers = (row: any) => {
    if (!row) return [];
    const transfers = row.transferDetails || row.transferLogs || [];
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

  const getReturnDetails = (row: any) => row?.returnDetails || [];
  const getDamageDetails = (row: any) => row?.damageDetails || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-xl shrink-0">
              Stock Report
              <span className="ml-2 text-sm text-muted-foreground font-normal block sm:inline">
                ({from === to ? 'Today' : `${from} → ${to}`})
              </span>
            </CardTitle>

            {/* Flexible Filter Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From</label>
                  <Input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full text-xs sm:text-sm h-9"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To</label>
                  <Input
                    type="date"
                    value={to}
                    max={today || undefined}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full text-xs sm:text-sm h-9"
                  />
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Eye className="w-4 h-4" /> 
                    <span className="inline">Columns</span>
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
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading report...</p>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No report data available for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto relative">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted whitespace-nowrap">
                    {/* Removed sticky positioning as requested */}
                    <th className="p-2 text-left min-w-[150px]">Item Name</th>

                    {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <th className="p-2 text-right min-w-[80px]" key={col.key}>
                            {col.label}
                          </th>
                        )
                    )}

                    {mandatoryColumns.map((col) => (
                      <th className="p-2 text-right min-w-[80px]" key={col.key}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.itemId}
                      className={`
                        border-b cursor-pointer transition-colors whitespace-nowrap
                        ${r.shortage > 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/50'}
                      `}
                      onClick={() => openSelectionMenu(r)}
                    >
                      {/* Removed sticky positioning as requested */}
                      <td className="p-2 font-medium flex items-center gap-2">
                        {r.name}
                      </td>

                      {optionalColumns.map(
                        (col: any) =>
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

                      {mandatoryColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`p-2 text-right ${col.key === 'shortage' && r.shortage > 0
                              ? 'text-red-600 font-semibold'
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

      <Dialog open={selectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Reports for {selectedRow?.name}</DialogTitle>
            <DialogDescription>Select which transaction details you want to view.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all border-l-4 border-l-orange-500"
              onClick={() => selectReportType('damage')}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Damage Report</div>
                  <div className="text-xs text-muted-foreground">View wasted or damaged stock</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{Math.abs(selectedRow?.damages || 0)}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all border-l-4 border-l-blue-500"
              onClick={() => selectReportType('transfer')}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Transfer History</div>
                  <div className="text-xs text-muted-foreground">Incoming and outgoing transfers</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono font-bold text-foreground">View</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all border-l-4 border-l-purple-500"
              onClick={() => selectReportType('return')}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Returned to Vendor</div>
                  <div className="text-xs text-muted-foreground">Stock sent back to suppliers</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{Math.abs(selectedRow?.returnedToVendor || 0)}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectionOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={closeDetails}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={goBackToSelection}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="truncate pr-4">
                {selectedRow?.name} —
                {detailType === 'damage' && ' Damage Report'}
                {detailType === 'return' && ' Vendor Returns'}
                {detailType === 'transfer' && ' Transfer History'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="mt-4 flex-1 overflow-y-auto">
            {detailType === 'damage' && (
              <>
                {getDamageDetails(selectedRow).length > 0 ? (
                  <div className="space-y-3 pr-2">
                    {getDamageDetails(selectedRow).map((d: any, i: number) => (
                      <div key={i} className="border rounded-md p-3 bg-red-50 border-red-200">
                        <div className="flex justify-between">
                          <span className="font-semibold text-red-600">-{d.quantity} Damaged</span>
                          <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-700">
                          {d.remarks ? `Reason: ${d.remarks}` : <span className="italic text-muted-foreground">No remarks</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-md border-dashed">
                    <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
                    <p>No damage records found for this period.</p>
                  </div>
                )}
              </>
            )}

            {detailType === 'return' && (
              <>
                {getReturnDetails(selectedRow).length > 0 ? (
                  <div className="space-y-3 pr-2">
                    {getReturnDetails(selectedRow).map((d: any, i: number) => (
                      <div key={i} className="border rounded-md p-3 bg-orange-50 border-orange-200">
                        <div className="flex justify-between">
                          <span className="font-semibold text-orange-700">-{d.quantity} Returned</span>
                          <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-700">
                          {d.remarks ? `Reason: ${d.remarks}` : <span className="italic text-muted-foreground">No remarks</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-md border-dashed">
                    <Undo2 className="w-8 h-8 mb-2 opacity-20" />
                    <p>No vendor returns found for this period.</p>
                  </div>
                )}
              </>
            )}

            {detailType === 'transfer' && (
              <>
                {normalizeTransfers(selectedRow).length > 0 ? (
                  <div className="space-y-3 pr-2">
                    {normalizeTransfers(selectedRow).map((t: any, i: number) => (
                      <div key={i} className="border rounded-md p-3 bg-blue-50 border-blue-200">
                        <div className="flex justify-between">
                          <span className={`font-semibold ${t.type === 'TRANSFER_IN' ? 'text-green-600' : 'text-blue-600'}`}>
                            {t.type === 'TRANSFER_IN' ? 'Received' : 'Sent'} {t.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString()}</span>
                        </div>

                        <div className="text-sm mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-muted-foreground block">From</span>
                            <span className="font-medium truncate block">{t.fromHotel ? `${t.fromHotel} / ` : ''}{t.fromDept || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">To</span>
                            <span className="font-medium truncate block">{t.toHotel ? `${t.toHotel} / ` : ''}{t.toDept || 'Unknown'}</span>
                          </div>
                        </div>

                        {t.remarks && (
                          <p className="mt-2 text-sm italic text-muted-foreground border-t border-blue-200 pt-1">
                            "{t.remarks}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-md border-dashed">
                    <ArrowRightLeft className="w-8 h-8 mb-2 opacity-20" />
                    <p>No transfer history found for this period.</p>
                  </div>
                )}
              </>
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