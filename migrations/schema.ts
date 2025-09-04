import { pgTable, foreignKey, serial, integer, text, timestamp, boolean, jsonb, numeric, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const blockedUsers = pgTable("blocked_users", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	blockerId: integer("blocker_id").notNull(),
	blockedId: integer("blocked_id").notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "blocked_users_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.blockerId],
			foreignColumns: [users.id],
			name: "blocked_users_blocker_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.blockedId],
			foreignColumns: [users.id],
			name: "blocked_users_blocked_id_users_id_fk"
		}),
]);

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	imageUrl: text("image_url"),
	authorId: integer("author_id"),
	published: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "blog_posts_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "blog_posts_author_id_users_id_fk"
		}),
]);

export const children = pgTable("children", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	parentId: integer("parent_id"),
	name: text().notNull(),
	gender: text(),
	educationLevel: text("education_level").notNull(),
	grade: text().notNull(),
	selectedSubjects: text("selected_subjects").array(),
	qrCode: text("qr_code"),
	qrCodeData: text("qr_code_data"),
	verified: boolean().default(false),
	verificationNotes: text("verification_notes"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verifiedBy: integer("verified_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "children_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [users.id],
			name: "children_parent_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "children_verified_by_users_id_fk"
		}),
]);

export const formationRegistrations = pgTable("formation_registrations", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	formationId: integer("formation_id"),
	fullName: text("full_name").notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "formation_registrations_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: "formation_registrations_formation_id_formations_id_fk"
		}),
]);

export const formations = pgTable("formations", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	duration: text().notNull(),
	price: text().notNull(),
	imageUrl: text("image_url"),
	category: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "formations_school_id_schools_id_fk"
		}),
]);

export const groupAttendance = pgTable("group_attendance", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	groupId: integer("group_id").notNull(),
	studentId: integer("student_id").notNull(),
	studentType: text("student_type").notNull(),
	attendanceDate: timestamp("attendance_date", { mode: 'string' }).notNull(),
	status: text().default('absent').notNull(),
	notes: text(),
	markedBy: integer("marked_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "group_attendance_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_attendance_group_id_groups_id_fk"
		}),
	foreignKey({
			columns: [table.markedBy],
			foreignColumns: [users.id],
			name: "group_attendance_marked_by_users_id_fk"
		}),
]);

export const groupMixedAssignments = pgTable("group_mixed_assignments", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	groupId: integer("group_id"),
	studentId: integer("student_id"),
	studentType: text("student_type").notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	assignedBy: integer("assigned_by"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "group_mixed_assignments_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_mixed_assignments_group_id_groups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "group_mixed_assignments_assigned_by_users_id_fk"
		}),
]);

export const announcements = pgTable("announcements", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	imageUrl: text("image_url"),
	authorId: integer("author_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "announcements_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "announcements_author_id_users_id_fk"
		}),
]);

export const groupScheduleAssignments = pgTable("group_schedule_assignments", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	groupId: integer("group_id"),
	scheduleCellId: integer("schedule_cell_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	assignedBy: integer("assigned_by"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "group_schedule_assignments_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_schedule_assignments_group_id_groups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "group_schedule_assignments_assigned_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.scheduleCellId],
			foreignColumns: [scheduleCells.id],
			name: "group_schedule_assignments_schedule_cell_id_schedule_cells_id_f"
		}).onDelete("cascade"),
]);

export const groupUserAssignments = pgTable("group_user_assignments", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	groupId: integer("group_id"),
	userId: integer("user_id"),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	assignedBy: integer("assigned_by"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "group_user_assignments_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_user_assignments_group_id_groups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_user_assignments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "group_user_assignments_assigned_by_users_id_fk"
		}),
]);

export const groupTransactions = pgTable("group_transactions", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	groupId: integer("group_id").notNull(),
	studentId: integer("student_id").notNull(),
	studentType: text("student_type").notNull(),
	transactionType: text("transaction_type").notNull(),
	amount: integer().notNull(),
	currency: text().default('DZD').notNull(),
	description: text().notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	paidDate: timestamp("paid_date", { mode: 'string' }),
	paymentMethod: text("payment_method"),
	status: text().default('pending').notNull(),
	notes: text(),
	recordedBy: integer("recorded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "group_transactions_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_transactions_group_id_groups_id_fk"
		}),
	foreignKey({
			columns: [table.recordedBy],
			foreignColumns: [users.id],
			name: "group_transactions_recorded_by_users_id_fk"
		}),
]);

export const groups = pgTable("groups", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	imageUrl: text("image_url"),
	maxMembers: integer("max_members"),
	educationLevel: text("education_level"),
	subjectId: integer("subject_id"),
	teacherId: integer("teacher_id"),
	studentsAssigned: integer("students_assigned").array(),
	isAdminManaged: boolean("is_admin_managed").default(false),
	scheduleCellId: integer("schedule_cell_id"),
	lessonsPerWeek: integer("lessons_per_week").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "groups_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [teachingModules.id],
			name: "groups_subject_id_teaching_modules_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "groups_teacher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.scheduleCellId],
			foreignColumns: [scheduleCells.id],
			name: "groups_schedule_cell_id_schedule_cells_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	userId: integer("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	read: boolean().default(false).notNull(),
	relatedId: integer("related_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "notifications_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	schoolId: integer("school_id").notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	lastUsed: timestamp("last_used", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "push_subscriptions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "push_subscriptions_school_id_schools_id_fk"
		}),
]);

export const scheduleTables = pgTable("schedule_tables", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "schedule_tables_school_id_schools_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	senderId: integer("sender_id"),
	receiverId: integer("receiver_id"),
	teacherId: integer("teacher_id"),
	subject: text().notNull(),
	content: text().notNull(),
	read: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "messages_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [teachers.id],
			name: "messages_teacher_id_teachers_id_fk"
		}),
]);

