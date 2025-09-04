import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schools table for multi-tenancy
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // URL-friendly school identifier
  domain: text("domain"), // Optional custom domain
  location: text("location"), // Wilaya location (Algerian province)
  fullAddress: text("full_address"), // Complete address
  adminPhone: text("admin_phone"), // Admin contact phone
  schoolEmail: text("school_email"), // School email address
  website: text("website"), // School website URL
  adminKey: text("admin_key").notNull(), // Secret key for admin registration
  teacherKey: text("teacher_key").notNull(), // Secret key for teacher registration
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3b82f6"), // Hex color for branding
  secondaryColor: text("secondary_color").default("#1e40af"),
  settings: jsonb("settings"), // Additional school-specific settings
  active: boolean("active").default(true),
  isAccessEnabled: boolean("is_access_enabled").default(true), // Authentication control - can pause school access
  // Subscription fields
  subscriptionExpiry: timestamp("subscription_expiry"), // When subscription expires
  subscriptionStatus: text("subscription_status").default("active"), // active, expired, suspended
  subscriptionNotes: text("subscription_notes"), // Admin notes about subscription
  subscriptionLastUpdated: timestamp("subscription_last_updated"),
  subscriptionUpdatedBy: integer("subscription_updated_by"), // Super admin who updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id), // null for super admin
  email: text("email").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  phoneVerified: boolean("phone_verified").default(false), // Phone verification status
  phoneVerificationCode: text("phone_verification_code"), // SMS verification code
  phoneVerificationExpiry: timestamp("phone_verification_expiry"), // Code expiry time
  emailVerified: boolean("email_verified").default(false), // Email verification status
  emailVerificationCode: text("email_verification_code"), // Email verification code
  emailVerificationExpiry: timestamp("email_verification_expiry"), // Code expiry time
  profilePicture: text("profile_picture"), // URL to profile picture
  role: text("role").notNull().default("user"), // super_admin, admin, teacher, user, student
  gender: text("gender", { enum: ["male", "female"] }), // Gender field for teachers
  firebaseUid: text("firebase_uid"),
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by"), // Admin who verified - remove self-reference
  banned: boolean("banned").default(false), // User ban status
  banReason: text("ban_reason"), // Reason for ban
  bannedAt: timestamp("banned_at"), // When user was banned
  bannedBy: integer("banned_by"), // Admin who banned the user - remove self-reference
  deleted: boolean("deleted").default(false), // Soft delete status
  deletedAt: timestamp("deleted_at"), // When user was deleted
  deletedBy: integer("deleted_by"), // Admin who deleted the user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(), // Required for existing DB
  bio: text("bio"),
  imageUrl: text("image_url"),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  teacherId: integer("teacher_id").references(() => teachers.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  blockerId: integer("blocker_id")
    .references(() => users.id)
    .notNull(),
  blockedId: integer("blocked_id")
    .references(() => users.id)
    .notNull(),
  reason: text("reason"), // Optional reason for blocking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  reporterId: integer("reporter_id")
    .references(() => users.id)
    .notNull(),
  reportedUserId: integer("reported_user_id")
    .references(() => users.id)
    .notNull(),
  messageId: integer("message_id").references(() => messages.id), // Optional - if reporting specific message
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  status: text("status").default("pending"), // pending, reviewed, implemented
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  maxMembers: integer("max_members"),
  educationLevel: text("education_level"), // الابتدائي, المتوسط, الثانوي
  subjectId: integer("subject_id").references(() => teachingModules.id), // Subject/module
  teacherId: integer("teacher_id").references(() => users.id), // Assigned teacher
  studentsAssigned: integer("students_assigned").array(), // Array of student user IDs
  isAdminManaged: boolean("is_admin_managed").default(false), // Admin-managed vs public groups
  grade: text("grade"),
  scheduleCellId: integer("schedule_cell_id").references(
    () => scheduleCells.id,
  ), // Link to scheduled lesson
  lessonsPerWeek: integer("lessons_per_week").default(1), // 1 or 2 lessons per week
  groupNumber: integer("group_number").default(1).notNull(), // For handling multiple groups of same subject
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formations = pgTable("formations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupRegistrations = pgTable("group_registrations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  groupId: integer("group_id").references(() => groups.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User assignments to groups (for internal students/users)
export const groupUserAssignments = pgTable("group_user_assignments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  groupId: integer("group_id").references(() => groups.id, {
    onDelete: "cascade",
  }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").references(() => users.id), // Admin who made the assignment
});

// Mixed assignments to groups (for both students and children)
export const groupMixedAssignments = pgTable("group_mixed_assignments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  groupId: integer("group_id").references(() => groups.id, {
    onDelete: "cascade",
  }),
  studentId: integer("student_id"), // ID from either students or children table
  userId: integer("user_id"), // Corresponding user ID for efficient session-based queries
  studentType: text("student_type", { enum: ["student", "child"] }).notNull(), // Type to distinguish source table
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").references(() => users.id), // Admin who made the assignment
});

