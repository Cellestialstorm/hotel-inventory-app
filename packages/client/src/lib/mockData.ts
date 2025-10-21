import { IUser, IHotel, IDepartment, IItem, ITransaction, TransactionType } from '@/types';

export const mockHotels: IHotel[] = [
  { id: 'h1', name: 'Grand Plaza', location: 'New York', isActive: true },
  { id: 'h2', name: 'Beach Resort', location: 'Miami', isActive: true },
  { id: 'h3', name: 'Mountain Lodge', location: 'Colorado', isActive: true },
];

export const mockDepartments: IDepartment[] = [
  { id: 'd1', name: 'Housekeeping', hotelId: 'h1', isActive: true },
  { id: 'd2', name: 'Kitchen', hotelId: 'h1', isActive: true },
  { id: 'd3', name: 'Restaurant', hotelId: 'h1', isActive: true },
  { id: 'd4', name: 'Bar', hotelId: 'h1', isActive: true },
  { id: 'd5', name: 'Maintenance', hotelId: 'h1', isActive: true },
  { id: 'd6', name: 'Housekeeping', hotelId: 'h2', isActive: true },
  { id: 'd7', name: 'Kitchen', hotelId: 'h2', isActive: true },
  { id: 'd8', name: 'Restaurant', hotelId: 'h2', isActive: true },
  { id: 'd9', name: 'Bar', hotelId: 'h2', isActive: true },
  { id: 'd10', name: 'Maintenance', hotelId: 'h2', isActive: true },
  { id: 'd11', name: 'Housekeeping', hotelId: 'h3', isActive: true },
  { id: 'd12', name: 'Kitchen', hotelId: 'h3', isActive: true },
  { id: 'd13', name: 'Restaurant', hotelId: 'h3', isActive: true },
  { id: 'd14', name: 'Bar', hotelId: 'h3', isActive: true },
  { id: 'd15', name: 'Maintenance', hotelId: 'h3', isActive: true },
];

export const mockUsers: IUser[] = [
  { id: 'u1', username: 'admin', role: 'ADMIN', isActive: true },
  { id: 'u2', username: 'admin2', role: 'ADMIN', isActive: true },
  { id: 'u3', username: 'manager1', role: 'MANAGER', hotelId: 'h1', departmentId: 'd1', isActive: true },
  { id: 'u4', username: 'manager2', role: 'MANAGER', hotelId: 'h1', departmentId: 'd2', isActive: true },
  { id: 'u5', username: 'manager3', role: 'MANAGER', hotelId: 'h2', departmentId: 'd6', isActive: true },
  { id: 'u6', username: 'manager4', role: 'MANAGER', hotelId: 'h3', departmentId: 'd11', isActive: true },
  { id: 'u7', username: 'staff1', role: 'STAFF', hotelId: 'h1', departmentId: 'd1', isActive: true },
  { id: 'u8', username: 'staff2', role: 'STAFF', hotelId: 'h1', departmentId: 'd2', isActive: true },
  { id: 'u9', username: 'staff3', role: 'STAFF', hotelId: 'h2', departmentId: 'd6', isActive: true },
  { id: 'u10', username: 'staff4', role: 'STAFF', hotelId: 'h3', departmentId: 'd11', isActive: true },
];