export const scheduleCells = pgTable("schedule_cells", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	scheduleTableId: integer("schedule_table_id"),
	dayOfWeek: integer("day_of_week").notNull(),
	period: integer().notNull(),
	duration: integer().default(1).notNull(),
	startTime: text("start_time"),
	endTime: text("end_time"),
	educationLevel: text("education_level").notNull(),
	grade: text(),
	gender: text(),
	subjectId: integer("subject_id"),
	teacherId: integer("teacher_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "schedule_cells_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.scheduleTableId],
			foreignColumns: [scheduleTables.id],
			name: "schedule_cells_schedule_table_id_schedule_tables_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [teachingModules.id],
			name: "schedule_cells_subject_id_teaching_modules_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "schedule_cells_teacher_id_users_id_fk"
		}),
]);

export const notificationLogs = pgTable("notification_logs", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	userId: integer("user_id"),
	title: text().notNull(),
	body: text().notNull(),
	data: jsonb(),
	type: text().notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
	success: boolean().default(true),
	error: text(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "notification_logs_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_logs_user_id_users_id_fk"
		}),
]);

export const students = pgTable("students", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	userId: integer("user_id"),
	gender: text().notNull(),
	educationLevel: text("education_level").notNull(),
	grade: text().notNull(),
	selectedSubjects: text("selected_subjects").array(),
	qrCode: text("qr_code"),
	qrCodeData: text("qr_code_data"),
	verified: boolean().default(false),
	verificationNotes: text("verification_notes"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verifiedBy: integer("verified_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	phone: text(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "students_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "students_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "students_verified_by_users_id_fk"
		}),
]);

export const suggestions = pgTable("suggestions", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	userId: integer("user_id"),
	title: text().notNull(),
	content: text().notNull(),
	category: text().notNull(),
	status: text().default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "suggestions_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "suggestions_user_id_users_id_fk"
		}),
]);

export const teacherSpecializations = pgTable("teacher_specializations", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	teacherId: integer("teacher_id"),
	moduleId: integer("module_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "teacher_specializations_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "teacher_specializations_teacher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [teachingModules.id],
			name: "teacher_specializations_module_id_teaching_modules_id_fk"
		}),
]);

export const studentMonthlyPayments = pgTable("student_monthly_payments", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	studentId: integer("student_id").notNull(),
	studentType: text("student_type").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	isPaid: boolean("is_paid").default(false).notNull(),
	amount: numeric({ precision: 10, scale:  2 }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	paidBy: integer("paid_by"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "student_monthly_payments_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.paidBy],
			foreignColumns: [users.id],
			name: "student_monthly_payments_paid_by_users_id_fk"
		}),
]);

export const schools = pgTable("schools", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	domain: text(),
	location: text(),
	adminKey: text("admin_key").notNull(),
	teacherKey: text("teacher_key").notNull(),
	logoUrl: text("logo_url"),
	primaryColor: text("primary_color").default('#3b82f6'),
	secondaryColor: text("secondary_color").default('#1e40af'),
	settings: jsonb(),
	active: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("schools_code_unique").on(table.code),
]);

export const teachers = pgTable("teachers", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	name: text().notNull(),
	subject: text().notNull(),
	bio: text(),
	imageUrl: text("image_url"),
	email: text().notNull(),
	phone: text(),
	available: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "teachers_school_id_schools_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id"),
	email: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	phone: text().notNull(),
	phoneVerified: boolean("phone_verified").default(false),
	phoneVerificationCode: text("phone_verification_code"),
	phoneVerificationExpiry: timestamp("phone_verification_expiry", { mode: 'string' }),
	emailVerified: boolean("email_verified").default(false),
	emailVerificationCode: text("email_verification_code"),
	emailVerificationExpiry: timestamp("email_verification_expiry", { mode: 'string' }),
	profilePicture: text("profile_picture"),
	role: text().default('user').notNull(),
	gender: text(),
	firebaseUid: text("firebase_uid"),
	verified: boolean().default(false),
	verificationNotes: text("verification_notes"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verifiedBy: integer("verified_by"),
	banned: boolean().default(false),
	banReason: text("ban_reason"),
	bannedAt: timestamp("banned_at", { mode: 'string' }),
	bannedBy: integer("banned_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "users_school_id_schools_id_fk"
		}),
]);

export const groupRegistrations = pgTable("group_registrations", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	groupId: integer("group_id"),
	fullName: text("full_name").notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "group_registrations_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_registrations_group_id_groups_id_fk"
		}),
]);

export const teachingModules = pgTable("teaching_modules", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id"),
	name: text().notNull(),
	nameAr: text("name_ar").notNull(),
	educationLevel: text("education_level").notNull(),
	grade: text(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "teaching_modules_school_id_schools_id_fk"
		}),
]);

export const userReports = pgTable("user_reports", {
	id: serial().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	reporterId: integer("reporter_id").notNull(),
	reportedUserId: integer("reported_user_id").notNull(),
	messageId: integer("message_id"),
	reason: text().notNull(),
	description: text(),
	status: text().default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "user_reports_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [users.id],
			name: "user_reports_reporter_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.reportedUserId],
			foreignColumns: [users.id],
			name: "user_reports_reported_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "user_reports_message_id_messages_id_fk"
		}),
]);

export const moduleYears = pgTable("module_years", {
	id: serial().primaryKey().notNull(),
	moduleId: integer("module_id").notNull(),
	grade: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [teachingModules.id],
			name: "module_years_module_id_fkey"
		}).onDelete("cascade"),
]);
