// src/controllers/notice.controller.ts
import { Request, Response } from "express";
import catchAsync from './../../utils/catchAsync';
import { noticeService } from "./notice.service";
import User from "../auth/user.model";

export const getNotices = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filters = {
    status: req.query.status as string,
    target: req.query.target as string,
    department: req.query.department as string,

    // title search
    search: req.query.search as string,

    // employee search (name or employeeId)
    employeeSearch: req.query.employeeSearch as string,

    // published date filter
    publishedOn: req.query.publishedOn as string,
  };

  const result = await noticeService.getAll(filters, page, limit);

  res.status(200).json({
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


export const getEmployeesForNotice = catchAsync(async (req: Request, res: Response) => {
  const employees = await User.find(
    { role: "employee", isActive: true }
  ).select("employeeId firstName lastName department profilePicture");

  res.json({
    success: true,
    data: employees,
  });
});