// Group Schedule Assignments - Junction table for groups and their scheduled lessons
export const groupScheduleAssignments = pgTable("group_schedule_assignments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  groupId: integer("group_id").references(() => groups.id, {
    onDelete: "cascade",
  }),
  scheduleCellId: integer("schedule_cell_id").references(
    () => scheduleCells.id,
    { onDelete: "cascade" },
  ),
  isActive: boolean("is_active").default(true), // Allow temporarily disabling a lesson
  createdAt: timestamp("created_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").references(() => users.id), // Admin who assigned
});

// Group Attendance Table - Updated to support mixed assignments (students and children)
export const groupAttendance = pgTable("group_attendance", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  groupId: integer("group_id")
    .references(() => groups.id)
    .notNull(),
  studentId: integer("student_id").notNull(), // ID from either users or children table
  userId: integer("user_id"), // Corresponding user ID for efficient session-based queries - cost optimization
  studentType: text("student_type", { enum: ["student", "child"] }).notNull(), // Type to distinguish source table
  attendanceDate: timestamp("attendance_date").notNull(),
  status: text("status", { enum: ["present", "absent", "late", "excused"] })
    .notNull()
    .default("absent"),
  notes: text("notes"),
  markedBy: integer("marked_by").references(() => users.id), // Teacher who marked attendance
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Group Financial Transactions Table - Updated to support mixed assignments (students and children)
export const groupTransactions = pgTable("group_transactions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  groupId: integer("group_id")
    .references(() => groups.id)
    .notNull(),
  studentId: integer("student_id").notNull(), // ID from either users or children table
  userId: integer("user_id"), // Corresponding user ID for efficient session-based queries
  studentType: text("student_type", { enum: ["student", "child"] }).notNull(), // Type to distinguish source table
  transactionType: text("transaction_type", {
    enum: ["payment", "fee", "refund", "discount"],
  }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount in dinars (consistent with payments)
  currency: text("currency").notNull().default("DZD"), // Algerian Dinar
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method", {
    enum: ["cash", "bank_transfer", "card", "mobile"],
  }),
  status: text("status", { enum: ["pending", "paid", "overdue", "cancelled"] })
    .notNull()
    .default("pending"),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id), // Admin/teacher who recorded
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Monthly payment status for students - Database-only payment tracking
export const studentMonthlyPayments = pgTable(
  "student_monthly_payments",
  {
    id: serial("id").primaryKey(),
    schoolId: integer("school_id")
      .references(() => schools.id)
      .notNull(),
    groupId: integer("group_id")
      .references(() => groups.id)
      .notNull(), // CRITICAL: Group-specific payments
    userId: integer("user_id").notNull(), // User ID (parent ID for children, student ID for direct students)
    studentId: integer("student_id").notNull(), // Student or child ID
    studentType: text("student_type", { enum: ["student", "child"] }).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    isPaid: boolean("is_paid").default(true).notNull(), // Always true since we only create records for payments
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paidAt: timestamp("paid_at").notNull(),
    paidBy: integer("paid_by").references(() => users.id), // admin who marked as paid
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate payments PER GROUP
    uniquePayment: unique().on(
      table.studentId,
      table.year,
      table.month,
      table.schoolId,
      table.groupId,
    ),
  }),
);

