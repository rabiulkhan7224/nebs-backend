// src/controllers/notice.controller.ts
import { Request, Response } from "express";
import catchAsync from './../../utils/catchAsync';
import { noticeService } from "./notice.service";

export const getNotices = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const filters = {
    status: req.query.status,
    target: req.query.target,
    department: req.query.department,
    search: req.query.search,
  };

  const result = await noticeService.getAll(filters, page, limit);

  res.json({
    success: true,
    ...result,
  });
});

export const getNoticeById = catchAsync(async (req: Request, res: Response) => {
  const notice = await noticeService.getById(req.params.id);
  res.json({ success: true, data: notice });
});

export const createNotice = catchAsync(async (req: Request, res: Response) => {
  console.log(req.user!.id);
    const noticeData = {
    ...req.body,
    createdBy: req.user!.id,
  };

  const notice = await noticeService.create(noticeData);
  res.status(201).json({
    success: true,
    message: "Notice created successfully",
    data: notice,
  });
});

export const updateNotice = catchAsync(async (req: Request, res: Response) => {
  const notice = await noticeService.update(req.params.id, req.body, req.user!.id.toString());
  res.json({
    success: true,
    message: "Notice updated successfully",
    data: notice,
  });
});

export const deleteNotice = catchAsync(async (req: Request, res: Response) => {
  await noticeService.delete(req.params.id, req.user!.id.toString());
  res.json({ success: true, message: "Notice deleted successfully" });
});