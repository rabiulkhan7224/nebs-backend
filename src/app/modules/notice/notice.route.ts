// src/routes/notice.routes.ts
import { Router } from "express";
import {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from "./notice.controller";
import { adminOnly } from "../../middlewares/protect";
import auth from "../../middlewares/auth";

const router = Router();

// No multer needed — attachment will be a URL string (e.g., Cloudinary link)
router
  .route("/")
  .get(getNotices) // Anyone can view published notices (or add protect() if needed)
  .post(auth(), adminOnly, createNotice); // attachment comes in body as string URL

router
  .route("/:id")
  .get(getNoticeById)
  .patch(auth(), adminOnly, updateNotice)
  .delete(auth(), adminOnly, deleteNotice);

export default router;