// Manual Financial Entries table for gains and losses tracking
export const financialEntries = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  type: text("type", { enum: ["gain", "loss"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  remarks: text("remarks").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(),
  receiptId: text("receipt_id"), // For tracking which payment receipt created this entry
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teacher Payment Status table - tracks which payments have been marked as paid
export const teacherPaymentStatus = pgTable("teacher_payment_status", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  teacherId: integer("teacher_id")
    .references(() => users.id)
    .notNull(),
  paymentMonth: text("payment_month").notNull(), // e.g., "2025-09"
  isPaid: boolean("is_paid").default(false).notNull(),
  markedPaidAt: timestamp("marked_paid_at"),
  markedPaidBy: integer("marked_paid_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate status entries
  uniquePaymentStatus: unique().on(
    table.schoolId,
    table.teacherId,
    table.paymentMonth,
  ),
}));

export const formationRegistrations = pgTable("formation_registrations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  formationId: integer("formation_id").references(() => formations.id),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Courses table - similar to formations but for دورات
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(), // Duration/period of the course
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  courseDate: text("course_date").notNull(), // Date when course starts
  courseTime: text("course_time").notNull(), // Time when course starts
  subjectId: integer("subject_id").references(() => teachingModules.id), // Subject reference
  educationLevel: text("education_level"), // Primary, Middle, Secondary for child filtering
  grade: text("grade"), // Specific grade/year within education level
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Course registrations table - supports both student and child registrations
export const courseRegistrations = pgTable("course_registrations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  courseId: integer("course_id").references(() => courses.id),
  userId: integer("user_id")
    .references(() => users.id), // Registering user (student or parent) - null for new students without accounts
  registrantType: text("registrant_type", {
    enum: ["self", "child"],
  }).notNull(), // self for students, child for parents
  childId: integer("child_id").references(() => children.id), // null for self-registration
  fullName: text("full_name").notNull(), // Name of participant (student or child)
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  childName: text("child_name"), // Child's name if registrant_type is "child"
  childAge: integer("child_age"), // Child's age if applicable
  paymentStatus: text("payment_status", {
    enum: ["unpaid", "paid"],
  }).default("unpaid").notNull(), // Payment status for course subscription
  paidAt: timestamp("paid_at"), // When payment was made
  paidBy: integer("paid_by"), // Admin who processed the payment
  receiptId: text("receipt_id"), // Receipt identifier for payment tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  parentId: integer("parent_id").references(() => users.id),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female"] }), // Gender field for children
  educationLevel: text("education_level").notNull(), // الابتدائي, المتوسط, الثانوي
  grade: text("grade").notNull(), // specific grade within level
  selectedSubjects: text("selected_subjects").array(), // Array of subject IDs they want to study
  qrCode: text("qr_code").unique(), // Unique QR code for identification
  qrCodeData: text("qr_code_data"), // JSON data encoded in QR code
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(), // Student name
  phone: text("phone"), // Phone number (optional for pre-registered students)
  gender: text("gender").notNull(), // Gender field for students
  educationLevel: text("education_level").notNull(), // الابتدائي, المتوسط, الثانوي
  grade: text("grade").notNull(), // specific grade within level
  selectedSubjects: text("selected_subjects").array(), // Array of subject IDs they want to study
  qrCode: text("qr_code").unique(), // Unique QR code for identification
  qrCodeData: text("qr_code_data"), // JSON data encoded in QR code
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(), // 'suggestion', 'message', 'blog', 'announcement', 'group_update'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  relatedId: integer("related_id"), // ID of related entity (suggestion, message, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teachingModules = pgTable("teaching_modules", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id), // null for global subjects
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(), // Arabic name
  educationLevel: text("education_level").notNull(), // الابتدائي، المتوسط، الثانوي
  grade: text("grade"), // Optional - DEPRECATED: use module_years table instead
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ChatGPT's solution: Separate mapping table for module-year relationships
// This prevents subject duplication and keeps the database clean
export const moduleYears = pgTable("module_years", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id")
    .references(() => teachingModules.id, { onDelete: "cascade" })
    .notNull(),
  grade: text("grade").notNull(), // السنة الأولى ابتدائي, السنة الثانية ابتدائي, جميع المستويات, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherSpecializations = pgTable("teacher_specializations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  teacherId: integer("teacher_id").references(() => users.id), // Reference to teacher user
  moduleId: integer("module_id").references(() => teachingModules.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schedule Tables - Multiple independent schedule tables for different classrooms
export const scheduleTables = pgTable("schedule_tables", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  name: text("name").notNull(), // e.g., "Salle 1", "Salle 2"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Cells - Individual cells within schedule tables
export const scheduleCells = pgTable("schedule_cells", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  scheduleTableId: integer("schedule_table_id").references(
    () => scheduleTables.id,
    { onDelete: "cascade" },
  ),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  period: integer("period").notNull(), // 1, 2, 3, etc.
  duration: integer("duration").notNull().default(1), // 1=1.5h, 2=3h, 3=4.5h
  startTime: text("start_time"), // HH:MM format (e.g., "08:30")
  endTime: text("end_time"), // HH:MM format (e.g., "10:00")
  educationLevel: text("education_level").notNull(), // 'الابتدائي', 'المتوسط', 'الثانوي'
  grade: text("grade"), // Specific grade within education level
  gender: text("gender", { enum: ["male", "female", "mixed"] }), // Group gender type
  subjectId: integer("subject_id").references(() => teachingModules.id),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push subscriptions table for web push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
});

// Notification logs table to track sent notifications
export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  userId: integer("user_id").references(() => users.id), // null for broadcast
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"), // Additional notification data
  type: text("type").notNull(), // message, announcement, group, attendance, etc.
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  success: boolean("success").default(true),
  error: text("error"), // Error message if sending failed
});

// Insert schemas
export const insertUserSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z
    .string()
    .regex(/^(\+213|0)(5|6|7)[0-9]{8}$/, "رقم هاتف جزائري غير صحيح"),
  role: z.string().optional(),
});

export const insertAdminSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z
    .string()
    .regex(/^(\+213|0)(5|6|7)[0-9]{8}$/, "رقم هاتف جزائري غير صحيح"),
  role: z.string().optional(),
  adminKey: z.string().min(1, "مفتاح الإدارة مطلوب"),
});

