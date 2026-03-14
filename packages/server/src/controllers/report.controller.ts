import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ReportService } from '@/services/report.service';
import ApiResponse from '@/utils/ApiResponse';
import { buildRoleBasedQuery } from '@/utils/queryBuilder.util';

export const stockReport = asyncHandler(async (req: Request, res: Response) => {
  const scopedQuery = buildRoleBasedQuery(req.user, req.query);
  const report = await ReportService.stockReport(scopedQuery);
  res.json(new ApiResponse(200, report, 'Stock report'));
});

export const itemReport = asyncHandler(async (req: Request, res: Response) => {
  const scopedQuery = buildRoleBasedQuery(req.user, req.query);
  const report = await ReportService.itemReport(scopedQuery);
  res.json(new ApiResponse(200, report, 'Item report'));
});