export const mockItems: IItem[] = [
  // Housekeeping items - some below minimum
  { id: 'i1', itemCode: 'HK001', itemName: 'Bed Sheets', category: 'Housekeeping', unit: 'pieces', minimumStock: 50, currentStock: 30, hotelId: 'h1', departmentId: 'd1' },
  { id: 'i2', itemCode: 'HK002', itemName: 'Towels', category: 'Housekeeping', unit: 'pieces', minimumStock: 100, currentStock: 45, hotelId: 'h1', departmentId: 'd1' },
  { id: 'i3', itemCode: 'HK003', itemName: 'Pillows', category: 'Housekeeping', unit: 'pieces', minimumStock: 40, currentStock: 55, hotelId: 'h1', departmentId: 'd1' },
  { id: 'i4', itemCode: 'HK004', itemName: 'Cleaning Supplies', category: 'Housekeeping', unit: 'boxes', minimumStock: 20, currentStock: 12, hotelId: 'h1', departmentId: 'd1' },
  { id: 'i5', itemCode: 'HK005', itemName: 'Toilet Paper', category: 'Housekeeping', unit: 'rolls', minimumStock: 200, currentStock: 150, hotelId: 'h1', departmentId: 'd1' },
  
  // Kitchen items - some below minimum
  { id: 'i6', itemCode: 'KT001', itemName: 'Rice', category: 'Kitchen', unit: 'kg', minimumStock: 100, currentStock: 45, hotelId: 'h1', departmentId: 'd2' },
  { id: 'i7', itemCode: 'KT002', itemName: 'Cooking Oil', category: 'Kitchen', unit: 'liters', minimumStock: 50, currentStock: 25, hotelId: 'h1', departmentId: 'd2' },
  { id: 'i8', itemCode: 'KT003', itemName: 'Salt', category: 'Kitchen', unit: 'kg', minimumStock: 10, currentStock: 8, hotelId: 'h1', departmentId: 'd2' },
  { id: 'i9', itemCode: 'KT004', itemName: 'Sugar', category: 'Kitchen', unit: 'kg', minimumStock: 20, currentStock: 30, hotelId: 'h1', departmentId: 'd2' },
  { id: 'i10', itemCode: 'KT005', itemName: 'Flour', category: 'Kitchen', unit: 'kg', minimumStock: 80, currentStock: 100, hotelId: 'h1', departmentId: 'd2' },
  
  // Restaurant items
  { id: 'i11', itemCode: 'RT001', itemName: 'Plates', category: 'Restaurant', unit: 'pieces', minimumStock: 100, currentStock: 95, hotelId: 'h1', departmentId: 'd3' },
  { id: 'i12', itemCode: 'RT002', itemName: 'Glasses', category: 'Restaurant', unit: 'pieces', minimumStock: 80, currentStock: 55, hotelId: 'h1', departmentId: 'd3' },
  { id: 'i13', itemCode: 'RT003', itemName: 'Cutlery Set', category: 'Restaurant', unit: 'sets', minimumStock: 60, currentStock: 70, hotelId: 'h1', departmentId: 'd3' },
  { id: 'i14', itemCode: 'RT004', itemName: 'Napkins', category: 'Restaurant', unit: 'pieces', minimumStock: 500, currentStock: 350, hotelId: 'h1', departmentId: 'd3' },
  
  // Bar items
  { id: 'i15', itemCode: 'BR001', itemName: 'Wine Glasses', category: 'Bar', unit: 'pieces', minimumStock: 50, currentStock: 35, hotelId: 'h1', departmentId: 'd4' },
  { id: 'i16', itemCode: 'BR002', itemName: 'Beer Mugs', category: 'Bar', unit: 'pieces', minimumStock: 40, currentStock: 48, hotelId: 'h1', departmentId: 'd4' },
  { id: 'i17', itemCode: 'BR003', itemName: 'Cocktail Shakers', category: 'Bar', unit: 'pieces', minimumStock: 10, currentStock: 12, hotelId: 'h1', departmentId: 'd4' },
  
  // Maintenance items
  { id: 'i18', itemCode: 'MT001', itemName: 'Light Bulbs', category: 'Maintenance', unit: 'pieces', minimumStock: 50, currentStock: 22, hotelId: 'h1', departmentId: 'd5' },
  { id: 'i19', itemCode: 'MT002', itemName: 'Paint', category: 'Maintenance', unit: 'liters', minimumStock: 30, currentStock: 15, hotelId: 'h1', departmentId: 'd5' },
  { id: 'i20', itemCode: 'MT003', itemName: 'Tools Set', category: 'Maintenance', unit: 'sets', minimumStock: 5, currentStock: 7, hotelId: 'h1', departmentId: 'd5' },
];

export const mockTransactions: ITransaction[] = [
  { id: 't1', itemId: 'i1', transactionType: TransactionType.OPENING_BALANCE, quantity: 50, date: new Date('2024-01-01'), performedBy: 'u3' },
  { id: 't2', itemId: 'i1', transactionType: TransactionType.DAMAGE, quantity: 20, date: new Date('2024-01-15'), performedBy: 'u7', notes: 'Stained sheets' },
  { id: 't3', itemId: 'i2', transactionType: TransactionType.OPENING_BALANCE, quantity: 120, date: new Date('2024-01-01'), performedBy: 'u3' },
  { id: 't4', itemId: 'i2', transactionType: TransactionType.DAMAGE, quantity: 75, date: new Date('2024-01-20'), performedBy: 'u7', notes: 'Worn out towels' },
  { id: 't5', itemId: 'i6', transactionType: TransactionType.OPENING_BALANCE, quantity: 150, date: new Date('2024-01-01'), performedBy: 'u4' },
  { id: 't6', itemId: 'i6', transactionType: TransactionType.RETURNED_TO_VENDOR, quantity: 105, date: new Date('2024-01-25'), performedBy: 'u8', notes: 'Poor quality' },
];

// Helper function to get items below minimum stock
export const getReorderItems = (hotelId?: string, departmentId?: string): IItem[] => {
  let items = mockItems.filter(item => item.currentStock < item.minimumStock);
  
  if (hotelId) {
    items = items.filter(item => item.hotelId === hotelId);
  }
  
  if (departmentId) {
    items = items.filter(item => item.departmentId === departmentId);
  }
  
  return items.sort((a, b) => (a.minimumStock - a.currentStock) - (b.minimumStock - b.currentStock)).reverse();
};

// Initialize localStorage with mock data
export const initializeMockData = () => {
  if (!localStorage.getItem('hotels')) {
    localStorage.setItem('hotels', JSON.stringify(mockHotels));
  }
  if (!localStorage.getItem('departments')) {
    localStorage.setItem('departments', JSON.stringify(mockDepartments));
  }
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem('items')) {
    localStorage.setItem('items', JSON.stringify(mockItems));
  }
  if (!localStorage.getItem('transactions')) {
    localStorage.setItem('transactions', JSON.stringify(mockTransactions));
  }
};