export const insertTeacherUserSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z
    .string()
    .regex(/^(\+213|0)(5|6|7)[0-9]{8}$/, "رقم هاتف جزائري غير صحيح"),
  role: z.string().optional(),
  teacherKey: z.string().min(1, "مفتاح المعلم مطلوب"),
  gender: z.enum(["male", "female"], { required_error: "الجنس مطلوب" }),
});

export const insertStudentSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z
    .string()
    .regex(/^(\+213|0)(5|6|7)[0-9]{8}$/, "رقم هاتف جزائري غير صحيح"),
  role: z.string().optional(),
  gender: z.enum(["male", "female"], { required_error: "الجنس مطلوب" }),
  educationLevel: z.string().min(1, "المستوى التعليمي مطلوب"),
  grade: z.string().min(1, "السنة الدراسية مطلوبة"),
});

export const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  imageUrl: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  content: true,
  imageUrl: true,
  published: true,
});

export const insertTeacherSchema = z.object({
  name: z.string().min(1, "اسم المعلم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().optional().or(z.literal("")).nullable(),
  subject: z.string().min(1, "المادة مطلوبة"),
  bio: z.string().optional().or(z.literal("")).nullable(),
  imageUrl: z.string().optional().or(z.literal("")).nullable(),
  available: z.boolean().optional().default(true),
  schoolId: z.number().optional(), // Will be added from session
});

export const insertMessageSchema = createInsertSchema(messages)
  .pick({
    schoolId: true,
    senderId: true,
    receiverId: true,
    teacherId: true,
    subject: true,
    content: true,
  })
  .extend({
    teacherId: z.number().optional().nullable(), // Make teacherId optional and nullable
    receiverId: z.number().optional().nullable(), // Make receiverId optional and nullable for teacher messages
    senderId: z.number(), // senderId is required
    schoolId: z.number().optional(), // schoolId will be set from session
  });

export const insertSuggestionSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.string(),
  userId: z.number().optional(),
  status: z.string().optional(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  schoolId: true,
  name: true,
  description: true,
  category: true,
  imageUrl: true,
  maxMembers: true,
  groupNumber: true,
});

export const insertFormationSchema = createInsertSchema(formations).pick({
  title: true,
  description: true,
  duration: true,
  price: true,
  imageUrl: true,
  category: true,
});

export const insertGroupRegistrationSchema = createInsertSchema(
  groupRegistrations,
).pick({
  groupId: true,
  fullName: true,
  phone: true,
  email: true,
});

export const insertGroupUserAssignmentSchema = createInsertSchema(
  groupUserAssignments,
).pick({
  groupId: true,
  userId: true,
  assignedBy: true,
});

