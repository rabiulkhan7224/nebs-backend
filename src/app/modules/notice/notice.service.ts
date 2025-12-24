// src/services/notice.service.ts
import { Types } from "mongoose";
import Notice from "./notice.model";

interface CreateNoticeInput {
  title: string;
  body: string;
  noticeType: string[];
  target: "all" | "department" | "individual";
  department?: string;
  employee?: string;
  publishedAt?: Date;
  status: "draft" | "published" | "archived" | "unpublished";
  attachment?: string;
  createdBy: string;
}

interface UpdateNoticeInput extends Partial<CreateNoticeInput> {}

class NoticeService {
  // GET all notices with filters + pagination
 async getAll(filters: any = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query: any = {};

  // Status
  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  // Target
  if (filters.target && filters.target !== "all") {
    query.target = filters.target;
  }

  // Department (only if target = department)
  if (filters.target === "department" && filters.department) {
    query.department = filters.department;
  }

  // Individual employee
  if (filters.target === "individual" && filters.employee) {
    query.employee = filters.employee;
  }

  // Title search
  if (filters.search) {
    query.title = { $regex: filters.search, $options: "i" };
  }

  // Published date (single day)
  if (filters.publishedOn) {
    const start = new Date(filters.publishedOn);
    const end = new Date(filters.publishedOn);
    end.setHours(23, 59, 59, 999);

    query.publishedAt = { $gte: start, $lte: end };
  }

  const notices = await Notice.find(query)
    .populate("createdByUser", "firstName lastName profilePicture role")
    .populate("employeeUser", "firstName lastName employeeId department")
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Notice.countDocuments(query);

  return {
    data: notices,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}


  // GET single notice + increment views
  async getById(id: string) {
    const notice = await Notice.findById(id)
      .populate("createdByUser", "firstName lastName profilePicture role")
      .populate("employeeUser", "firstName lastName employeeId department");

    if (!notice) throw new Error("Notice not found");

    notice.views += 1;
    await notice.save();

    return notice;
  }

  // CREATE notice
  async create(data: CreateNoticeInput) {
    const notice = await Notice.create({
      ...data,
      publishedAt: data.status === "published" ? data.publishedAt || new Date() : undefined,
    });

    return await this.getById(notice._id.toString());
  }

  // UPDATE notice
  async update(id: string, data: UpdateNoticeInput, userId: string) {
    const notice = await Notice.findById(id);
    if (!notice) throw new Error("Notice not found");

    

    Object.assign(notice, {
      ...data,
      publishedAt:
        data.status === "published" ? data.publishedAt || new Date() : undefined,
    });

    await notice.save();
    return await this.getById(id);
  }

  // DELETE notice
  async delete(id: string, userId: string) {
    const notice = await Notice.findById(id);
    if (!notice) throw new Error("Notice not found");

    // if (
    //   notice.createdBy.toString() !== userId &&
    //   !["admin", "hr"].includes((global as any).user?.role)
    // ) {
    //   throw new Error("Not authorized to delete this notice");
    // }

    await Notice.findByIdAndDelete(id);
    return { message: "Notice deleted successfully" };
  }
}

export const noticeService = new NoticeService();