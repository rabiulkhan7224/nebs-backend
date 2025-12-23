import { Schema, model, Document, Types } from "mongoose";

export type NoticeStatus = "draft" | "published" | "archived" | "unpublished";
export type NoticeTarget = "all" | "department" | "individual";

export interface INotice extends Document {
  title: string;
  body: string;
  noticeType: string[]; // e.g., ["Holiday & Event", "Warning / Disciplinary"]
  target: NoticeTarget;
  department?: string;
  employee?: Types.ObjectId; // Ref to User
  publishedAt?: Date;
  status: NoticeStatus;
  createdBy: Types.ObjectId; // Ref to User
  attachment?: string; // URL or file path
  views: number;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  createdByUser?: any;
  employeeUser?: any;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    body: {
      type: String,
      required: [true, "Notice body is required"],
    },
    noticeType: {
      type: [String],
      required: [true, "At least one notice type is required"],
    },
    target: {
      type: String,
      enum: ["all", "department", "individual"],
      required: true,
    },
    department: {
      type: String,
      required: function () {
        return (this as any).target === "department";
      },
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return (this as any).target === "individual";
      },
    },
    publishedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachment: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate createdBy and employee
NoticeSchema.virtual("createdByUser", {
  ref: "User",
  localField: "createdBy",
  foreignField: "_id",
  justOne: true,
});

NoticeSchema.virtual("employeeUser", {
  ref: "User",
  localField: "employee",
  foreignField: "_id",
  justOne: true,
});

const Notice = model<INotice>("Notice", NoticeSchema);
export default Notice;