export const insertGroupMixedAssignmentSchema = createInsertSchema(
  groupMixedAssignments,
).pick({
  groupId: true,
  studentId: true,
  studentType: true,
  assignedBy: true,
});

// School-related schemas
export const insertSchoolSchema = createInsertSchema(schools).pick({
  name: true,
  code: true,
  domain: true,
  location: true,
  fullAddress: true,
  adminPhone: true,
  schoolEmail: true,
  website: true,
  adminKey: true,
  teacherKey: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  settings: true,
});

export const schoolSelectionSchema = z.object({
  schoolCode: z.string().min(1, "كود المدرسة مطلوب"),
});

// Super admin schema
export const insertSuperAdminSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z
    .string()
    .min(8, "رقم الهاتف يجب أن يكون على الأقل 8 أرقام")
    .max(20, "رقم الهاتف طويل جداً"), // Flexible phone validation for super admins
  superAdminKey: z.string().min(1, "مفتاح المسؤول العام مطلوب"),
});

// Additional multi-tenancy types
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;
export type SchoolSelection = z.infer<typeof schoolSelectionSchema>;

// Frontend schema (includes userId but schoolId added on server)
export const formationRegistrationClientSchema = z.object({
  formationId: z.number().min(1, "معرف التكوين مطلوب"),
  userId: z.number().min(1, "معرف المستخدم مطلوب"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب").max(20, "رقم الهاتف طويل جداً"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
});

// Server schema (with schoolId and userId)
export const insertFormationRegistrationSchema = z.object({
  formationId: z.number().min(1, "معرف التكوين مطلوب"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب").max(20, "رقم الهاتف طويل جداً"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  schoolId: z.number().min(1, "معرف المدرسة مطلوب"),
  userId: z.number().min(1, "معرف المستخدم مطلوب"),
});

export const insertChildSchema = createInsertSchema(children).pick({
  parentId: true,
  name: true,
  gender: true,
  educationLevel: true,
  grade: true,
  schoolId: true,
});

export const insertStudentDataSchema = createInsertSchema(students).pick({
  userId: true,
  name: true,
  phone: true,
  gender: true,
  educationLevel: true,
  grade: true,
  selectedSubjects: true,
  schoolId: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  schoolId: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  relatedId: true,
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  blockerId: true,
  blockedId: true,
  reason: true,
});

export const insertUserReportSchema = createInsertSchema(userReports).pick({
  reporterId: true,
  reportedUserId: true,
  messageId: true,
  reason: true,
  description: true,
});

export const insertTeachingModuleSchema = createInsertSchema(
  teachingModules,
).pick({
  name: true,
  nameAr: true,
  educationLevel: true,
  grade: true, // DEPRECATED: use moduleYears table instead
  description: true,
});

export const insertModuleYearSchema = createInsertSchema(moduleYears).pick({
  moduleId: true,
  grade: true,
});

export const insertTeacherSpecializationSchema = createInsertSchema(
  teacherSpecializations,
).pick({
  schoolId: true,
  teacherId: true,
  moduleId: true,
});

export const insertScheduleTableSchema = createInsertSchema(
  scheduleTables,
).pick({
  name: true,
  description: true,
  isActive: true,
});

export const insertScheduleCellSchema = createInsertSchema(scheduleCells).pick({
  scheduleTableId: true,
  dayOfWeek: true,
  period: true,
  duration: true,
  startTime: true,
  endTime: true,
  educationLevel: true,
  grade: true,
  gender: true,
  subjectId: true,
  teacherId: true,
  schoolId: true,
});

export const insertGroupAttendanceSchema = createInsertSchema(
  groupAttendance,
).pick({
  groupId: true,
  studentId: true,
  userId: true,
  studentType: true,
  attendanceDate: true,
  status: true,
  notes: true,
  markedBy: true,
  schoolId: true,
});

export const insertGroupTransactionSchema = createInsertSchema(
  groupTransactions,
).pick({
  groupId: true,
  studentId: true,
  transactionType: true,
  amount: true,
  currency: true,
  description: true,
  dueDate: true,
  paidDate: true,
  paymentMethod: true,
  status: true,
  notes: true,
  recordedBy: true,
  schoolId: true,
});

export const insertStudentMonthlyPaymentSchema = createInsertSchema(
  studentMonthlyPayments,
).pick({
  studentId: true,
  userId: true,
  year: true,
  month: true,
  isPaid: true,
  amount: true,
  paidAt: true,
  paidBy: true,
  notes: true,
  schoolId: true,
  studentType: true,
});

export const insertFinancialEntrySchema = createInsertSchema(
  financialEntries,
).pick({
  schoolId: true,
  type: true,
  amount: true,
  remarks: true,
  year: true,
  month: true,
  recordedBy: true,
  receiptId: true,
});

export const insertTeacherPaymentStatusSchema = createInsertSchema(
  teacherPaymentStatus,
).pick({
  schoolId: true,
  teacherId: true,
  paymentMonth: true,
  isPaid: true,
  markedPaidAt: true,
  markedPaidBy: true,
});

// Course schemas
export const insertCourseSchema = createInsertSchema(courses).pick({
  schoolId: true,
  title: true,
  description: true,
  duration: true,
  price: true,
  imageUrl: true,
  courseDate: true,
  courseTime: true,
  subjectId: true,
  educationLevel: true,
  grade: true,
});

export const insertCourseRegistrationSchema = createInsertSchema(
  courseRegistrations,
).pick({
  schoolId: true,
  courseId: true,
  userId: true,
  registrantType: true,
  childId: true,
  fullName: true,
  phone: true,
  email: true,
  childName: true,
  childAge: true,
  paymentStatus: true,
  paidAt: true,
  paidBy: true,
  receiptId: true,
});

// Push notification schemas
export const insertPushSubscriptionSchema = createInsertSchema(
  pushSubscriptions,
).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertNotificationLogSchema = createInsertSchema(
  notificationLogs,
).omit({
  id: true,
  sentAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Formation = typeof formations.$inferSelect;
export type InsertFormation = z.infer<typeof insertFormationSchema>;
export type GroupRegistration = typeof groupRegistrations.$inferSelect;
export type InsertGroupRegistration = z.infer<
  typeof insertGroupRegistrationSchema
>;
export type GroupUserAssignment = typeof groupUserAssignments.$inferSelect;
export type InsertGroupUserAssignment = z.infer<
  typeof insertGroupUserAssignmentSchema
>;
export type GroupMixedAssignment = typeof groupMixedAssignments.$inferSelect;
export type InsertGroupMixedAssignment = z.infer<
  typeof insertGroupMixedAssignmentSchema
>;
export type FormationRegistration = typeof formationRegistrations.$inferSelect;
export type InsertFormationRegistration = z.infer<
  typeof insertFormationRegistrationSchema
>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentDataSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TeachingModule = typeof teachingModules.$inferSelect;
export type InsertTeachingModule = z.infer<typeof insertTeachingModuleSchema>;
export type TeacherSpecialization = typeof teacherSpecializations.$inferSelect;
export type InsertTeacherSpecialization = z.infer<
  typeof insertTeacherSpecializationSchema
>;
export type ScheduleTable = typeof scheduleTables.$inferSelect;
export type InsertScheduleTable = z.infer<typeof insertScheduleTableSchema>;
export type ScheduleCell = typeof scheduleCells.$inferSelect;
export type InsertScheduleCell = z.infer<typeof insertScheduleCellSchema>;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
export type GroupAttendance = typeof groupAttendance.$inferSelect;
export type InsertGroupAttendance = z.infer<typeof insertGroupAttendanceSchema>;
export type GroupTransaction = typeof groupTransactions.$inferSelect;
export type InsertGroupTransaction = z.infer<
  typeof insertGroupTransactionSchema
>;
export type StudentMonthlyPayment = typeof studentMonthlyPayments.$inferSelect;
export type InsertStudentMonthlyPayment = z.infer<
  typeof insertStudentMonthlyPaymentSchema
>;
export type FinancialEntry = typeof financialEntries.$inferSelect;
export type InsertFinancialEntry = z.infer<typeof insertFinancialEntrySchema>;
export type TeacherPaymentStatus = typeof teacherPaymentStatus.$inferSelect;
export type InsertTeacherPaymentStatus = z.infer<typeof insertTeacherPaymentStatusSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseRegistration = typeof courseRegistrations.$inferSelect;
export type InsertCourseRegistration = z.infer<
  typeof insertCourseRegistrationSchema
>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<
  typeof insertPushSubscriptionSchema
>;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
