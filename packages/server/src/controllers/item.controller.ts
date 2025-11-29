import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ItemService } from '@/services/item.services';
import ApiResponse from '@/utils/ApiResponse';

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  const created = await ItemService.createItem({ ...payload, createdBy: req.user?.username });
  res.status(201).json(new ApiResponse(201, created, 'Item created'));
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== 'ADMIN') throw new Error('Forbidden');
  const updated = await ItemService.updateItem(req.params.id, req.body);
  res.json(new ApiResponse(200, updated, 'Item updated'));
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== 'ADMIN') throw new Error('Forbidden');
  await ItemService.deleteItem(req.params.id);
  res.json(new ApiResponse(200, null, 'Item deleted'));
});

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await ItemService.list(req.query);
  res.json(new ApiResponse(200, items, 'Items fetched'));
});

export const markDamage = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, quantity, remarks } = req.body;
  const item = await ItemService.markDamage(itemId, quantity || 1, remarks, req.user);
  res.json(new ApiResponse(200, item, 'Marked damaged'));
});

export const transfer = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, toHotelId, toDepartmentId, quantity, remarks } = req.body;
  const result = await ItemService.transfer(itemId, toHotelId, toDepartmentId, quantity, remarks, req.user);
  res.json(new ApiResponse(200, result, 'Transfer done'));
});

export const returnToVendor = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, quantity, remarks } = req.body;
  const item = await ItemService.returnToVendor(itemId, quantity || 1, remarks, req.user);
  res.json(new ApiResponse(200, item, 'Returned to vendor successfully'));
});