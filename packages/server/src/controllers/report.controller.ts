import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ReportService } from '@/services/report.service';
import ApiResponse from '@/utils/ApiResponse';

export const stockReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await ReportService.stockReport(req.query);
  res.json(new ApiResponse(200, report, 'Stock report'));
});

export const itemReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await ReportService.itemReport(req.query);
  res.json(new ApiResponse(200, report, 'Item report'));
});