import { Router } from "express";
import {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from "./notice.controller";

import auth from "../../middlewares/auth";
import { adminOnly } from "../../middlewares/protect";

const router = Router();

/**
 * Notice Routes
 * Attachments come as URL strings (e.g., Cloudinary links)
 */

// Public or Protected — your choice
router.get("/", getNotices);

// Create Notice (Admin Only)
router.post("/", auth(), adminOnly, createNotice);

// Get Single Notice
router.get("/:id", getNoticeById);

// Update Notice (Admin Only)
router.patch("/:id", auth(), adminOnly, updateNotice);

// Delete Notice (Admin Only)
router.delete("/:id", auth(), adminOnly, deleteNotice);

export const NoticeModuleRoutes = router;

