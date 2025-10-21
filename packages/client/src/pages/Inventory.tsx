import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, ArrowRightLeft } from 'lucide-react';
import { IItem } from '@/types';
import ItemModal from '@/components/ItemModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import TransactionModal from '@/components/TransactionModal';
import { toast } from 'sonner';

const Inventory = () => {
  const [items, setItems] = useState<IItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let allItems: IItem[] = JSON.parse(localStorage.getItem('items') || '[]');
    
    if (currentUser.hotelId) {
      allItems = allItems.filter(item => item.hotelId === currentUser.hotelId);
    }
    if (currentUser.departmentId) {
      allItems = allItems.filter(item => item.departmentId === currentUser.departmentId);
    }
    
    setItems(allItems);
    setLoading(false);
  }, []);

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadItems = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let allItems: IItem[] = JSON.parse(localStorage.getItem('items') || '[]');
    
    if (currentUser.hotelId) {
      allItems = allItems.filter(item => item.hotelId === currentUser.hotelId);
    }
    if (currentUser.departmentId) {
      allItems = allItems.filter(item => item.departmentId === currentUser.departmentId);
    }
    
    setItems(allItems);
    setLoading(false);
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setItemModalOpen(true);
  };

  const handleEditItem = (item: IItem) => {
    setSelectedItem(item);
    setItemModalOpen(true);
  };

  const handleDeleteItem = (item: IItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedItem) return;
    
    setDeleteLoading(true);
    setTimeout(() => {
      const items: IItem[] = JSON.parse(localStorage.getItem('items') || '[]');
      const filtered = items.filter(i => i.id !== selectedItem.id);
      localStorage.setItem('items', JSON.stringify(filtered));
      
      toast.success('Item deleted successfully');
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      loadItems();
    }, 500);
  };

  const handleRecordTransaction = (item: IItem) => {
    setSelectedItem(item);
    setTransactionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory items</p>
        </div>
        <Button className="gap-2" onClick={handleAddItem}>
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'Add your first item to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium">Item Code</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Item Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Current Stock</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Min Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Unit</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLowStock = item.currentStock < item.minimumStock;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          isLowStock ? 'bg-danger/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-sm font-medium">{item.itemCode}</td>
                        <td className="py-3 px-4 text-sm">{item.itemName}</td>
                        <td className="py-3 px-4 text-sm">{item.category}</td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${
                          isLowStock ? 'text-danger' : ''
                        }`}>
                          {item.currentStock}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">{item.minimumStock}</td>
                        <td className="py-3 px-4 text-sm">{item.unit}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={isLowStock ? 'destructive' : 'default'}>
                            {isLowStock ? 'Low Stock' : 'OK'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-danger hover:text-danger"
                              onClick={() => handleDeleteItem(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      <Button
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg gap-2"
        size="icon"
        onClick={() => {
          if (items.length > 0) {
            setSelectedItem(items[0]);
            setTransactionModalOpen(true);
          }
        }}
      >
        <ArrowRightLeft className="w-5 h-5" />
      </Button>

      <ItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        item={selectedItem}
        onSave={loadItems}
      />

      <TransactionModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        item={selectedItem}
        onSave={loadItems}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedItem?.itemName || ''}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Inventory;
