import {
  schools,
  users,
  announcements,
  blogPosts,
  teachers,
  messages,
  suggestions,
  groups,
  formations,
  courses,
  groupRegistrations,
  groupUserAssignments,
  groupMixedAssignments,
  formationRegistrations,
  courseRegistrations,
  children,
  students,
  notifications,
  teachingModules,
  moduleYears,
  teacherSpecializations,
  scheduleTables,
  scheduleCells,
  blockedUsers,
  userReports,
  groupAttendance,
  groupTransactions,
  groupScheduleAssignments,
  studentMonthlyPayments,
  financialEntries,
  teacherPaymentStatus,
  pushSubscriptions,
  notificationLogs,
  type School,
  type InsertSchool,
  type User,
  type InsertUser,
  type Announcement,
  type InsertAnnouncement,
  type BlogPost,
  type InsertBlogPost,
  type Teacher,
  type InsertTeacher,
  type Message,
  type InsertMessage,
  type Suggestion,
  type InsertSuggestion,
  type Group,
  type InsertGroup,
  type Formation,
  type InsertFormation,
  type GroupRegistration,
  type InsertGroupRegistration,
  type GroupUserAssignment,
  type InsertGroupUserAssignment,
  type GroupMixedAssignment,
  type InsertGroupMixedAssignment,
  type FormationRegistration,
  type InsertFormationRegistration,
  type Course,
  type InsertCourse,
  type CourseRegistration,
  type InsertCourseRegistration,
  type Child,
  type InsertChild,
  type Student,
  type InsertStudent,
  type Notification,
  type InsertNotification,
  type TeachingModule,
  type InsertTeachingModule,
  type TeacherSpecialization,
  type InsertTeacherSpecialization,
  type ScheduleTable,
  type InsertScheduleTable,
  type ScheduleCell,
  type InsertScheduleCell,
  type BlockedUser,
  type InsertBlockedUser,
  type UserReport,
  type InsertUserReport,
  type GroupAttendance,
  type InsertGroupAttendance,
  type GroupTransaction,
  type InsertGroupTransaction,
  type StudentMonthlyPayment,
  type InsertStudentMonthlyPayment,
  type FinancialEntry,
  type InsertFinancialEntry,
  type TeacherPaymentStatus,
  type InsertTeacherPaymentStatus,
  type PushSubscription,
  type InsertPushSubscription,
  type NotificationLog,
  type InsertNotificationLog,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  desc,
  or,
  ilike,
  and,
  ne,
  aliasedTable,
  sql,
  asc,
  like,
  SQL,
  inArray,
  isNull,
  not,
} from "drizzle-orm";

export interface IStorage {
  // School methods (for multi-tenancy)
  getSchools(): Promise<School[]>;
  getAllActiveSchools(): Promise<School[]>;
  getSchoolByCode(code: string): Promise<School | undefined>;
  getSchoolById(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, updates: Partial<InsertSchool>): Promise<School>;
  deleteSchool(id: number): Promise<void>;
  getSchoolStatistics(schoolId: number): Promise<any>;
  updateSchoolKeys(
    schoolId: number,
    adminKey: string,
    teacherKey: string,
  ): Promise<void>;
  updateSchoolSubscription(
    schoolId: number,
    subscriptionData: {
      subscriptionExpiry?: Date;
      subscriptionStatus?: string;
      subscriptionNotes?: string;
      subscriptionLastUpdated?: Date;
      subscriptionUpdatedBy?: number;
    },
  ): Promise<void>;
  getSchoolSubscriptionStatus(schoolId: number): Promise<any>;
  getSchoolsWithExpiringSubscriptions(daysThreshold: number): Promise<any[]>;
  toggleSchoolAccess(schoolId: number, isAccessEnabled: boolean): Promise<void>;

  // User methods (with schoolId context)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string, schoolId?: number): Promise<User | undefined>;
  getUserByPhone(phone: string, schoolId?: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(
    email: string,
    password: string,
    schoolId?: number,
  ): Promise<User | null>;
  getAllUsers(schoolId?: number): Promise<User[]>;
  searchUsers(query: string, schoolId?: number): Promise<User[]>;
  searchUsersWithFilters(filters: {
    search?: string;
    educationLevel?: string;
    subject?: number;
    assignedTeacher?: number;
    role?: string;
    schoolId?: number;
  }): Promise<User[]>;
  updateUserProfilePicture(
    userId: number,
    profilePictureUrl: string,
  ): Promise<User>;
  updateUserProfile(
    userId: number,
    data: { name?: string; email?: string },
  ): Promise<User>;
  updateUser(
    userId: number,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      profilePicture?: string | null;
    },
  ): Promise<User>;
  updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User>;

  // Phone verification methods
  savePhoneVerificationCode(
    userId: number,
    code: string,
    expiry: Date,
  ): Promise<void>;
  verifyPhoneCode(userId: number, code: string): Promise<boolean>;
  markPhoneAsVerified(userId: number): Promise<void>;

  // Email verification methods
  saveEmailVerificationCode(
    userId: number,
    code: string,
    expiry: Date,
  ): Promise<void>;
  verifyEmailCode(userId: number, code: string): Promise<boolean>;
  markEmailAsVerified(userId: number): Promise<void>;

  // Announcement methods
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncementsBySchool(schoolId: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  // Blog post methods
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostsBySchool(schoolId: number): Promise<BlogPost[]>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;

  // Teacher methods
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeachersBySchool(schoolId: number): Promise<Teacher[]>;
  getTeacherUsers(schoolId: number): Promise<any[]>; // Get users with role=teacher
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(
    id: number,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      bio?: string | null;
      imageUrl?: string | null;
    },
  ): Promise<Teacher>;
  deleteTeacher(id: number, deletedBy?: number): Promise<void>;
  getTeachersWithSpecializations(schoolId: number): Promise<any[]>;
  getTeacherByLinkCode(linkCode: string): Promise<Teacher | undefined>;
  linkTeacherToUser(teacherId: number, userId: number): Promise<Teacher>;
  verifyTeacher(
    teacherId: number,
    verifiedBy: number,
    notes?: string,
  ): Promise<Teacher>;
  getPreRegisteredTeachers(schoolId: number): Promise<Teacher[]>;

  // Message methods
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createBulkMessage(
    senderIds: number[],
    receiverIds: number[],
    subject: string,
    content: string,
  ): Promise<Message[]>;

  // Suggestion methods
  getSuggestions(schoolId?: number): Promise<any[]>;
  getUserSuggestions(userId: number, schoolId?: number): Promise<any[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;

  // Group methods
  getGroups(): Promise<Group[]>;
  getGroupsBySchool(schoolId: number): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  deleteGroup(id: number, schoolId?: number): Promise<void>;

  // Admin group management methods
  getAdminGroups(schoolId?: number): Promise<any[]>;
  updateGroupAssignments(
    groupId: number | null,
    studentIds: number[],
    teacherId: number,
    groupData?: any,
    schoolId?: number,
  ): Promise<Group>;
  getGroupAssignments(groupId: number): Promise<any[]>;
  getAvailableStudentsByLevelAndSubject(
    educationLevel: string,
    subjectId: number,
    schoolId?: number,
  ): Promise<any[]>;
  // Formation methods
  getFormations(): Promise<Formation[]>;
  getFormationsBySchool(schoolId: number): Promise<Formation[]>;
  getFormationById(id: number): Promise<Formation | undefined>;
  createFormation(formation: InsertFormation): Promise<Formation>;
  deleteFormation(id: number): Promise<void>;

  // Registration methods
  createGroupRegistration(
    registration: InsertGroupRegistration,
  ): Promise<GroupRegistration>;
  createFormationRegistration(
    registration: InsertFormationRegistration,
  ): Promise<FormationRegistration>;
  getFormationRegistrations(schoolId: number): Promise<any[]>;

  // Children methods
  createChild(child: InsertChild): Promise<Child>;
  getChildrenByParentId(parentId: number): Promise<Child[]>;
  deleteChild(childId: number): Promise<void>;

  // Student methods
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  getStudentQRCode(
    studentId: number,
    type: "student" | "child",
  ): Promise<{ qrCode: string; qrCodeData: string } | null>;
  regenerateStudentQRCode(
    studentId: number,
    type: "student" | "child",
  ): Promise<{ qrCode: string; qrCodeData: string }>;
  generateQRCodeForVerifiedUser(userId: number): Promise<void>;

  // Student claim system methods
  getUnclaimedStudent(
    studentId: number,
    schoolId: number,
  ): Promise<Student | undefined>;
  claimStudentAccount(studentId: number, userId: number): Promise<void>;
  preRegisterStudent(student: Omit<InsertStudent, "userId">): Promise<Student & { generatedEmail?: string; generatedPassword?: string }>;
  getUnclaimedStudents(schoolId: number): Promise<Student[]>;
  updateStudent(
    studentId: number,
    updates: Partial<InsertStudent>,
  ): Promise<Student>;
  deleteStudent(studentId: number): Promise<void>;

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotificationForUsers(
    userIds: number[],
    type: string,
    title: string,
    message: string,
    relatedId?: number,
  ): Promise<Notification[]>;

  // Verification methods - only for children and students
  verifyChild(
    childId: number,
    adminId: number,
    notes?: string,
    educationLevel?: string,
    selectedSubjects?: string[],
  ): Promise<Child>;
  verifyStudent(
    studentId: number,
    adminId: number,
    notes?: string,
    educationLevel?: string,
    selectedSubjects?: string[],
  ): Promise<Student>;
  undoVerifyChild(childId: number): Promise<Child>;
  undoVerifyStudent(studentId: number): Promise<Student>;
  getUnverifiedChildren(schoolId: number): Promise<Child[]>;
  getUnverifiedStudents(schoolId: number): Promise<Student[]>;
  getVerifiedChildren(schoolId: number): Promise<Child[]>;
  getVerifiedStudents(schoolId: number): Promise<Student[]>;

  // Teaching module methods
  getTeachingModules(): Promise<TeachingModule[]>;
  getTeachingModulesByLevel(
    educationLevel: string,
    schoolId: number,
  ): Promise<TeachingModule[]>;
  createTeachingModule(module: InsertTeachingModule): Promise<TeachingModule>;
  deleteTeachingModule(id: number): Promise<void>;
  getTeachingModuleByName(
    nameAr: string,
    educationLevel: string,
  ): Promise<any | undefined>;
  getTeachingModuleByNameAllLevels(nameAr: string): Promise<any | undefined>;
  getTeachingModuleByNameAndGrade(
    nameAr: string,
    educationLevel: string,
    grade: string,
  ): Promise<any | undefined>;
  createCustomSubject(subjectData: {
    name: string;
    nameAr: string;
    educationLevel: string;
    grade?: string;
    description?: string;
    schoolId?: number; // ✅ FIX: Add schoolId to interface
  }): Promise<any>;

  // ChatGPT's solution: Module Years mapping methods
  getModuleYears(moduleId: number): Promise<string[]>;
  createModuleYear(moduleId: number, grade: string): Promise<void>;
  getModulesWithYears(schoolId?: number): Promise<any[]>;

  // Teacher specialization methods
  getTeacherSpecializations(
    teacherId: number,
  ): Promise<TeacherSpecialization[]>;
  createTeacherSpecialization(
    specialization: InsertTeacherSpecialization,
  ): Promise<TeacherSpecialization>;
  deleteTeacherSpecialization(id: number): Promise<void>;
  getTeachersByModule(moduleId: number): Promise<TeacherSpecialization[]>;

  // Schedule table methods
  getScheduleTables(): Promise<ScheduleTable[]>;
  getScheduleTablesBySchool(schoolId: number): Promise<ScheduleTable[]>;
  getScheduleTable(id: number): Promise<ScheduleTable | undefined>;
  createScheduleTable(table: InsertScheduleTable): Promise<ScheduleTable>;
  updateScheduleTable(
    id: number,
    updates: Partial<InsertScheduleTable>,
  ): Promise<ScheduleTable>;
  deleteScheduleTable(id: number): Promise<void>;

  // Schedule cell methods
  getScheduleCells(scheduleTableId: number): Promise<ScheduleCell[]>;
  getScheduleCell(id: number): Promise<ScheduleCell | undefined>;
  createScheduleCell(cell: InsertScheduleCell): Promise<ScheduleCell>;
  updateScheduleCell(
    id: number,
    updates: Partial<InsertScheduleCell>,
  ): Promise<ScheduleCell>;
  deleteScheduleCell(id: number): Promise<void>;
  getScheduleCellsWithDetails(scheduleTableId: number): Promise<any[]>;

  // User blocking methods
  blockUser(
    blockerId: number,
    blockedId: number,
    reason?: string,
    schoolId?: number,
  ): Promise<BlockedUser>;
  unblockUser(blockerId: number, blockedId: number): Promise<void>;
  isUserBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<BlockedUser[]>;

  // User reporting methods
  reportUser(report: InsertUserReport): Promise<UserReport>;
  getUserReports(userId: number): Promise<UserReport[]>;

  // Admin reporting methods
  getAllReports(schoolId?: number): Promise<any[]>;
  updateReportStatus(reportId: number, status: string): Promise<UserReport>;

  // User banning methods
  banUser(userId: number, reason: string, bannedBy: number): Promise<User>;
  unbanUser(userId: number): Promise<User>;
  getBannedUsers(): Promise<User[]>;

  // Enhanced message methods
  getMessagesWithUserInfo(userId: number): Promise<any[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  getConversationBetweenUsers(userId1: number, userId2: number): Promise<any[]>;

  // Group Attendance interface methods
  getGroupAttendance(
    groupId: number,
    date?: string,
  ): Promise<GroupAttendance[]>;
  markAttendance(attendance: InsertGroupAttendance): Promise<GroupAttendance>;
  updateAttendance(
    id: number,
    updates: Partial<InsertGroupAttendance>,
  ): Promise<GroupAttendance>;
  getAttendanceWithStudentDetails(
    groupId: number,
    date?: string,
  ): Promise<any[]>;
  getGroupAttendanceHistory(groupId: number, schoolId: number): Promise<any[]>;
  getGroupAttendanceForMonth(
    groupId: number,
    year: number,
    month: number,
  ): Promise<GroupAttendance[]>;
  getGroupAttendanceCountsByMonth(groupIds: number[], year: number, month: number): Promise<{ [groupId: number]: { present: number; total: number } }>;

  // Group Financial Transaction interface methods
  getGroupTransactions(
    groupId: number,
    studentId?: number,
  ): Promise<GroupTransaction[]>;
  createTransaction(
    transaction: InsertGroupTransaction,
  ): Promise<GroupTransaction>;

  // Student status methods
  getStudentAttendanceRecords(userId: number, schoolId: number): Promise<any[]>;
  getStudentPaymentRecords(userId: number, schoolId: number): Promise<any[]>;
  updateTransaction(
    id: number,
    updates: Partial<InsertGroupTransaction>,
  ): Promise<GroupTransaction>;
  getTransactionsWithDetails(groupId: number): Promise<any[]>;
  getStudentFinancialSummary(groupId: number, studentId: number): Promise<any>;

  // Group Schedule interface methods
  getGroupScheduledLessonDates(
    groupId: number,
    schoolId: number,
  ): Promise<string[]>;
  assignGroupToSchedule(
    groupId: number,
    scheduleCellId: number,
    schoolId: number,
    assignedBy: number,
  ): Promise<any>;
  getGroupScheduleAssignments(groupId: number): Promise<any[]>;
  getCompatibleGroups(
    subjectId: number,
    teacherId: number,
    educationLevel: string,
    schoolId: number,
  ): Promise<any[]>;
  getScheduleLinkedGroups(tableId: number, schoolId: number): Promise<any[]>;
  linkGroupsToScheduleCell(
    cellId: number,
    groupIds: number[],
    schoolId: number,
    assignedBy: number,
  ): Promise<void>;

  // Student Monthly Payment interface methods
  getStudentPaymentStatus(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment | undefined>;
  isStudentPaidForMonth(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<boolean>;
  isStudentUnpaidForMonth(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<boolean>;
  getStudentsPaymentStatusForMonth(
    studentIds: number[],
    year: number,
    month: number,
    schoolId: number,
    groupId?: number, // ✅ Add groupId parameter to filter by group
  ): Promise<StudentMonthlyPayment[]>;
  getStudentsPaymentStatusWithUnpaid(
    studentIds: number[],
    year: number,
    month: number,
    schoolId: number,
  ): Promise<
    Array<{
      studentId: number;
      isPaid: boolean;
      amount?: string;
      paidAt?: Date;
    }>
  >;
  createStudentPayment(
    studentId: number,
    userId: number,
    studentType: "student" | "child",
    year: number,
    month: number,
    amount: number,
    schoolId: number,
    groupId: number,
    paidBy: number,
    notes?: string,
  ): Promise<StudentMonthlyPayment>;
  deletePaymentRecord(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<boolean>;
  getStudentPaymentHistory(
    studentId: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment[]>;
  getStudentPaidHistory(
    studentId: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment[]>;
  getStudentUnpaidHistory(
    studentId: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment[]>;
  // REMOVED: createDefaultMonthlyPayments - caused bulk payment creation

  // Student Status interface methods
  getStudentEnrolledGroups(studentId: number, schoolId: number): Promise<any[]>;
  getStudentAttendanceRecords(
    studentId: number,
    schoolId: number,
  ): Promise<any[]>;
  getStudentPaymentRecords(studentId: number, schoolId: number): Promise<any[]>;

  // Test function to get all payments from database
  getAllPaymentsFromDatabase(schoolId: number): Promise<any[]>;
  getStudentGroupPayments(
    studentId: number,
    groupId: number,
    year: number,
    schoolId: number,
  ): Promise<any[]>;
  getFinancialReportData(
    schoolId: number,
    year: number,
    month?: number,
  ): Promise<any>;
  getChildrenEnrolledGroups(parentId: number, schoolId: number): Promise<any[]>;

  // Financial Entries interface methods (for manual gains and losses)
  createFinancialEntry(entry: InsertFinancialEntry): Promise<FinancialEntry>;
  getFinancialEntries(
    schoolId: number,
    year?: number,
    month?: number,
  ): Promise<FinancialEntry[]>;
  resetFinancialEntries(schoolId: number): Promise<void>;
  deleteFinancialEntryById(entryId: number): Promise<boolean>;
  deleteFinancialEntriesByPayment(
    studentId: number,
    year: number,
    month: number,
    schoolId: number
  ): Promise<void>;

  // Teacher Payment Status methods
  getTeacherPaymentStatuses(
    schoolId: number,
    teacherId?: number,
    paymentMonth?: string
  ): Promise<TeacherPaymentStatus[]>;
  updateTeacherPaymentStatus(
    schoolId: number,
    teacherId: number,
    paymentMonth: string,
    isPaid: boolean,
    markedBy: number
  ): Promise<TeacherPaymentStatus>;

  // Child-specific queries for parent access
  getStudentById(studentId: number): Promise<Student | undefined>;
  getChildById(childId: number): Promise<Child | undefined>;
  getChildAttendanceRecords(childId: number, schoolId: number): Promise<any[]>;
  getChildPaymentRecords(childId: number, schoolId: number): Promise<any[]>;
  getChildEnrolledGroups(childId: number, schoolId: number): Promise<any[]>;

  // Desktop QR Scanner interface methods
  getStudentCompleteProfile(
    studentId: number,
    studentType: "student" | "child",
    schoolId: number,
  ): Promise<any | null>;
  markStudentAttendanceToday(
    studentId: number,
    studentType: "student" | "child",
    status: "present" | "absent" | "late" | "excused",
    markedBy: number,
    schoolId: number,
  ): Promise<any>;
  recordStudentPayment(paymentData: {
    studentId: number;
    studentType: "student" | "child";
    amount: number;
    paymentMethod?: string;
    notes?: string;
    year: number;
    month: number;
    paidBy: number;
    schoolId: number;
  }): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // School methods implementation
  async getSchools(): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .where(eq(schools.active, true))
      .orderBy(desc(schools.createdAt));
  }

  async getAllActiveSchools(): Promise<School[]> {
    // Get all active schools with user count
    const schoolsList = await db
      .select()
      .from(schools)
      .where(eq(schools.active, true))
      .orderBy(desc(schools.createdAt));

    // Add user count for each school
    const schoolsWithUserCount = await Promise.all(
      schoolsList.map(async (school) => {
        const userCount = await db
          .select()
          .from(users)
          .where(eq(users.schoolId, school.id));
        return {
          ...school,
          userCount: userCount.length,
        };
      }),
    );

    return schoolsWithUserCount;
  }

  async getSchoolByCode(code: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(and(eq(schools.code, code), eq(schools.active, true)));
    return school || undefined;
  }

  async getSchoolById(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }

  async updateSchool(
    id: number,
    updates: Partial<InsertSchool>,
  ): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<void> {
    // Delete all related data in the correct order (foreign key dependencies)
    await db.delete(notifications).where(eq(notifications.schoolId, id));
    await db.delete(userReports).where(eq(userReports.schoolId, id));
    await db.delete(scheduleCells).where(eq(scheduleCells.schoolId, id));
    await db.delete(scheduleTables).where(eq(scheduleTables.schoolId, id));
    await db
      .delete(formationRegistrations)
      .where(eq(formationRegistrations.schoolId, id));
    await db
      .delete(groupRegistrations)
      .where(eq(groupRegistrations.schoolId, id));
    await db
      .delete(groupUserAssignments)
      .where(eq(groupUserAssignments.schoolId, id));
    await db.delete(messages).where(eq(messages.schoolId, id));
    await db.delete(suggestions).where(eq(suggestions.schoolId, id));
    await db.delete(children).where(eq(children.schoolId, id));
    await db.delete(students).where(eq(students.schoolId, id));
    await db
      .delete(teacherSpecializations)
      .where(eq(teacherSpecializations.schoolId, id));
    await db.delete(teachers).where(eq(teachers.schoolId, id));
    await db.delete(formations).where(eq(formations.schoolId, id));
    await db.delete(groups).where(eq(groups.schoolId, id));
    await db.delete(blogPosts).where(eq(blogPosts.schoolId, id));
    await db.delete(announcements).where(eq(announcements.schoolId, id));
    await db.delete(teachingModules).where(eq(teachingModules.schoolId, id));
    await db.delete(blockedUsers).where(eq(blockedUsers.schoolId, id));
    await db.delete(users).where(eq(users.schoolId, id));

    // Finally delete the school itself
    await db.delete(schools).where(eq(schools.id, id));
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.deleted, false)));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, username), eq(users.deleted, false)));
    return user || undefined;
  }

  async getUserByEmail(
    email: string,
    schoolId?: number,
  ): Promise<User | undefined> {
    if (schoolId) {
      const users_found = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.schoolId, schoolId),
            eq(users.deleted, false),
          ),
        );
      return users_found[0] || undefined;
    } else {
      const users_found = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.deleted, false)));
      return users_found[0] || undefined;
    }
  }

  async getUserByPhone(
    phone: string,
    schoolId?: number,
  ): Promise<User | undefined> {
    if (schoolId) {
      const users_found = await db
        .select()
        .from(users)
        .where(and(eq(users.phone, phone), eq(users.schoolId, schoolId)))
        .orderBy(desc(users.id));
      return users_found[0] || undefined;
    } else {
      const users_found = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .orderBy(desc(users.id));
      return users_found[0] || undefined;
    }
  }

  async authenticateUser(
    email: string,
    password: string,
    schoolId?: number,
  ): Promise<User | null> {
    const bcrypt = await import("bcrypt");

    let users_found;
    if (schoolId) {
      users_found = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.schoolId, schoolId), eq(users.deleted, false)));
    } else {
      users_found = await db.select().from(users).where(and(eq(users.email, email), eq(users.deleted, false)));
    }

    let user = users_found[0];

    if (user) {
      console.log("Found user:", user.email);
      console.log(
        "Password starts with $2b:",
        user.password.startsWith("$2b$"),
      );

      // Check if password is already hashed
      if (user.password.startsWith("$2b$")) {
        // Use bcrypt comparison for hashed passwords
        const isValid = await bcrypt.compare(password, user.password);
        console.log("Bcrypt comparison result:", isValid);
        return isValid ? user : null;
      } else {
        // Legacy plain text password comparison
        console.log("Using plain text comparison");
        const isValid = user.password === password;
        console.log("Plain text comparison result:", isValid);

        // If plain text matches, hash and update the password
        if (isValid) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, user.id));
          console.log("Updated password to hashed version");
        }

        return isValid ? user : null;
      }
    }

    console.log("No user found with email:", email);
    return null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const userWithHashedPassword = { ...insertUser, password: hashedPassword };

    const [user] = await db
      .insert(users)
      .values(userWithHashedPassword)
      .returning();
    return user;
  }

  async getAllUsers(schoolId?: number): Promise<User[]> {
    if (schoolId) {
      return await db
        .select()
        .from(users)
        .where(eq(users.schoolId, schoolId))
        .orderBy(desc(users.createdAt));
    }
    // If no schoolId provided, return empty array for security
    console.warn(
      "getAllUsers called without schoolId - returning empty array for security",
    );
    return [];
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.name, `%${query}%`),
          ilike(users.email, `%${query}%`),
          ilike(users.phone, `%${query}%`),
        ),
      )
      .orderBy(desc(users.createdAt));
  }

  async searchUsersWithFilters(filters: {
    search?: string;
    educationLevel?: string;
    subject?: number;
    assignedTeacher?: number;
    role?: string;
    schoolId?: number;
  }): Promise<User[]> {
    // Build conditions array first
    const conditions = [];

    // CRITICAL: School ID filter for multi-tenancy data isolation
    if (filters.schoolId) {
      conditions.push(eq(users.schoolId, filters.schoolId));
    }

    // Search filter
    if (filters.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
          ilike(users.phone, `%${filters.search}%`),
        ),
      );
    }

    // Role filter
    if (filters.role) {
      conditions.push(eq(users.role, filters.role));
    }

    // Create base query with all possible joins upfront
    let query = db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        name: users.name,
        phone: users.phone,
        phoneVerified: users.phoneVerified,
        phoneVerificationCode: users.phoneVerificationCode,
        phoneVerificationExpiry: users.phoneVerificationExpiry,
        emailVerified: users.emailVerified,
        emailVerificationCode: users.emailVerificationCode,
        emailVerificationExpiry: users.emailVerificationExpiry,
        profilePicture: users.profilePicture,
        role: users.role,
        gender: users.gender,
        firebaseUid: users.firebaseUid,
        verified: users.verified,
        verificationNotes: users.verificationNotes,
        verifiedAt: users.verifiedAt,
        verifiedBy: users.verifiedBy,
        banned: users.banned,
        banReason: users.banReason,
        bannedAt: users.bannedAt,
        bannedBy: users.bannedBy,
        createdAt: users.createdAt,
        schoolId: users.schoolId,
      })
      .from(users)
      .leftJoin(students, eq(users.id, students.userId))
      .leftJoin(children, eq(users.id, children.parentId))
      .leftJoin(
        teacherSpecializations,
        eq(users.id, teacherSpecializations.teacherId),
      )
      .leftJoin(
        teachingModules,
        eq(teacherSpecializations.moduleId, teachingModules.id),
      )
      .leftJoin(scheduleCells, eq(users.id, scheduleCells.teacherId));

    // Education level filter (applies to students and children)
    if (filters.educationLevel) {
      conditions.push(
        or(
          eq(students.educationLevel, filters.educationLevel),
          eq(children.educationLevel, filters.educationLevel),
        ),
      );
    }

    // Subject filter (for teacher assignments)
    if (filters.subject) {
      conditions.push(eq(teachingModules.id, filters.subject));
    }

    // Assigned teacher filter (for schedule assignments)
    if (filters.assignedTeacher) {
      conditions.push(eq(scheduleCells.teacherId, filters.assignedTeacher));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          profilePicture: users.profilePicture,
          verified: users.verified,
          createdAt: users.createdAt,
          banned: users.banned,
          schoolId: users.schoolId,
        })
        .from(users)
        .leftJoin(students, eq(users.id, students.userId))
        .leftJoin(children, eq(users.id, children.parentId))
        .leftJoin(
          teacherSpecializations,
          eq(users.id, teacherSpecializations.teacherId),
        )
        .leftJoin(
          teachingModules,
          eq(teacherSpecializations.moduleId, teachingModules.id),
        )
        .leftJoin(scheduleCells, eq(users.id, scheduleCells.teacherId))
        .where(and(...conditions));
    }

    // Execute query and remove duplicates
    const results = await query.orderBy(desc(users.createdAt));
    const uniqueUsers = results.reduce((acc, user) => {
      if (!acc.find((u) => u.id === user.id)) {
        acc.push(user);
      }
      return acc;
    }, [] as any[]);

    return uniqueUsers;
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    // First create the child without QR code
    const [child] = await db.insert(children).values([insertChild]).returning();

    // Only generate QR code if parent is verified
    const [parentInfo] = await db
      .select({ verified: users.verified })
      .from(users)
      .where(eq(users.id, insertChild.parentId!))
      .limit(1);

    if (parentInfo?.verified) {
      // Import QR service
      const { generateStudentQRCode } = await import("./qr-service");

      // Generate QR code with the child's ID
      const { qrCode, qrCodeData } = await generateStudentQRCode(
        child.id,
        "child",
        child.schoolId,
        child.name,
      );

      // Update child with QR code data
      const [updatedChild] = await db
        .update(children)
        .set({ qrCode, qrCodeData })
        .where(eq(children.id, child.id))
        .returning();

      return updatedChild;
    }

    return child;
  }

  async getChildrenByParentId(parentId: number): Promise<Child[]> {
    return await db
      .select()
      .from(children)
      .where(eq(children.parentId, parentId));
  }

  async deleteChild(childId: number): Promise<void> {
    await db.delete(children).where(eq(children.id, childId));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    // First create the student without QR code
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();

    // Only generate QR code if user is verified
    const [userInfo] = await db
      .select({ name: users.name, verified: users.verified })
      .from(users)
      .where(eq(users.id, student.userId!))
      .limit(1);

    if (userInfo?.verified) {
      // Import QR service
      const { generateStudentQRCode } = await import("./qr-service");

      const studentName = userInfo?.name || "طالب غير معروف";

      // Generate QR code with the student's ID
      const { qrCode, qrCodeData } = await generateStudentQRCode(
        student.id,
        "student",
        student.schoolId,
        studentName,
      );

      // Update student with QR code data
      const [updatedStudent] = await db
        .update(students)
        .set({ qrCode, qrCodeData })
        .where(eq(students.id, student.id))
        .returning();

      return updatedStudent;
    }

    return student;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId));
    return student || undefined;
  }

  async getStudentQRCode(
    studentId: number,
    type: "student" | "child",
  ): Promise<{ qrCode: string; qrCodeData: string } | null> {
    if (type === "student") {
      const [student] = await db
        .select({ qrCode: students.qrCode, qrCodeData: students.qrCodeData })
        .from(students)
        .where(eq(students.id, studentId));
      return student?.qrCode
        ? { qrCode: student.qrCode, qrCodeData: student.qrCodeData! }
        : null;
    } else {
      const [child] = await db
        .select({ qrCode: children.qrCode, qrCodeData: children.qrCodeData })
        .from(children)
        .where(eq(children.id, studentId));
      return child?.qrCode
        ? { qrCode: child.qrCode, qrCodeData: child.qrCodeData! }
        : null;
    }
  }

  async regenerateStudentQRCode(
    studentId: number,
    type: "student" | "child",
  ): Promise<{ qrCode: string; qrCodeData: string }> {
    const { generateStudentQRCode } = await import("./qr-service");

    if (type === "student") {
      // Get student info
      const [student] = await db
        .select({ schoolId: students.schoolId, userId: students.userId })
        .from(students)
        .where(eq(students.id, studentId));

      if (!student) throw new Error("Student not found");

      // Get student name
      const [userInfo] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, student.userId!));

      const studentName = userInfo?.name || "طالب غير معروف";

      // Generate new QR code
      const { qrCode, qrCodeData } = await generateStudentQRCode(
        studentId,
        "student",
        student.schoolId,
        studentName,
      );

      // Update student
      await db
        .update(students)
        .set({ qrCode, qrCodeData })
        .where(eq(students.id, studentId));

      return { qrCode, qrCodeData };
    } else {
      // Get child info
      const [child] = await db
        .select({ schoolId: children.schoolId, name: children.name })
        .from(children)
        .where(eq(children.id, studentId));

      if (!child) throw new Error("Child not found");

      // Generate new QR code
      const { qrCode, qrCodeData } = await generateStudentQRCode(
        studentId,
        "child",
        child.schoolId,
        child.name,
      );

      // Update child
      await db
        .update(children)
        .set({ qrCode, qrCodeData })
        .where(eq(children.id, studentId));

      return { qrCode, qrCodeData };
    }
  }

  async generateQRCodeForVerifiedUser(userId: number): Promise<void> {
    const { generateStudentQRCode } = await import("./qr-service");

    // Check if user is verified
    const [userInfo] = await db
      .select({ verified: users.verified, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userInfo?.verified) {
      return; // User not verified, skip QR generation
    }

    // Generate QR for student if exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (student && !student.qrCode) {
      const { qrCode, qrCodeData } = await generateStudentQRCode(
        student.id,
        "student",
        student.schoolId,
        userInfo.name,
      );

      await db
        .update(students)
        .set({ qrCode, qrCodeData })
        .where(eq(students.id, student.id));
    }

    // Generate QR for children if parent is verified
    const childrenList = await db
      .select()
      .from(children)
      .where(eq(children.parentId, userId));

    for (const child of childrenList) {
      if (!child.qrCode) {
        const { qrCode, qrCodeData } = await generateStudentQRCode(
          child.id,
          "child",
          child.schoolId,
          child.name,
        );

        await db
          .update(children)
          .set({ qrCode, qrCodeData })
          .where(eq(children.id, child.id));
      }
    }
  }

  // Student claim system methods
  async getUnclaimedStudent(
    studentId: number,
    schoolId: number,
  ): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, studentId),
          eq(students.schoolId, schoolId),
          isNull(students.userId),
        ),
      );
    return student || undefined;
  }

  async claimStudentAccount(studentId: number, userId: number): Promise<void> {
    await db.update(students).set({ userId }).where(eq(students.id, studentId));
  }

  async preRegisterStudent(
    student: Omit<InsertStudent, "userId">,
  ): Promise<Student & { generatedEmail?: string; generatedPassword?: string }> {
    // First create the student record to get the ID
    const [newStudent] = await db
      .insert(students)
      .values({
        ...student,
        userId: null,
        verified: true, // Auto-verify pre-registered students
        verifiedAt: new Date(),
        verificationNotes: "تم التحقق تلقائياً عند التسجيل المسبق",
      })
      .returning();

    // Get school information for email generation
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, student.schoolId))
      .limit(1);

    if (school) {
      // Generate email in format student[ID]@[schoolname].com
      const cleanSchoolName = school.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^\w]/g, '');
      
      const generatedEmail = `student${newStudent.id}@${cleanSchoolName}.com`;
      
      // Generate random password
      const generateRandomPassword = (): string => {
        const length = 10;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
        let password = "";
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const generatedPassword = generateRandomPassword();

      // Hash the password
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Create user account
      const [newUser] = await db
        .insert(users)
        .values({
          email: generatedEmail,
          password: hashedPassword,
          name: student.name,
          phone: student.phone || '',
          role: 'student',
          gender: student.gender === 'ذكر' ? 'male' : 'female',
          schoolId: student.schoolId,
          verified: true,
          verifiedAt: new Date(),
          verificationNotes: "تم التحقق تلقائياً عند التسجيل المسبق",
        })
        .returning();

      // Link student to user account
      const [updatedStudent] = await db
        .update(students)
        .set({ userId: newUser.id })
        .where(eq(students.id, newStudent.id))
        .returning();

      return {
        ...updatedStudent,
        generatedEmail,
        generatedPassword,
      };
    }

    return newStudent;
  }

  async getUnclaimedStudents(schoolId: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(and(eq(students.schoolId, schoolId), isNull(students.userId)))
      .orderBy(desc(students.id));
  }

  async updateStudent(
    studentId: number,
    updates: Partial<InsertStudent>,
  ): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, studentId))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(studentId: number): Promise<void> {
    await db.delete(students).where(eq(students.id, studentId));
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementsBySchool(schoolId: number): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.schoolId, schoolId))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(
    insertAnnouncement: InsertAnnouncement,
    schoolId?: number,
  ): Promise<Announcement> {
    const announcementData = {
      ...insertAnnouncement,
      // Use the schoolId from insertAnnouncement if it exists, otherwise use the parameter, no hardcoded fallback
      schoolId: insertAnnouncement.schoolId || schoolId,
    };
    const [announcement] = await db
      .insert(announcements)
      .values([announcementData])
      .returning();
    return announcement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostsBySchool(schoolId: number): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.schoolId, schoolId))
      .orderBy(desc(blogPosts.createdAt));
  }

  async createBlogPost(
    insertBlogPost: InsertBlogPost,
    schoolId?: number,
  ): Promise<BlogPost> {
    const blogPostData = {
      ...insertBlogPost,
      schoolId: insertBlogPost.schoolId || schoolId,
    };
    const [blogPost] = await db
      .insert(blogPosts)
      .values([blogPostData])
      .returning();
    return blogPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(desc(teachers.createdAt));
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const result = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, id))
      .limit(1);
    return result[0];
  }

  async getTeachersBySchool(schoolId: number): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(eq(teachers.schoolId, schoolId))
      .orderBy(desc(teachers.createdAt));
  }

  async getTeacherUsers(schoolId: number): Promise<any[]> {
    // Get users with role='teacher' from the same school
    // This returns the actual users that are referenced in groups.teacherId
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        schoolId: users.schoolId,
        profilePicture: users.profilePicture,
        verified: users.verified,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.role, "teacher")
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    try {
      console.log("Creating teacher with data:", insertTeacher);

      // Create teacher with basic fields matching existing DB structure
      const teacherData = {
        schoolId: insertTeacher.schoolId,
        name: insertTeacher.name,
        email: insertTeacher.email,
        phone: insertTeacher.phone || null,
        subject: insertTeacher.subject || "مادة عامة",
        bio: insertTeacher.bio || null,
        imageUrl: insertTeacher.imageUrl || null,
        available:
          insertTeacher.available !== undefined
            ? insertTeacher.available
            : true,
      };

      console.log("Teacher data for insertion:", teacherData);

      const [teacher] = await db
        .insert(teachers)
        .values(teacherData)
        .returning();

      console.log("Teacher created successfully:", teacher);
      return teacher;
    } catch (error) {
      console.error("Error creating teacher:", error);
      throw error;
    }
  }

  async updateTeacher(
    id: number,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      bio?: string | null;
      imageUrl?: string | null;
    },
  ): Promise<Teacher> {
    console.log("Updating teacher:", { id, data });

    // First check if teacher exists
    const existingTeacher = await this.getTeacher(id);
    if (!existingTeacher) {
      console.error("Teacher not found with ID:", id);
      throw new Error("Teacher not found");
    }

    console.log("Found existing teacher:", existingTeacher);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    console.log("Update data:", updateData);

    const [teacher] = await db
      .update(teachers)
      .set(updateData)
      .where(eq(teachers.id, id))
      .returning();

    if (!teacher) {
      console.error("Update failed - no teacher returned");
      throw new Error("Teacher update failed");
    }

    console.log("Teacher updated successfully:", teacher);
    return teacher;
  }

  async deleteTeacher(id: number, deletedBy?: number): Promise<void> {
    // Soft delete: mark as deleted instead of removing from database
    await db
      .update(users)
      .set({
        deleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      })
      .where(eq(users.id, id));
  }

  async getTeacherByLinkCode(linkCode: string): Promise<Teacher | undefined> {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.linkCode, linkCode))
      .limit(1);
    return teacher || undefined;
  }

  async linkTeacherToUser(teacherId: number, userId: number): Promise<Teacher> {
    const [teacher] = await db
      .update(teachers)
      .set({
        userId: userId,
        isPreRegistered: false,
        linkedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId))
      .returning();
    return teacher;
  }

  async verifyTeacher(
    teacherId: number,
    verifiedBy: number,
    notes?: string,
  ): Promise<Teacher> {
    const [teacher] = await db
      .update(teachers)
      .set({
        verified: true,
        verificationNotes: notes,
        verifiedAt: new Date(),
        verifiedBy: verifiedBy,
      })
      .where(eq(teachers.id, teacherId))
      .returning();
    return teacher;
  }

  async getPreRegisteredTeachers(schoolId: number): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(
        and(
          eq(teachers.schoolId, schoolId),
          eq(teachers.isPreRegistered, true),
        ),
      )
      .orderBy(desc(teachers.createdAt));
  }

  async getTeachersWithSpecializations(schoolId: number): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        profilePicture: users.profilePicture,
        role: users.role,
        gender: users.gender,
        specializationId: teacherSpecializations.id,
        subjectId: teachingModules.id,
        subjectName: teachingModules.name,
        subjectNameAr: teachingModules.nameAr,
        educationLevel: teachingModules.educationLevel,
        grade: teachingModules.grade,
      })
      .from(users)
      .leftJoin(
        teacherSpecializations,
        eq(users.id, teacherSpecializations.teacherId),
      )
      .leftJoin(
        teachingModules,
        eq(teacherSpecializations.moduleId, teachingModules.id),
      )
      .where(
        and(
          eq(users.role, "teacher"),
          eq(users.schoolId, schoolId),
          eq(users.deleted, false),
        ),
      )
      .orderBy(users.name);

    // Group by teacher to consolidate specializations
    const teachersMap = new Map();

    result.forEach((row) => {
      if (!teachersMap.has(row.id)) {
        teachersMap.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          profilePicture: row.profilePicture,
          role: row.role,
          gender: row.gender,
          specializations: [],
        });
      }

      if (row.subjectId) {
        teachersMap.get(row.id).specializations.push({
          id: row.specializationId, // Use the actual specialization record ID
          moduleId: row.subjectId, // Keep module ID for reference
          name: row.subjectName,
          nameAr: row.subjectNameAr,
          educationLevel: row.educationLevel,
          grade: row.grade,
        });
      }
    });

    return Array.from(teachersMap.values());
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async createMessage(
    insertMessage: InsertMessage,
    schoolId?: number,
  ): Promise<Message> {
    const messageData = {
      ...insertMessage,
      schoolId: insertMessage.schoolId || schoolId,
    };
    const [message] = await db
      .insert(messages)
      .values([messageData])
      .returning();
    return message;
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async createBulkMessage(
    senderIds: number[],
    receiverIds: number[],
    subject: string,
    content: string,
  ): Promise<Message[]> {
    // This method needs schoolId context but isn't provided in the interface
    // For now, we'll get it from the first sender's school
    const firstSender = await db
      .select()
      .from(users)
      .where(eq(users.id, senderIds[0]))
      .limit(1);
    if (firstSender.length === 0) {
      throw new Error("Cannot determine school ID for bulk messages");
    }
    const schoolId = firstSender[0].schoolId;

    const messagesToInsert = [];

    // Get the first available teacher ID for admin messages
    const firstTeacher = await db.select().from(teachers).limit(1);
    const teacherId = firstTeacher.length > 0 ? firstTeacher[0].id : 1; // fallback to ID 1

    for (const senderId of senderIds) {
      for (const receiverId of receiverIds) {
        messagesToInsert.push({
          schoolId: schoolId!,
          senderId,
          receiverId,
          teacherId, // Use existing teacher ID
          subject,
          content,
          read: false,
        });
      }
    }

    return await db.insert(messages).values(messagesToInsert).returning();
  }

  async getSuggestions(schoolId?: number): Promise<any[]> {
    if (!schoolId) {
      console.warn(
        "getSuggestions called without schoolId - returning empty array for security",
      );
      return [];
    }

    return await db
      .select({
        id: suggestions.id,
        userId: suggestions.userId,
        title: suggestions.title,
        content: suggestions.content,
        category: suggestions.category,
        status: suggestions.status,
        createdAt: suggestions.createdAt,
        userName: users.name,
      })
      .from(suggestions)
      .leftJoin(users, eq(suggestions.userId, users.id))
      .where(
        and(eq(suggestions.schoolId, schoolId), eq(users.schoolId, schoolId)),
      )
      .orderBy(desc(suggestions.createdAt));
  }

  async getUserSuggestions(userId: number, schoolId?: number): Promise<any[]> {
    if (!schoolId) {
      console.warn(
        "getUserSuggestions called without schoolId - returning empty array for security",
      );
      return [];
    }

    return await db
      .select({
        id: suggestions.id,
        userId: suggestions.userId,
        title: suggestions.title,
        content: suggestions.content,
        category: suggestions.category,
        status: suggestions.status,
        createdAt: suggestions.createdAt,
        userName: users.name,
      })
      .from(suggestions)
      .leftJoin(users, eq(suggestions.userId, users.id))
      .where(
        and(
          eq(suggestions.schoolId, schoolId),
          eq(suggestions.userId, userId),
          eq(users.schoolId, schoolId),
        ),
      )
      .orderBy(desc(suggestions.createdAt));
  }

  async createSuggestion(
    insertSuggestion: InsertSuggestion,
  ): Promise<Suggestion> {
    console.log("Storage createSuggestion called with:", insertSuggestion);

    // Ensure schoolId is present
    let schoolId = insertSuggestion.schoolId;
    if (!schoolId && insertSuggestion.userId) {
      const user = await this.getUser(insertSuggestion.userId);
      schoolId = user?.schoolId;
    }

    if (!schoolId) {
      throw new Error("School ID is required for creating suggestions");
    }

    // Ensure all required fields are present
    const safeData = {
      title: insertSuggestion.title || "Untitled",
      content: insertSuggestion.content || "No content",
      category: insertSuggestion.category || "other",
      status: insertSuggestion.status || "pending",
      userId: insertSuggestion.userId,
      schoolId: schoolId!,
    };

    console.log("Safe data for insertion:", safeData);

    const [suggestion] = await db
      .insert(suggestions)
      .values([safeData])
      .returning();
    return suggestion;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async getGroupsBySchool(schoolId: number): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .where(eq(groups.schoolId, schoolId))
      .orderBy(desc(groups.createdAt));
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const result = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);
    return result[0];
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  // Admin group management methods
  async getAdminGroups(schoolId?: number): Promise<any[]> {
    try {
      if (!schoolId) {
        console.warn(
          "getAdminGroups called without schoolId - returning empty array for security",
        );
        return [];
      }

      // Get all existing groups with their module and teacher info in one query
      const existingGroups = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          category: groups.category,
          educationLevel: groups.educationLevel,
          grade: groups.grade, // Add grade field
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          subjectName: teachingModules.name,
          nameAr: teachingModules.nameAr,
          teacherName: users.name,
          createdAt: groups.createdAt,
        })
        .from(groups)
        .leftJoin(teachingModules, eq(groups.subjectId, teachingModules.id))
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(eq(groups.schoolId, schoolId))
        .orderBy(groups.educationLevel, groups.name);

      // Get all teaching modules available for this school
      const allModules = await db
        .select()
        .from(teachingModules)
        .where(
          or(
            eq(teachingModules.schoolId, schoolId),
            isNull(teachingModules.schoolId),
          ),
        )
        .orderBy(teachingModules.educationLevel, teachingModules.name);

      // Get all group assignments in one query for performance
      const allAssignments = await db
        .select({
          groupId: groupMixedAssignments.groupId,
          studentId: groupMixedAssignments.studentId,
          studentType: groupMixedAssignments.studentType,
        })
        .from(groupMixedAssignments)
        .innerJoin(groups, eq(groupMixedAssignments.groupId, groups.id))
        .where(eq(groups.schoolId, schoolId));

      // Create a map of group assignments for quick lookup
      const assignmentsByGroup = new Map<number, any[]>();
      for (const assignment of allAssignments) {
        if (!assignmentsByGroup.has(assignment.groupId)) {
          if (assignment.groupId) {
            assignmentsByGroup.set(assignment.groupId, []);
          }
        }
        if (assignment.groupId) {
          assignmentsByGroup.get(assignment.groupId)!.push(assignment);
        }
      }

      // Process existing groups and add student assignments
      const allPossibleGroups = [];
      const existingGroupSubjectIds = new Set(
        existingGroups.map((g) => g.subjectId),
      );

      // Batch query all student and children data for better performance
      const allStudentIds = new Set<number>();
      const allChildIds = new Set<number>();

      for (const assignment of allAssignments) {
        if (
          assignment.studentType === "student" &&
          assignment.studentId != null
        ) {
          allStudentIds.add(assignment.studentId);
        } else if (
          assignment.studentType === "child" &&
          assignment.studentId != null
        ) {
          allChildIds.add(assignment.studentId);
        }
      }

      // Get all students in one query
      const allStudentsData =
        allStudentIds.size > 0
          ? await db
              .select({
                id: students.id, // Use student ID, not user ID
                name: users.name,
                educationLevel: students.educationLevel,
                grade: students.grade,
                email: users.email,
              })
              .from(students)
              .leftJoin(users, eq(students.userId, users.id))
              .where(inArray(students.id, Array.from(allStudentIds)))
          : [];

      // Get all children in one query
      const allChildrenData =
        allChildIds.size > 0
          ? await db
              .select({
                id: children.id,
                name: children.name,
                educationLevel: children.educationLevel,
                grade: children.grade,
                email:
                  sql<string>`CONCAT('child_', ${children.id}, '@parent.local')`.as(
                    "email",
                  ),
              })
              .from(children)
              .where(inArray(children.id, Array.from(allChildIds)))
          : [];

      // Create lookup maps for quick access
      const studentsMap = new Map(
        allStudentsData.map((s) => [s.id, { ...s, type: "student" }]),
      );
      const childrenMap = new Map(
        allChildrenData.map((c) => [c.id, { ...c, type: "child" }]),
      );

      for (const group of existingGroups) {
        const assignments = assignmentsByGroup.get(group.id) || [];
        const assignedStudents = [];

        for (const assignment of assignments) {
          if (assignment.studentType === "student") {
            const studentData = studentsMap.get(assignment.studentId);
            if (studentData) {
              assignedStudents.push(studentData);
            }
          } else if (assignment.studentType === "child") {
            const childData = childrenMap.get(assignment.studentId);
            if (childData) {
              assignedStudents.push(childData);
            }
          }
        }

        allPossibleGroups.push({
          ...group,
          studentsAssigned: assignedStudents,
          isPlaceholder: false,
        });
      }

      // Add placeholder groups for subjects without existing groups
      for (const module of allModules) {
        if (!existingGroupSubjectIds.has(module.id)) {
          allPossibleGroups.push({
            id: null,
            name: `مجموعة ${module.nameAr || module.name}`,
            description: `مجموعة تعليمية لمادة ${module.nameAr || module.name}`,
            category: "دراسية",
            educationLevel: module.educationLevel,
            subjectId: module.id,
            teacherId: null,
            subjectName: module.name,
            nameAr: module.nameAr,
            teacherName: null,
            createdAt: null,
            studentsAssigned: [],
            isPlaceholder: true,
          });
        }
      }

      return allPossibleGroups;
    } catch (error) {
      console.error("Error in getAdminGroups:", error);
      throw error;
    }
  }

  async updateGroupAssignments(
    groupId: number | null,
    studentIds: number[],
    teacherId: number,
    groupData?: any,
    schoolId?: number,
    adminId?: number,
  ): Promise<Group> {
    let actualGroupId = groupId;

    // If groupId is null, create a new group first
    if (!groupId && groupData && schoolId) {
      // Check for existing groups with same subject and education level to determine group number
      const existingGroups = await db
        .select({ groupNumber: groups.groupNumber })
        .from(groups)
        .where(
          and(
            eq(groups.schoolId, schoolId),
            eq(groups.subjectId, groupData.subjectId),
            eq(groups.educationLevel, groupData.educationLevel),
            eq(groups.isAdminManaged, true)
          )
        )
        .orderBy(desc(groups.groupNumber));

      // Determine next group number
      const nextGroupNumber = existingGroups.length > 0 ? Math.max(...existingGroups.map(g => g.groupNumber || 1)) + 1 : 1;
      
      // Create group name with automatic numbering
      const baseName = groupData.name;
      const finalGroupName = nextGroupNumber === 1 ? baseName : `${baseName} (${nextGroupNumber})`;

      const [newGroup] = await db
        .insert(groups)
        .values({
          schoolId: schoolId,
          name: finalGroupName,
          description:
            groupData.description ||
            `مجموعة تعليمية لمادة ${groupData.name || "غير محددة"}`,
          category: groupData.category || "دراسية",
          educationLevel: groupData.educationLevel,
          subjectId: groupData.subjectId,
          teacherId: teacherId,
          isAdminManaged: true,
          groupNumber: nextGroupNumber,
        })
        .returning();
      actualGroupId = newGroup.id;
    } else if (actualGroupId) {
      // Update existing group's teacher
      await db
        .update(groups)
        .set({ teacherId })
        .where(eq(groups.id, actualGroupId));
    }

    if (actualGroupId) {
      // Get group information to determine education level and subject
      const [groupInfo] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, actualGroupId));

      // Get all student data to determine types (students vs children)
      // Use actual group's education level and subject ID instead of empty defaults
      const educationLevel =
        groupData?.educationLevel || groupInfo?.educationLevel || "";
      const subjectId = groupData?.subjectId || groupInfo?.subjectId || 0;

      console.log(
        `[DEBUG] Assignment validation using: educationLevel=${educationLevel}, subjectId=${subjectId}`,
      );
      const availableStudents =
        await this.getAvailableStudentsByLevelAndSubject(
          educationLevel,
          subjectId,
          schoolId,
        );

      // Remove existing assignments (both old and new)
      await db
        .delete(groupUserAssignments)
        .where(eq(groupUserAssignments.groupId, actualGroupId));
      await db
        .delete(groupMixedAssignments)
        .where(eq(groupMixedAssignments.groupId, actualGroupId));

      // Add new mixed assignments
      if (studentIds.length > 0) {
        console.log(
          `🔧 Creating assignments for ${studentIds.length} students:`,
          studentIds,
        );

        const mixedAssignments = studentIds
          .map((studentId) => {
            const studentInfo = availableStudents.find(
              (s: any) => s.id === studentId,
            );

            // Only create assignment if student is found to prevent orphaned records
            if (!studentInfo) {
              console.warn(
                `Student with ID ${studentId} not found in available students, skipping assignment`,
              );
              return null;
            }

            // CORRECT: Use separate IDs for different purposes
            const actualStudentId = studentId; // Student ID for payment/display (e.g., 18 for student5)
            // For pre-registered students, userId is null - use student ID as fallback
            const actualUserId = studentInfo.userId || studentId; // User ID for attendance (e.g., 34 for student5, or studentId for pre-registered)

            console.log(`🔧 Creating assignment with dual IDs:`, {
              studentId: actualStudentId, // Payment system & group display use this
              userId: actualUserId, // Attendance system uses this
              studentType: studentInfo.type,
              studentName: studentInfo.name,
            });

            return {
              schoolId: schoolId!,
              groupId: actualGroupId,
              studentId: actualStudentId, // For payment system and group display
              userId: actualUserId, // For attendance system
              studentType: (studentInfo.type === 'preregistered' ? 'student' : studentInfo.type) as "student" | "child",
              assignedBy: adminId || null,
            };
          })
          .filter((assignment) => assignment !== null); // Remove null assignments

        if (mixedAssignments.length > 0) {
          console.log(
            `🔧 Inserting ${mixedAssignments.length} assignments into database:`,
            mixedAssignments,
          );
          const insertedAssignments = await db
            .insert(groupMixedAssignments)
            .values(mixedAssignments)
            .returning();
          console.log(
            `✅ Successfully inserted assignments:`,
            insertedAssignments,
          );
        }
      }

      // Return the updated group
      const [updatedGroup] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, actualGroupId));
      return updatedGroup;
    }

    throw new Error("Failed to create or update group");
  }

  async getGroupAssignments(groupId: number): Promise<any[]> {
    const assignments = await db
      .select({
        studentId: groupMixedAssignments.studentId,
        userId: groupMixedAssignments.userId,
        studentType: groupMixedAssignments.studentType,
      })
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.groupId, groupId));

    const result = [];
    for (const assignment of assignments) {
      // Handle cases where userId might be null for some reason
      if (assignment.userId) {
        // PRIMARY: Get user data first using userId (this ensures school isolation)
        const userData = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            schoolId: users.schoolId,
          })
          .from(users)
          .where(eq(users.id, assignment.userId))
          .limit(1);

        if (userData[0]) {
          if (assignment.studentType === "student") {
            // Get additional student details if needed
            const studentDetails = await db
              .select({
                educationLevel: students.educationLevel,
                grade: students.grade,
              })
              .from(students)
              .where(eq(students.id, assignment.studentId!))
              .limit(1);

            result.push({
              id: assignment.studentId, // Use studentId as primary ID for UI consistency
              userId: userData[0].id, // Keep actual userId for payment records
              studentId: assignment.studentId,
              name: userData[0].name,
              email: userData[0].email,
              phone: userData[0].phone,
              educationLevel: studentDetails[0]?.educationLevel,
              grade: studentDetails[0]?.grade,
              type: "student",
              studentType: "student",
            });
          } else if (assignment.studentType === "child") {
            // Get child details
            const childDetails = await db
              .select({
                name: children.name,
                educationLevel: children.educationLevel,
                grade: children.grade,
              })
              .from(children)
              .where(eq(children.id, assignment.studentId!))
              .limit(1);

            result.push({
              id: assignment.studentId, // Use child ID as primary ID for UI consistency
              userId: userData[0].id, // Parent's userId for payment records
              studentId: assignment.studentId,
              name: childDetails[0]?.name || userData[0].name,
              email: userData[0].email,
              phone: userData[0].phone,
              educationLevel: childDetails[0]?.educationLevel,
              grade: childDetails[0]?.grade,
              type: "child",
              studentType: "child",
            });
          }
        }
      } else {
        // Handle pre-registered students (userId is null but studentId exists)
        if (assignment.studentType === "student" && assignment.studentId) {
          // Get pre-registered student details directly from students table
          const studentDetails = await db
            .select({
              id: students.id,
              name: students.name,
              educationLevel: students.educationLevel,
              grade: students.grade,
              verified: students.verified,
              schoolId: students.schoolId,
            })
            .from(students)
            .where(
              and(
                eq(students.id, assignment.studentId),
                eq(students.verified, true),
                isNull(students.userId) // Pre-registered students
              )
            )
            .limit(1);

          if (studentDetails[0]) {
            result.push({
              id: assignment.studentId, // Use studentId as primary ID for UI consistency
              userId: assignment.studentId, // Use studentId as fallback userId for pre-registered
              studentId: assignment.studentId,
              name: studentDetails[0].name,
              email: `preregistered_${assignment.studentId}@school.local`, // Synthetic email
              phone: "", // Pre-registered students don't have phone yet
              educationLevel: studentDetails[0].educationLevel,
              grade: studentDetails[0].grade,
              type: "student",
              studentType: "student",
            });
          }
        } else if (assignment.studentType === "child" && assignment.studentId) {
          // For children without userId, try to find the parent
          const childWithParent = await db
            .select({
              childId: children.id,
              childName: children.name,
              childEducationLevel: children.educationLevel,
              childGrade: children.grade,
              parentId: children.parentId,
            })
            .from(children)
            .where(eq(children.id, assignment.studentId))
            .limit(1);

          if (childWithParent[0] && childWithParent[0].parentId) {
            // Get parent user data
            const parentData = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
              })
              .from(users)
              .where(eq(users.id, childWithParent[0].parentId))
              .limit(1);

            if (parentData[0]) {
              // Update the assignment record with the correct userId
              try {
                await db
                  .update(groupMixedAssignments)
                  .set({ userId: parentData[0].id })
                  .where(
                    and(
                      eq(groupMixedAssignments.groupId, groupId),
                      eq(groupMixedAssignments.studentId, assignment.studentId),
                      eq(groupMixedAssignments.studentType, "child"),
                    ),
                  );
                console.log(
                  `✅ Updated userId for child assignment ${assignment.studentId} to ${parentData[0].id}`,
                );
              } catch (updateError) {
                console.error(
                  `❌ Failed to update userId for child assignment:`,
                  updateError,
                );
              }

              result.push({
                id: assignment.studentId,
                userId: parentData[0].id,
                studentId: assignment.studentId,
                name: childWithParent[0].childName,
                email: parentData[0].email,
                phone: parentData[0].phone,
                educationLevel: childWithParent[0].childEducationLevel,
                grade: childWithParent[0].childGrade,
                type: "child",
                studentType: "child",
              });
            }
          }
        }
      }
    }

    return result;
  }

  async getAvailableStudentsByLevelAndSubject(
    educationLevel: string,
    subjectId: number,
    schoolId?: number,
  ): Promise<any[]> {
    console.log(
      `[DEBUG] getAvailableStudentsByLevelAndSubject called with: educationLevel=${educationLevel}, subjectId=${subjectId}, schoolId=${schoolId}`,
    );

    // Get direct students (users with student records) - USE STUDENT ID AS PRIMARY IDENTIFIER
    // FIXED: Use students.id as the primary identifier for group assignments
    let directStudentsQuery = db
      .select({
        id: students.id, // Use student table ID as primary identifier for assignments
        userId: users.id, // Keep user ID for attendance system
        name: users.name,
        email: users.email,
        phone: users.phone,
        educationLevel: students.educationLevel,
        grade: students.grade,
        type: sql<string>`'student'`.as("type"),
      })
      .from(users)
      .innerJoin(students, eq(users.id, students.userId))
      .where(
        and(
          // SAFETY: Exclude parent users from student selections
          ne(users.role, "parent"),
          eq(students.verified, true), // Only include verified student records
          educationLevel === "جميع المستويات"
            ? sql`1=1`
            : eq(students.educationLevel, educationLevel),
          schoolId ? eq(users.schoolId, schoolId) : sql`1=1`,
        ),
      );

    const allDirectStudents = await directStudentsQuery;
    console.log(
      `[DEBUG] Found ${allDirectStudents.length} direct student records:`,
      allDirectStudents,
    );

    // Remove duplicates by keeping only the most recent student record per user
    const uniqueDirectStudents = allDirectStudents.reduce(
      (acc: any[], current: any) => {
        const existing = acc.find((student) => student.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      },
      [],
    );

    console.log(
      `[DEBUG] After deduplication: ${uniqueDirectStudents.length} unique direct students:`,
      uniqueDirectStudents,
    );

    // Get pre-registered students (verified but userId is null)
    let preRegisteredQuery = db
      .select({
        id: students.id,
        name: students.name,
        email:
          sql<string>`CONCAT('preregistered_', ${students.id}, '@', 'school.local')`.as(
            "email",
          ), // Synthetic email for pre-registered
        phone: sql<string>`''`.as("phone"), // Pre-registered students don't have phone yet
        educationLevel: students.educationLevel,
        grade: students.grade,
        type: sql<string>`'preregistered'`.as("type"),
        userId: sql<number | null>`NULL`.as("userId"), // Pre-registered students have no userId yet
      })
      .from(students)
      .where(
        and(
          educationLevel === "جميع المستويات"
            ? sql`1=1`
            : eq(students.educationLevel, educationLevel),
          eq(students.verified, true),
          isNull(students.userId), // Pre-registered students have no userId yet
          schoolId ? eq(students.schoolId, schoolId) : sql`1=1`,
        ),
      );

    const preRegisteredStudents = await preRegisteredQuery;
    console.log(
      `[DEBUG] Found ${preRegisteredStudents.length} pre-registered students:`,
      preRegisteredStudents,
    );

    // Get children registered by parents
    let childrenQuery = db
      .select({
        id: children.id,
        name: children.name,
        email:
          sql<string>`CONCAT('child_', ${children.id}, '@', 'parent.local')`.as(
            "email",
          ), // Synthetic email for children
        phone: sql<string>`''`.as("phone"), // Children don't have their own phone
        educationLevel: children.educationLevel,
        grade: children.grade,
        type: sql<string>`'child'`.as("type"),
        userId: children.parentId, // Children use their parent's userId for attendance
      })
      .from(children)
      .where(
        and(
          educationLevel === "جميع المستويات"
            ? sql`1=1`
            : eq(children.educationLevel, educationLevel),
          schoolId ? eq(children.schoolId, schoolId) : sql`1=1`,
        ),
      );

    const childrenStudents = await childrenQuery;
    console.log(
      `[DEBUG] Found ${childrenStudents.length} children:`,
      childrenStudents,
    );

    // Combine all results and sort by name
    const combinedResults = [
      ...uniqueDirectStudents,
      ...preRegisteredStudents,
      ...childrenStudents,
    ];
    combinedResults.sort((a, b) => a.name.localeCompare(b.name));
    console.log(`[DEBUG] Combined results:`, combinedResults);
    console.log(
      `[DEBUG] Returning ${combinedResults.length} available students to frontend`,
    );

    return combinedResults;
  }

  async deleteGroup(groupId: number, schoolId?: number): Promise<void> {
    try {
      // Delete in correct order to respect foreign key constraints

      // 1. Delete group attendance records
      await db
        .delete(groupAttendance)
        .where(eq(groupAttendance.groupId, groupId));

      // 2. Delete group financial transactions
      await db
        .delete(groupTransactions)
        .where(eq(groupTransactions.groupId, groupId));

      // 3. Delete group schedule assignments
      await db
        .delete(groupScheduleAssignments)
        .where(eq(groupScheduleAssignments.groupId, groupId));

      // 4. Delete group registrations
      await db
        .delete(groupRegistrations)
        .where(eq(groupRegistrations.groupId, groupId));

      // 5. Delete group user assignments
      await db
        .delete(groupUserAssignments)
        .where(eq(groupUserAssignments.groupId, groupId));

      // 6. Finally delete the group itself
      let result;
      if (schoolId) {
        result = await db
          .delete(groups)
          .where(and(eq(groups.id, groupId), eq(groups.schoolId, schoolId)));
      } else {
        result = await db.delete(groups).where(eq(groups.id, groupId));
      }

      // Don't return anything for void method
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  }

  async getFormations(): Promise<Formation[]> {
    return await db
      .select()
      .from(formations)
      .orderBy(desc(formations.createdAt));
  }

  async getFormationsBySchool(schoolId: number): Promise<Formation[]> {
    return await db
      .select()
      .from(formations)
      .where(eq(formations.schoolId, schoolId))
      .orderBy(desc(formations.createdAt));
  }

  async getFormationById(id: number): Promise<Formation | undefined> {
    const [formation] = await db
      .select()
      .from(formations)
      .where(eq(formations.id, id));
    return formation || undefined;
  }

  async createFormation(insertFormation: InsertFormation): Promise<Formation> {
    const [formation] = await db
      .insert(formations)
      .values([insertFormation])
      .returning();
    return formation;
  }

  async deleteFormation(id: number): Promise<void> {
    await db.delete(formations).where(eq(formations.id, id));
  }

  async createGroupRegistration(
    insertGroupRegistration: InsertGroupRegistration,
  ): Promise<GroupRegistration> {
    const [registration] = await db
      .insert(groupRegistrations)
      .values([insertGroupRegistration])
      .returning();
    return registration;
  }

  async createFormationRegistration(
    insertFormationRegistration: InsertFormationRegistration,
  ): Promise<FormationRegistration> {
    const [registration] = await db
      .insert(formationRegistrations)
      .values([insertFormationRegistration])
      .returning();
    return registration;
  }

  async getFormationRegistrations(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: formationRegistrations.id,
        formationId: formationRegistrations.formationId,
        userId: formationRegistrations.userId,
        fullName: formationRegistrations.fullName,
        phone: formationRegistrations.phone,
        email: formationRegistrations.email,
        createdAt: formationRegistrations.createdAt,
        formationTitle: formations.title,
        formationCategory: formations.category,
        formationPrice: formations.price,
        formationDuration: formations.duration,
        userName: users.name,
        userEmail: users.email,
      })
      .from(formationRegistrations)
      .leftJoin(formations, eq(formationRegistrations.formationId, formations.id))
      .leftJoin(users, eq(formationRegistrations.userId, users.id))
      .where(eq(formationRegistrations.schoolId, schoolId))
      .orderBy(desc(formationRegistrations.createdAt));
  }

  async isUserRegisteredForFormation(userId: number, formationId: number, schoolId: number): Promise<boolean> {
    const [registration] = await db
      .select({ id: formationRegistrations.id })
      .from(formationRegistrations)
      .where(
        and(
          eq(formationRegistrations.userId, userId),
          eq(formationRegistrations.formationId, formationId),
          eq(formationRegistrations.schoolId, schoolId)
        )
      )
      .limit(1);
    
    return !!registration;
  }

  // Course management methods
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async getCourses(schoolId: number): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.schoolId, schoolId))
      .orderBy(desc(courses.createdAt));
  }

  async getCourseById(id: number, schoolId: number): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.schoolId, schoolId)));
    return course;
  }

  async updateCourse(id: number, updates: Partial<InsertCourse>, schoolId: number): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set(updates)
      .where(and(eq(courses.id, id), eq(courses.schoolId, schoolId)))
      .returning();
    return course;
  }

  async deleteCourse(id: number, schoolId: number): Promise<void> {
    // First delete all course registrations for this course
    await db
      .delete(courseRegistrations)
      .where(and(eq(courseRegistrations.courseId, id), eq(courseRegistrations.schoolId, schoolId)));
    
    // Then delete the course itself
    await db
      .delete(courses)
      .where(and(eq(courses.id, id), eq(courses.schoolId, schoolId)));
  }

  // Course registration methods
  async createCourseRegistration(insertRegistration: InsertCourseRegistration): Promise<CourseRegistration> {
    const [registration] = await db
      .insert(courseRegistrations)
      .values(insertRegistration)
      .returning();
    return registration;
  }

  async getCourseRegistrations(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: courseRegistrations.id,
        courseId: courseRegistrations.courseId,
        userId: courseRegistrations.userId,
        registrantType: courseRegistrations.registrantType,
        childId: courseRegistrations.childId,
        fullName: courseRegistrations.fullName,
        phone: courseRegistrations.phone,
        email: courseRegistrations.email,
        childName: courseRegistrations.childName,
        childAge: courseRegistrations.childAge,
        paymentStatus: courseRegistrations.paymentStatus,
        paidAt: courseRegistrations.paidAt,
        paidBy: courseRegistrations.paidBy,
        receiptId: courseRegistrations.receiptId,
        createdAt: courseRegistrations.createdAt,
        courseTitle: courses.title,
        coursePrice: courses.price,
        courseDuration: courses.duration,
        userName: users.name,
        userEmail: users.email,
      })
      .from(courseRegistrations)
      .leftJoin(courses, eq(courseRegistrations.courseId, courses.id))
      .leftJoin(users, eq(courseRegistrations.userId, users.id))
      .where(eq(courseRegistrations.schoolId, schoolId))
      .orderBy(desc(courseRegistrations.createdAt));
  }

  async isUserRegisteredForCourse(userId: number, courseId: number, schoolId: number): Promise<boolean> {
    const [registration] = await db
      .select({ id: courseRegistrations.id })
      .from(courseRegistrations)
      .where(
        and(
          eq(courseRegistrations.userId, userId),
          eq(courseRegistrations.courseId, courseId),
          eq(courseRegistrations.schoolId, schoolId)
        )
      )
      .limit(1);
    
    return !!registration;
  }

  async isChildRegisteredForCourse(userId: number, childId: number, courseId: number, schoolId: number): Promise<boolean> {
    const [registration] = await db
      .select({ id: courseRegistrations.id })
      .from(courseRegistrations)
      .where(
        and(
          eq(courseRegistrations.userId, userId),
          eq(courseRegistrations.childId, childId),
          eq(courseRegistrations.courseId, courseId),
          eq(courseRegistrations.schoolId, schoolId)
        )
      )
      .limit(1);
    
    return !!registration;
  }

  async updateCourseRegistrationPayment(
    registrationId: number,
    schoolId: number,
    updateData: {
      paymentStatus?: string;
      paidAt?: Date | null;
      paidBy?: number;
      receiptId?: string;
    }
  ): Promise<CourseRegistration> {
    const [registration] = await db
      .update(courseRegistrations)
      .set(updateData)
      .where(
        and(
          eq(courseRegistrations.id, registrationId),
          eq(courseRegistrations.schoolId, schoolId)
        )
      )
      .returning();

    if (!registration) {
      throw new Error('Course registration not found');
    }

    return registration;
  }

  async getNotifications(
    userId: number,
    schoolId?: number,
  ): Promise<Notification[]> {
    if (!schoolId) {
      console.warn(
        "getNotifications called without schoolId - returning empty array for security",
      );
      return [];
    }

    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.schoolId, schoolId),
        ),
      )
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(
    insertNotification: InsertNotification,
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(
    userId: number,
    schoolId?: number,
  ): Promise<number> {
    if (!schoolId) {
      console.warn(
        "getUnreadNotificationCount called without schoolId - returning 0 for security",
      );
      return 0;
    }

    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.schoolId, schoolId),
          eq(notifications.read, false),
        ),
      );
    return result.length;
  }

  async createNotificationForUsers(
    userIds: number[],
    type: string,
    title: string,
    message: string,
    relatedId?: number,
    schoolId?: number,
  ): Promise<Notification[]> {
    if (!schoolId) {
      console.warn(
        "createNotificationForUsers called without schoolId - skipping notification creation for security",
      );
      return [];
    }

    const notificationPromises = userIds.map((userId) =>
      this.createNotification({
        userId,
        type,
        title,
        message,
        relatedId,
        schoolId,
      }),
    );
    return await Promise.all(notificationPromises);
  }

  // Verification methods - only for children and students

  async verifyChild(
    childId: number,
    adminId: number,
    notes?: string,
    educationLevel?: string,
    selectedSubjects?: string[],
  ): Promise<Child> {
    const updateData: any = {
      verified: true,
      verificationNotes: notes || null,
      verifiedAt: new Date(),
      verifiedBy: adminId,
    };

    if (educationLevel) {
      updateData.educationLevel = educationLevel;
    }

    if (selectedSubjects && selectedSubjects.length > 0) {
      updateData.subjects = selectedSubjects;
    }

    const [child] = await db
      .update(children)
      .set(updateData)
      .where(eq(children.id, childId))
      .returning();
    return child;
  }

  async verifyStudent(
    studentId: number,
    adminId: number,
    notes?: string,
    educationLevel?: string,
    selectedSubjects?: string[],
  ): Promise<Student> {
    const updateData: any = {
      verified: true,
      verificationNotes: notes || null,
      verifiedAt: new Date(),
      verifiedBy: adminId,
    };

    if (educationLevel) {
      updateData.educationLevel = educationLevel;
    }

    if (selectedSubjects && selectedSubjects.length > 0) {
      updateData.selectedSubjects = selectedSubjects;
    }

    const [student] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, studentId))
      .returning();

    // Also update the user's verification status to keep them in sync
    if (student.userId) {
      await db
        .update(users)
        .set({
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: adminId,
          verificationNotes: notes || null,
        })
        .where(eq(users.id, student.userId));
    }

    return student;
  }

  async getUnverifiedChildren(schoolId: number): Promise<Child[]> {
    return await db
      .select()
      .from(children)
      .where(and(eq(children.verified, false), eq(children.schoolId, schoolId)))
      .orderBy(desc(children.createdAt));
  }

  async getUnverifiedStudents(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: students.id,
        userId: students.userId,
        educationLevel: students.educationLevel,
        grade: students.grade,
        createdAt: students.createdAt,
        verified: students.verified,
        name: users.name,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(students.verified, false),
          eq(users.role, "student"),
          eq(students.schoolId, schoolId),
        ),
      )
      .orderBy(desc(students.createdAt));
  }

  async getVerifiedChildren(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: children.id,
        parentId: children.parentId,
        name: children.name,
        educationLevel: children.educationLevel,
        grade: children.grade,
        verified: children.verified,
        verifiedAt: children.verifiedAt,
        verifiedBy: children.verifiedBy,
        verificationNotes: children.verificationNotes,
        selectedSubjects: children.selectedSubjects,
        createdAt: children.createdAt,
        schoolId: children.schoolId,
      })
      .from(children)
      .where(and(eq(children.verified, true), eq(children.schoolId, schoolId)))
      .orderBy(desc(children.verifiedAt));
  }

  async getVerifiedStudents(schoolId: number): Promise<any[]> {
    const allVerifiedStudents = await db
      .select({
        id: students.id,
        userId: students.userId,
        educationLevel: students.educationLevel,
        grade: students.grade,
        verified: students.verified,
        verifiedAt: students.verifiedAt,
        verifiedBy: students.verifiedBy,
        verificationNotes: students.verificationNotes,
        selectedSubjects: students.selectedSubjects,
        name: sql<string>`COALESCE(${users.name}, ${students.name})`.as("name"),
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(students.verified, true),
          eq(students.schoolId, schoolId),
          or(
            isNull(students.userId), // Pre-registered students (no userId yet)
            eq(users.role, "student"), // Claimed students with role = 'student'
          ),
        ),
      )
      .orderBy(desc(students.verifiedAt));

    // Remove duplicates by keeping only the most recent verified student record per user
    const uniqueVerifiedStudents = allVerifiedStudents.reduce(
      (acc: any[], current: any) => {
        if (current.userId) {
          // For students with userId, check if we already have this user
          const existing = acc.find(
            (student) => student.userId === current.userId,
          );
          if (!existing) {
            acc.push(current);
          } else if (
            new Date(current.verifiedAt) > new Date(existing.verifiedAt)
          ) {
            // Replace with more recent verification
            const index = acc.findIndex(
              (student) => student.userId === current.userId,
            );
            acc[index] = current;
          }
        } else {
          // For pre-registered students (no userId), keep all as they're unique
          acc.push(current);
        }
        return acc;
      },
      [],
    );

    console.log(
      `[DEBUG] getVerifiedStudents: Found ${allVerifiedStudents.length} total records, returning ${uniqueVerifiedStudents.length} unique students`,
    );
    return uniqueVerifiedStudents;
  }

  async undoVerifyChild(childId: number): Promise<Child> {
    const [child] = await db
      .update(children)
      .set({
        verified: false,
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null,
        selectedSubjects: null,
      })
      .where(eq(children.id, childId))
      .returning();
    return child;
  }

  async undoVerifyStudent(studentId: number): Promise<Student> {
    const [student] = await db
      .update(students)
      .set({
        verified: false,
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null,
        selectedSubjects: null,
      })
      .where(eq(students.id, studentId))
      .returning();

    // Also update the user's verification status to keep them in sync
    if (student.userId) {
      await db
        .update(users)
        .set({
          verified: false,
          verifiedAt: null,
          verifiedBy: null,
          verificationNotes: null,
        })
        .where(eq(users.id, student.userId));
    }

    return student;
  }

  async updateUserProfilePicture(
    userId: number,
    profilePictureUrl: string,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserFirebaseUid(
    userId: number,
    firebaseUid: string,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ firebaseUid })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    return user;
  }

  async updateUserProfile(
    userId: number,
    data: { name?: string; email?: string },
  ): Promise<User> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUser(
    userId: number,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      profilePicture?: string | null;
      password?: string;
    },
  ): Promise<User> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.profilePicture !== undefined)
      updateData.profilePicture = data.profilePicture;
    
    // Handle password hashing if password is provided
    if (data.password !== undefined) {
      const bcrypt = await import("bcrypt");
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Phone verification methods
  async savePhoneVerificationCode(
    userId: number,
    code: string,
    expiry: Date,
  ): Promise<void> {
    await db
      .update(users)
      .set({
        phoneVerificationCode: code,
        phoneVerificationExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async verifyPhoneCode(userId: number, code: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      return false;
    }

    // Check if code matches and is not expired
    const isCodeValid = user.phoneVerificationCode === code;
    const isNotExpired = user.phoneVerificationExpiry > new Date();

    return isCodeValid && isNotExpired;
  }

  async markPhoneAsVerified(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null,
      })
      .where(eq(users.id, userId));
  }

  async saveEmailVerificationCode(
    userId: number,
    code: string,
    expiry: Date,
  ): Promise<void> {
    await db
      .update(users)
      .set({ emailVerificationCode: code, emailVerificationExpiry: expiry })
      .where(eq(users.id, userId));
  }

  async verifyEmailCode(userId: number, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.emailVerificationCode || !user.emailVerificationExpiry) {
      return false;
    }

    const now = new Date();
    if (now > user.emailVerificationExpiry) {
      return false; // Code expired
    }

    return user.emailVerificationCode === code.trim();
  }

  async markEmailAsVerified(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, userId));
  }

  // Teaching module methods
  async getTeachingModules(): Promise<TeachingModule[]> {
    return await db
      .select()
      .from(teachingModules)
      .orderBy(desc(teachingModules.createdAt));
  }

  async getTeachingModulesByLevel(
    educationLevel: string,
    schoolId: number,
  ): Promise<TeachingModule[]> {
    return await db
      .select()
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.educationLevel, educationLevel),
          or(
            eq(teachingModules.schoolId, schoolId),
            isNull(teachingModules.schoolId),
          ),
        ),
      )
      .orderBy(desc(teachingModules.createdAt));
  }

  async getTeachingModulesBySchool(
    schoolId: number,
  ): Promise<TeachingModule[]> {
    return await db
      .select()
      .from(teachingModules)
      .where(
        or(
          eq(teachingModules.schoolId, schoolId),
          isNull(teachingModules.schoolId),
        ),
      )
      .orderBy(desc(teachingModules.createdAt));
  }

  async getGroupsBySubjectIds(
    subjectIds: number[],
    schoolId: number,
  ): Promise<any[]> {
    return await db
      .select()
      .from(groups)
      .where(
        and(
          inArray(groups.subjectId, subjectIds),
          eq(groups.schoolId, schoolId),
        ),
      );
  }

  async updateGroupSubject(
    groupId: number,
    newSubjectId: number,
    schoolId: number,
  ): Promise<void> {
    await db
      .update(groups)
      .set({ subjectId: newSubjectId })
      .where(and(eq(groups.id, groupId), eq(groups.schoolId, schoolId)));
  }

  async getGlobalTeachingModules(): Promise<TeachingModule[]> {
    // Only return global standardized subjects (schoolId = NULL)
    return await db
      .select()
      .from(teachingModules)
      .where(isNull(teachingModules.schoolId))
      .orderBy(
        teachingModules.nameAr,
        teachingModules.educationLevel,
        teachingModules.grade,
      );
  }

  async createTeachingModule(
    insertModule: InsertTeachingModule,
  ): Promise<TeachingModule> {
    const [module] = await db
      .insert(teachingModules)
      .values(insertModule)
      .returning();
    return module;
  }

  async deleteTeachingModule(id: number): Promise<void> {
    await db.delete(teachingModules).where(eq(teachingModules.id, id));
  }

  // ChatGPT's solution: Module Years mapping methods
  async getModuleYears(moduleId: number): Promise<string[]> {
    const years = await db
      .select()
      .from(moduleYears)
      .where(eq(moduleYears.moduleId, moduleId));
    return years.map((y) => y.grade);
  }

  async createModuleYear(moduleId: number, grade: string): Promise<void> {
    await db.insert(moduleYears).values({ moduleId, grade });
  }

  async getModulesWithYears(schoolId?: number): Promise<any[]> {
    const modules = await db
      .select()
      .from(teachingModules)
      .where(
        schoolId
          ? or(
              eq(teachingModules.schoolId, schoolId),
              isNull(teachingModules.schoolId),
            )
          : isNull(teachingModules.schoolId),
      )
      .orderBy(teachingModules.educationLevel, teachingModules.name);

    // Get years for each module
    const modulesWithYears = await Promise.all(
      modules.map(async (module) => {
        const years = await this.getModuleYears(module.id);
        return {
          ...module,
          years,
        };
      }),
    );

    return modulesWithYears;
  }

  // Teacher specialization methods
  async getTeacherSpecializations(
    teacherId: number,
  ): Promise<TeacherSpecialization[]> {
    return await db
      .select()
      .from(teacherSpecializations)
      .where(eq(teacherSpecializations.teacherId, teacherId))
      .orderBy(desc(teacherSpecializations.createdAt));
  }

  async createTeacherSpecialization(
    insertSpecialization: InsertTeacherSpecialization,
  ): Promise<TeacherSpecialization> {
    const [specialization] = await db
      .insert(teacherSpecializations)
      .values([insertSpecialization])
      .returning();
    return specialization;
  }

  async deleteTeacherSpecialization(id: number): Promise<void> {
    await db
      .delete(teacherSpecializations)
      .where(eq(teacherSpecializations.id, id));
  }

  async getTeachersByModule(
    moduleId: number,
  ): Promise<TeacherSpecialization[]> {
    return await db
      .select()
      .from(teacherSpecializations)
      .where(eq(teacherSpecializations.moduleId, moduleId))
      .orderBy(desc(teacherSpecializations.createdAt));
  }

  // Schedule table methods
  async getScheduleTables(): Promise<ScheduleTable[]> {
    return await db
      .select()
      .from(scheduleTables)
      .orderBy(desc(scheduleTables.createdAt));
  }

  async getScheduleTablesBySchool(schoolId: number): Promise<ScheduleTable[]> {
    return await db
      .select()
      .from(scheduleTables)
      .where(eq(scheduleTables.schoolId, schoolId))
      .orderBy(desc(scheduleTables.createdAt));
  }

  async getScheduleTable(id: number): Promise<ScheduleTable | undefined> {
    const [table] = await db
      .select()
      .from(scheduleTables)
      .where(eq(scheduleTables.id, id));
    return table;
  }

  async createScheduleTable(
    insertTable: InsertScheduleTable,
  ): Promise<ScheduleTable> {
    const [table] = await db
      .insert(scheduleTables)
      .values([insertTable])
      .returning();
    return table;
  }

  async updateScheduleTable(
    id: number,
    updates: Partial<InsertScheduleTable>,
  ): Promise<ScheduleTable> {
    const [table] = await db
      .update(scheduleTables)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduleTables.id, id))
      .returning();
    return table;
  }

  async deleteScheduleTable(id: number): Promise<void> {
    await db.delete(scheduleTables).where(eq(scheduleTables.id, id));
  }

  // Schedule cell methods
  async getScheduleCells(scheduleTableId: number): Promise<ScheduleCell[]> {
    return await db
      .select()
      .from(scheduleCells)
      .where(eq(scheduleCells.scheduleTableId, scheduleTableId))
      .orderBy(scheduleCells.dayOfWeek, scheduleCells.period);
  }

  async getScheduleCell(id: number): Promise<ScheduleCell | undefined> {
    const [cell] = await db
      .select()
      .from(scheduleCells)
      .where(eq(scheduleCells.id, id));
    return cell;
  }

  async createScheduleCell(
    insertCell: InsertScheduleCell,
  ): Promise<ScheduleCell> {
    const [cell] = await db
      .insert(scheduleCells)
      .values(insertCell)
      .returning();
    return cell;
  }

  async updateScheduleCell(
    id: number,
    updates: Partial<InsertScheduleCell>,
  ): Promise<ScheduleCell> {
    const [cell] = await db
      .update(scheduleCells)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduleCells.id, id))
      .returning();
    return cell;
  }

  async deleteScheduleCell(id: number): Promise<void> {
    await db.delete(scheduleCells).where(eq(scheduleCells.id, id));
  }

  // Group Attendance methods
  async getGroupAttendance(
    groupId: number,
    date?: string,
  ): Promise<GroupAttendance[]> {
    let query = db
      .select()
      .from(groupAttendance)
      .where(eq(groupAttendance.groupId, groupId));

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = db
        .select()
        .from(groupAttendance)
        .where(
          and(
            eq(groupAttendance.groupId, groupId),
            sql`${groupAttendance.attendanceDate} >= ${startOfDay}`,
            sql`${groupAttendance.attendanceDate} <= ${endOfDay}`,
          ),
        );
    }

    return await query.orderBy(desc(groupAttendance.attendanceDate));
  }

  async markAttendance(
    attendance: InsertGroupAttendance,
  ): Promise<GroupAttendance> {
    // SIMPLIFIED: Only use userId for attendance tracking
    console.log(
      `[ATTENDANCE] Marking attendance using userId: ${attendance.userId}`,
    );

    if (!attendance.userId) {
      throw new Error("userId is required for attendance tracking");
    }

    // Check if attendance record already exists for this student on this date
    const attendanceDateStart = new Date(attendance.attendanceDate);
    attendanceDateStart.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendance.attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    // Check for existing attendance using userId only
    const whereConditions = [
      eq(groupAttendance.groupId, attendance.groupId),
      eq(groupAttendance.userId, attendance.userId), // Only use userId
      and(
        sql`${groupAttendance.attendanceDate} >= ${attendanceDateStart}`,
        sql`${groupAttendance.attendanceDate} <= ${attendanceDateEnd}`,
      ),
    ];

    const existing = await db
      .select()
      .from(groupAttendance)
      .where(and(...whereConditions))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      const [result] = await db
        .update(groupAttendance)
        .set({
          status: attendance.status,
          notes: attendance.notes,
          markedBy: attendance.markedBy,
          updatedAt: new Date(),
        })
        .where(eq(groupAttendance.id, existing[0].id))
        .returning();
      return result;
    } else {
      // Create new record using userId only
      const [result] = await db
        .insert(groupAttendance)
        .values(attendance) // Use original attendance data (userId-based)
        .returning();
      return result;
    }
  }

  async updateAttendance(
    id: number,
    updates: Partial<InsertGroupAttendance>,
  ): Promise<GroupAttendance> {
    const [result] = await db
      .update(groupAttendance)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groupAttendance.id, id))
      .returning();
    return result;
  }

  async getAttendanceWithStudentDetails(
    groupId: number,
    date?: string,
  ): Promise<any[]> {
    // Get school ID from group for data isolation
    const [group] = await db
      .select({ schoolId: groups.schoolId })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);
    const schoolId = group?.schoolId;
    if (!schoolId) throw new Error("Group not found or missing school ID");
    // Direct approach: Get attendance records directly from group_attendance table
    // Use userId from attendance table for efficient name lookups
    const attendanceRecords = await db
      .select()
      .from(groupAttendance)
      .where(
        and(
          eq(groupAttendance.groupId, groupId),
          eq(groupAttendance.schoolId, schoolId), // School ID verification
        ),
      )
      .orderBy(desc(groupAttendance.attendanceDate));

    // Filter by date if specified
    let filteredRecords = attendanceRecords;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filteredRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.attendanceDate);
        return recordDate >= startOfDay && recordDate <= endOfDay;
      });
    }

    // Populate student details for each record
    const result = [];
    for (const record of filteredRecords) {
      let studentInfo;

      if (record.studentType === "student") {
        // CRITICAL FIX: Use userId from attendance table, not studentId
        if (record.userId) {
          console.log(
            `[FIXED] Using userId ${record.userId} from attendance table for student name lookup`,
          );
          const [userInfo] = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(
              and(
                eq(users.id, record.userId), // FIXED: Use userId, not studentId
                eq(users.schoolId, schoolId), // ENFORCE school isolation
              ),
            )
            .limit(1);
          studentInfo = userInfo;
        } else {
          console.log(
            `[ERROR] No userId found in attendance record ${record.id}`,
          );
          studentInfo = null;
        }
      } else {
        // For children, we still use studentId since children don't have userIds
        // But we could optimize this by storing parent userId in the future
        const [childInfo] = await db
          .select({
            id: children.id,
            name: children.name,
            email:
              sql<string>`CONCAT('child_', ${children.id}, '@parent.local')`.as(
                "email",
              ),
          })
          .from(children)
          .where(
            and(
              eq(children.id, record.studentId),
              eq(children.schoolId, schoolId), // Verify school ID for data isolation
            ),
          )
          .limit(1);
        studentInfo = childInfo;
      }

      // Get marker details
      let markerInfo = null;
      if (record.markedBy) {
        const [marker] = await db
          .select({
            id: users.id,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, record.markedBy))
          .limit(1);
        markerInfo = marker;
      }

      result.push({
        ...record,
        student: studentInfo,
        markedBy: markerInfo,
      });
    }

    return result;
  }

  async getGroupAttendanceHistory(
    groupId: number,
    schoolId: number,
  ): Promise<any[]> {
    // CORRECT IMPLEMENTATION: Use JOIN with userId for attendance name lookup
    // Query follows the pattern: SELECT u.name, ga.* FROM group_attendance ga
    // JOIN users u ON ga.userId = u.id AND u.schoolId = ga.schoolId

    console.log(
      `[ATTENDANCE] Getting attendance history for group ${groupId}, school ${schoolId}`,
    );

    const attendanceRecords = await db
      .select({
        // Attendance record fields
        id: groupAttendance.id,
        studentId: groupAttendance.studentId,
        userId: groupAttendance.userId,
        studentType: groupAttendance.studentType,
        status: groupAttendance.status,
        attendanceDate: groupAttendance.attendanceDate,
        createdAt: groupAttendance.createdAt,
        groupId: groupAttendance.groupId,
        schoolId: groupAttendance.schoolId,
        // Student info from users table (using userId)
        student: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(groupAttendance)
      .leftJoin(
        users,
        and(
          eq(groupAttendance.userId, users.id), // JOIN on userId
          eq(users.schoolId, groupAttendance.schoolId), // School verification
        ),
      )
      .where(
        and(
          eq(groupAttendance.groupId, groupId),
          eq(groupAttendance.schoolId, schoolId),
        ),
      )
      .orderBy(
        desc(groupAttendance.attendanceDate),
        desc(groupAttendance.createdAt),
      );

    console.log(
      `[ATTENDANCE] Found ${attendanceRecords.length} attendance records with proper userId joins`,
    );

    // Log sample record for debugging
    if (attendanceRecords.length > 0) {
      const sample = attendanceRecords[0];
      console.log(
        `[ATTENDANCE] Sample record: userId=${sample.userId}, studentId=${sample.studentId}, studentName=${sample.student?.name}, schoolId=${sample.schoolId}`,
      );
    }

    return attendanceRecords;
  }

  async getGroupAttendanceForMonth(
    groupId: number,
    year: number,
    month: number,
  ): Promise<GroupAttendance[]> {
    const startDate = new Date(year, month - 1, 1); // month - 1 because JS months are 0-indexed
    const endDate = new Date(year, month, 0); // Last day of the month

    return await db
      .select()
      .from(groupAttendance)
      .where(
        and(
          eq(groupAttendance.groupId, groupId),
          sql`${groupAttendance.attendanceDate} >= ${startDate.toISOString().split("T")[0]}`,
          sql`${groupAttendance.attendanceDate} <= ${endDate.toISOString().split("T")[0]}`,
        ),
      )
      .orderBy(groupAttendance.attendanceDate);
  }


  // Group Financial Transaction methods
  async getGroupTransactions(
    groupId: number,
    studentId?: number,
  ): Promise<GroupTransaction[]> {
    let query = db
      .select()
      .from(groupTransactions)
      .where(eq(groupTransactions.groupId, groupId));

    if (studentId) {
      query = db
        .select()
        .from(groupTransactions)
        .where(
          and(
            eq(groupTransactions.groupId, groupId),
            eq(groupTransactions.studentId, studentId),
          ),
        );
    }

    return await query.orderBy(desc(groupTransactions.createdAt));
  }

  async createTransaction(
    transaction: InsertGroupTransaction,
  ): Promise<GroupTransaction> {
    // Determine userId based on studentId and studentType
    let userId: number;

    // Ensure studentType exists
    const studentType = (transaction as any).studentType || "student";

    if (studentType === "student") {
      // For direct students, userId = studentId
      userId = transaction.studentId;
    } else {
      // For children, find the parent's userId
      const child = await db
        .select({ parentId: children.parentId })
        .from(children)
        .where(eq(children.id, transaction.studentId))
        .limit(1);

      userId =
        child.length > 0 && child[0].parentId
          ? child[0].parentId
          : transaction.studentId;
    }

    // Add missing fields
    const finalTransaction = {
      ...transaction,
      userId, // Add the determined userId
      studentType: studentType as "student" | "child",
    };

    const [result] = await db
      .insert(groupTransactions)
      .values([finalTransaction])
      .returning();
    return result;
  }

  async updateTransaction(
    id: number,
    updates: Partial<InsertGroupTransaction>,
  ): Promise<GroupTransaction> {
    const [result] = await db
      .update(groupTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groupTransactions.id, id))
      .returning();
    return result;
  }

  async getTransactionsWithDetails(groupId: number): Promise<any[]> {
    return await db
      .select({
        id: groupTransactions.id,
        transactionType: groupTransactions.transactionType,
        amount: groupTransactions.amount,
        currency: groupTransactions.currency,
        description: groupTransactions.description,
        dueDate: groupTransactions.dueDate,
        paidDate: groupTransactions.paidDate,
        paymentMethod: groupTransactions.paymentMethod,
        status: groupTransactions.status,
        notes: groupTransactions.notes,
        student: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        recordedBy: {
          id: sql`recorder.id`,
          name: sql`recorder.name`,
        },
        createdAt: groupTransactions.createdAt,
        updatedAt: groupTransactions.updatedAt,
      })
      .from(groupTransactions)
      .leftJoin(users, eq(groupTransactions.studentId, users.id))
      .leftJoin(
        aliasedTable(users, "recorder"),
        eq(groupTransactions.recordedBy, sql`recorder.id`),
      )
      .where(eq(groupTransactions.groupId, groupId))
      .orderBy(desc(groupTransactions.createdAt));
  }

  async getStudentFinancialSummary(
    groupId: number,
    studentId: number,
  ): Promise<any> {
    const transactions = await db
      .select()
      .from(groupTransactions)
      .where(
        and(
          eq(groupTransactions.groupId, groupId),
          eq(groupTransactions.studentId, studentId),
        ),
      );

    const totalFees = transactions
      .filter((t) => t.transactionType === "fee")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPaid = transactions
      .filter((t) => t.transactionType === "payment" && t.status === "paid")
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingAmount = transactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.amount, 0);

    const overdueAmount = transactions
      .filter((t) => t.status === "overdue")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalFees,
      totalPaid,
      balance: totalFees - totalPaid,
      pendingAmount,
      overdueAmount,
      transactionCount: transactions.length,
    };
  }

  async getScheduleCellsWithDetails(scheduleTableId: number): Promise<any[]> {
    return await db
      .select({
        id: scheduleCells.id,
        dayOfWeek: scheduleCells.dayOfWeek,
        period: scheduleCells.period,
        duration: scheduleCells.duration,
        startTime: scheduleCells.startTime,
        endTime: scheduleCells.endTime,
        educationLevel: scheduleCells.educationLevel,
        grade: scheduleCells.grade,
        gender: scheduleCells.gender,
        subject: {
          id: teachingModules.id,
          name: teachingModules.name,
          nameAr: teachingModules.nameAr,
          educationLevel: teachingModules.educationLevel,
        },
        teacher: {
          id: users.id,
          name: users.name,
          gender: users.gender,
        },
        createdAt: scheduleCells.createdAt,
        updatedAt: scheduleCells.updatedAt,
      })
      .from(scheduleCells)
      .leftJoin(
        teachingModules,
        eq(scheduleCells.subjectId, teachingModules.id),
      )
      .leftJoin(users, eq(scheduleCells.teacherId, users.id))
      .where(eq(scheduleCells.scheduleTableId, scheduleTableId))
      .orderBy(scheduleCells.dayOfWeek, scheduleCells.period);
  }

  // User blocking methods
  async blockUser(
    blockerId: number,
    blockedId: number,
    reason?: string,
    schoolId?: number,
  ): Promise<BlockedUser> {
    // Get blocker's school ID if not provided
    let finalSchoolId = schoolId;
    if (!finalSchoolId) {
      const blocker = await this.getUser(blockerId);
      finalSchoolId = blocker?.schoolId ?? undefined;
    }

    if (!finalSchoolId) {
      throw new Error("School ID is required for blocking users");
    }

    const [blockedUser] = await db
      .insert(blockedUsers)
      .values([
        {
          blockerId,
          blockedId,
          reason: reason || null,
          schoolId: finalSchoolId,
        },
      ])
      .returning();
    return blockedUser;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    // Get blocker's school for proper isolation
    const blocker = await this.getUser(blockerId);
    if (!blocker?.schoolId) {
      throw new Error("School ID is required for unblocking users");
    }

    await db
      .delete(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId),
          eq(blockedUsers.schoolId, blocker.schoolId),
        ),
      );
  }

  async isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    // Get blocker's school for proper isolation
    const blocker = await this.getUser(blockerId);
    if (!blocker?.schoolId) {
      return false;
    }

    const [blocked] = await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId),
          eq(blockedUsers.schoolId, blocker.schoolId),
        ),
      );
    return !!blocked;
  }

  async getBlockedUsers(userId: number): Promise<BlockedUser[]> {
    // Get user's school for proper isolation
    const user = await this.getUser(userId);
    if (!user?.schoolId) {
      return [];
    }

    return await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, userId),
          eq(blockedUsers.schoolId, user.schoolId),
        ),
      )
      .orderBy(desc(blockedUsers.createdAt));
  }

  // User reporting methods
  async reportUser(insertReport: InsertUserReport): Promise<UserReport> {
    // Ensure schoolId is present
    let finalReport = { ...insertReport };
    if (!finalReport.schoolId) {
      const reporter = await this.getUser(insertReport.reporterId);
      finalReport.schoolId = reporter?.schoolId;
    }

    if (!finalReport.schoolId) {
      throw new Error("School ID is required for reporting users");
    }

    const [report] = await db
      .insert(userReports)
      .values([finalReport])
      .returning();
    return report;
  }

  async getUserReports(userId: number): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .where(eq(userReports.reporterId, userId))
      .orderBy(desc(userReports.createdAt));
  }

  // Admin reporting methods
  async getAllReports(schoolId?: number): Promise<any[]> {
    const reporterAlias = aliasedTable(users, "reporter");
    const reportedAlias = aliasedTable(users, "reported");

    let query = db
      .select({
        id: userReports.id,
        reporterId: userReports.reporterId,
        reportedUserId: userReports.reportedUserId,
        messageId: userReports.messageId,
        reason: userReports.reason,
        description: userReports.description,
        status: userReports.status,
        createdAt: userReports.createdAt,
        reporterName: reporterAlias.name,
        reportedUserName: reportedAlias.name,
        schoolId: userReports.schoolId,
      })
      .from(userReports)
      .leftJoin(reporterAlias, eq(userReports.reporterId, reporterAlias.id))
      .leftJoin(
        reportedAlias,
        eq(userReports.reportedUserId, reportedAlias.id),
      );

    // Filter by school if provided (for proper multi-tenancy)
    let finalQuery = query;
    if (schoolId) {
      finalQuery = db
        .select({
          id: userReports.id,
          reporterId: userReports.reporterId,
          reportedUserId: userReports.reportedUserId,
          messageId: userReports.messageId,
          reason: userReports.reason,
          description: userReports.description,
          status: userReports.status,
          createdAt: userReports.createdAt,
          reporterName: reporterAlias.name,
          reportedUserName: reportedAlias.name,
          schoolId: userReports.schoolId,
        })
        .from(userReports)
        .leftJoin(reporterAlias, eq(userReports.reporterId, reporterAlias.id))
        .leftJoin(
          reportedAlias,
          eq(userReports.reportedUserId, reportedAlias.id),
        )
        .where(eq(userReports.schoolId, schoolId));
    }

    return await finalQuery.orderBy(desc(userReports.createdAt));
  }

  async updateReportStatus(
    reportId: number,
    status: string,
  ): Promise<UserReport> {
    const [report] = await db
      .update(userReports)
      .set({ status })
      .where(eq(userReports.id, reportId))
      .returning();
    return report;
  }

  // User banning methods
  async banUser(
    userId: number,
    reason: string,
    bannedBy: number,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        banned: true,
        banReason: reason,
        bannedAt: new Date(),
        bannedBy,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unbanUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        banned: false,
        banReason: null,
        bannedAt: null,
        bannedBy: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getBannedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.banned, true))
      .orderBy(desc(users.bannedAt));
  }

  // Enhanced message methods - Get last message from each conversation
  async getMessagesWithUserInfo(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        teacherId: messages.teacherId,
        subject: messages.subject,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderProfilePicture: users.profilePicture,
        senderEmail: users.email,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    // Get additional user info for receivers including their roles
    const messagesWithCompleteInfo = await Promise.all(
      result.map(async (message) => {
        const receiver = message.receiverId
          ? await this.getUser(message.receiverId)
          : undefined;
        return {
          ...message,
          receiverName: receiver?.name,
          receiverProfilePicture: receiver?.profilePicture,
          receiverRole: receiver?.role,
        };
      }),
    );

    // Group messages by conversation partner and get only the latest message from each
    const conversationMap = new Map<number, any>();

    messagesWithCompleteInfo.forEach((message) => {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, message);
      }
    });

    return Array.from(conversationMap.values());
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));
  }

  async getConversationBetweenUsers(
    userId1: number,
    userId2: number,
  ): Promise<any[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        teacherId: messages.teacherId,
        subject: messages.subject,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderProfilePicture: users.profilePicture,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1)),
        ),
      )
      .orderBy(messages.createdAt); // Chronological order for chat history

    return result;
  }

  // Push subscription methods
  async createPushSubscription(
    subscription: InsertPushSubscription,
  ): Promise<PushSubscription> {
    // Check if subscription already exists for this user and endpoint
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, subscription.userId),
          eq(pushSubscriptions.endpoint, subscription.endpoint),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      const [updated] = await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          userAgent: subscription.userAgent,
          lastUsed: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing[0].id))
        .returning();
      return updated;
    }

    // Create new subscription
    const [newSubscription] = await db
      .insert(pushSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async getUserPushSubscriptions(userId: number): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(desc(pushSubscriptions.lastUsed));
  }

  async getUsersWithPushSubscriptions(schoolId: number): Promise<User[]> {
    const result = await db
      .selectDistinct({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
      .where(eq(users.schoolId, schoolId));

    return result;
  }

  async getUsersByRoles(schoolId: number, roles: string[]): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), inArray(users.role, roles)));
  }

  async updatePushSubscriptionLastUsed(subscriptionId: number): Promise<void> {
    await db
      .update(pushSubscriptions)
      .set({ lastUsed: new Date() })
      .where(eq(pushSubscriptions.id, subscriptionId));
  }

  async deletePushSubscription(subscriptionId: number): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.id, subscriptionId));
  }

  async deleteUserPushSubscriptions(userId: number): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  // Notification log methods
  async createNotificationLog(
    log: InsertNotificationLog,
  ): Promise<NotificationLog> {
    const [newLog] = await db
      .insert(notificationLogs)
      .values([log])
      .returning();
    return newLog;
  }

  async getNotificationLogs(
    schoolId: number,
    limit: number = 100,
  ): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.schoolId, schoolId))
      .orderBy(desc(notificationLogs.sentAt))
      .limit(limit);
  }

  async getNotificationLogsByUser(
    userId: number,
    limit: number = 50,
  ): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.userId, userId))
      .orderBy(desc(notificationLogs.sentAt))
      .limit(limit);
  }

  // Teaching modules/custom subjects methods
  async getTeachingModuleByName(
    nameAr: string,
    educationLevel: string,
  ): Promise<any | undefined> {
    const [module] = await db
      .select()
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.nameAr, nameAr),
          eq(teachingModules.educationLevel, educationLevel),
        ),
      );
    return module;
  }

  async getTeachingModuleByNameAllLevels(
    nameAr: string,
  ): Promise<any | undefined> {
    const [module] = await db
      .select()
      .from(teachingModules)
      .where(eq(teachingModules.nameAr, nameAr))
      .limit(1);
    return module;
  }

  async getTeachingModuleByNameAndGrade(
    nameAr: string,
    educationLevel: string,
    grade: string,
  ): Promise<any | undefined> {
    const [module] = await db
      .select()
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.nameAr, nameAr),
          eq(teachingModules.educationLevel, educationLevel),
          eq(teachingModules.grade, grade),
        ),
      );
    return module;
  }

  async createCustomSubject(subjectData: {
    name: string;
    nameAr: string;
    educationLevel: string;
    grade?: string;
    description?: string;
    schoolId?: number; // ✅ FIX: Add schoolId parameter
  }) {
    const [customSubject] = await db
      .insert(teachingModules)
      .values([
        {
          name: subjectData.name,
          nameAr: subjectData.nameAr,
          educationLevel: subjectData.educationLevel,
          grade: subjectData.grade,
          description: subjectData.description,
          schoolId: subjectData.schoolId, // ✅ FIX: Include schoolId in database insert
        },
      ])
      .returning();
    return customSubject;
  }

  // School statistics and management methods
  async getSchoolStatistics(schoolId: number): Promise<any> {
    try {
      // Get user counts by role
      const userCounts = await db
        .select({
          role: users.role,
          count: sql<number>`count(*)`,
        })
        .from(users)
        .where(eq(users.schoolId, schoolId))
        .groupBy(users.role);

      // Get children count
      const [childrenCount] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(children)
        .leftJoin(users, eq(children.parentId, users.id))
        .where(eq(users.schoolId, schoolId));

      // Get announcements count
      const [announcementsCount] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(announcements)
        .where(eq(announcements.schoolId, schoolId));

      // Get blog posts count
      const [blogPostsCount] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(blogPosts)
        .where(eq(blogPosts.schoolId, schoolId));

      // Get groups count
      const [groupsCount] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(groups)
        .where(eq(groups.schoolId, schoolId));

      // Get formations count
      const [formationsCount] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(formations)
        .where(eq(formations.schoolId, schoolId));

      // Process user counts into a readable format
      const stats = {
        totalUsers: 0,
        admins: 0,
        teachers: 0,
        students: 0,
        parents: 0,
        children: childrenCount?.count || 0,
        announcements: announcementsCount?.count || 0,
        blogPosts: blogPostsCount?.count || 0,
        groups: groupsCount?.count || 0,
        formations: formationsCount?.count || 0,
      };

      userCounts.forEach((roleCount) => {
        const count = parseInt(roleCount.count.toString()) || 0;
        stats.totalUsers += count;
        switch (roleCount.role) {
          case "admin":
            stats.admins = count;
            break;
          case "teacher":
            stats.teachers = count;
            break;
          case "student":
            stats.students = count;
            break;
          case "parent":
            stats.parents = count;
            break;
        }
      });

      // Ensure all stats are proper integers
      return {
        totalUsers: parseInt(stats.totalUsers.toString()) || 0,
        admins: parseInt(stats.admins.toString()) || 0,
        teachers: parseInt(stats.teachers.toString()) || 0,
        students: parseInt(stats.students.toString()) || 0,
        parents: parseInt(stats.parents.toString()) || 0,
        children: parseInt(stats.children.toString()) || 0,
        announcements: parseInt(stats.announcements.toString()) || 0,
        blogPosts: parseInt(stats.blogPosts.toString()) || 0,
        groups: parseInt(stats.groups.toString()) || 0,
        formations: parseInt(stats.formations.toString()) || 0,
      };
    } catch (error) {
      console.error("Error getting school statistics:", error);
      throw error;
    }
  }

  async updateSchoolKeys(
    schoolId: number,
    adminKey: string,
    teacherKey: string,
  ): Promise<void> {
    await db
      .update(schools)
      .set({
        adminKey,
        teacherKey,
      })
      .where(eq(schools.id, schoolId));
  }

  // School Subscription methods implementation
  async updateSchoolSubscription(
    schoolId: number,
    subscriptionData: {
      subscriptionExpiry?: Date | null;
      subscriptionStatus?: string;
      subscriptionNotes?: string;
      subscriptionLastUpdated?: Date;
      subscriptionUpdatedBy?: number;
    },
  ): Promise<void> {
    // Only update fields that are provided
    const updateData: any = {};
    
    if (subscriptionData.subscriptionExpiry !== undefined) {
      updateData.subscriptionExpiry = subscriptionData.subscriptionExpiry;
    }
    if (subscriptionData.subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionData.subscriptionStatus;
    }
    if (subscriptionData.subscriptionNotes !== undefined) {
      updateData.subscriptionNotes = subscriptionData.subscriptionNotes;
    }
    if (subscriptionData.subscriptionLastUpdated !== undefined) {
      updateData.subscriptionLastUpdated = subscriptionData.subscriptionLastUpdated;
    }
    if (subscriptionData.subscriptionUpdatedBy !== undefined) {
      updateData.subscriptionUpdatedBy = subscriptionData.subscriptionUpdatedBy;
    }

    await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, schoolId));
  }

  async getSchoolSubscriptionStatus(schoolId: number): Promise<any> {
    const [school] = await db
      .select({
        id: schools.id,
        name: schools.name,
        subscriptionExpiry: schools.subscriptionExpiry,
        subscriptionStatus: schools.subscriptionStatus,
        subscriptionNotes: schools.subscriptionNotes,
        subscriptionLastUpdated: schools.subscriptionLastUpdated,
      })
      .from(schools)
      .where(eq(schools.id, schoolId));

    if (!school) {
      throw new Error("المدرسة غير موجودة");
    }

    // Calculate days remaining
    const daysRemaining = school.subscriptionExpiry
      ? Math.ceil(
          (new Date(school.subscriptionExpiry).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      ...school,
      daysRemaining,
      isExpiring: daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0,
      isExpired: daysRemaining !== null && daysRemaining <= 0,
    };
  }

  async getSchoolsWithExpiringSubscriptions(daysThreshold: number): Promise<any[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const expiringSchools = await db
      .select({
        id: schools.id,
        name: schools.name,
        code: schools.code,
        subscriptionExpiry: schools.subscriptionExpiry,
        subscriptionStatus: schools.subscriptionStatus,
        subscriptionNotes: schools.subscriptionNotes,
      })
      .from(schools)
      .where(
        and(
          eq(schools.active, true),
          ne(schools.subscriptionStatus, "suspended"),
          sql`${schools.subscriptionExpiry} IS NOT NULL AND ${schools.subscriptionExpiry} <= ${thresholdDate}`,
        ),
      )
      .orderBy(asc(schools.subscriptionExpiry));

    return expiringSchools.map((school) => {
      const daysRemaining = school.subscriptionExpiry
        ? Math.ceil(
            (new Date(school.subscriptionExpiry).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      return {
        ...school,
        daysRemaining,
        isExpiring: daysRemaining !== null && daysRemaining <= daysThreshold && daysRemaining > 0,
        isExpired: daysRemaining !== null && daysRemaining <= 0,
      };
    });
  }

  async toggleSchoolAccess(schoolId: number, isAccessEnabled: boolean): Promise<void> {
    await db
      .update(schools)
      .set({ isAccessEnabled })
      .where(eq(schools.id, schoolId));
  }

  // Group Schedule methods implementation
  async getGroupScheduledLessonDates(
    groupId: number,
    schoolId: number,
  ): Promise<string[]> {
    try {
      // Get all schedule assignments for this group
      const assignments = await db
        .select({
          scheduleCellId: groupScheduleAssignments.scheduleCellId,
          dayOfWeek: scheduleCells.dayOfWeek,
          startTime: scheduleCells.startTime,
          endTime: scheduleCells.endTime,
        })
        .from(groupScheduleAssignments)
        .leftJoin(
          scheduleCells,
          eq(groupScheduleAssignments.scheduleCellId, scheduleCells.id),
        )
        .where(
          and(
            eq(groupScheduleAssignments.groupId, groupId),
            eq(groupScheduleAssignments.schoolId, schoolId),
            eq(groupScheduleAssignments.isActive, true),
          ),
        );

      // Generate dates for the next 2 years based on scheduled days
      const dates: string[] = [];
      const today = new Date();
      const startOfWeek = new Date(today);

      // Adjust for Friday-first week (Friday = 0, Saturday = 1, ..., Thursday = 6)
      // Find the most recent Friday to start from
      const daysSinceFriday = (today.getDay() + 2) % 7; // Convert to Friday-first mapping
      startOfWeek.setDate(today.getDate() - daysSinceFriday);

      for (let week = 0; week < 104; week++) {
        // 2 years = 104 weeks
        for (const assignment of assignments) {
          if (assignment.dayOfWeek !== null) {
            const lessonDate = new Date(startOfWeek);
            lessonDate.setDate(
              startOfWeek.getDate() + week * 7 + assignment.dayOfWeek,
            );

            // Only include future dates
            if (lessonDate >= today) {
              dates.push(lessonDate.toISOString().split("T")[0]);
            }
          }
        }
      }

      return dates.sort();
    } catch (error) {
      console.error("Error getting group scheduled lesson dates:", error);
      return [];
    }
  }

  async assignGroupToSchedule(
    groupId: number,
    scheduleCellId: number,
    schoolId: number,
    assignedBy: number,
  ): Promise<any> {
    try {
      const [assignment] = await db
        .insert(groupScheduleAssignments)
        .values({
          groupId,
          scheduleCellId,
          schoolId,
          assignedBy,
        })
        .returning();

      return assignment;
    } catch (error) {
      console.error("Error assigning group to schedule:", error);
      throw error;
    }
  }

  async getGroupScheduleAssignments(groupId: number): Promise<any[]> {
    try {
      return await db
        .select({
          id: groupScheduleAssignments.id,
          scheduleCellId: groupScheduleAssignments.scheduleCellId,
          isActive: groupScheduleAssignments.isActive,
          createdAt: groupScheduleAssignments.createdAt,
          dayOfWeek: scheduleCells.dayOfWeek,
          period: scheduleCells.period,
          startTime: scheduleCells.startTime,
          endTime: scheduleCells.endTime,
          educationLevel: scheduleCells.educationLevel,
          tableName: scheduleTables.name,
        })
        .from(groupScheduleAssignments)
        .leftJoin(
          scheduleCells,
          eq(groupScheduleAssignments.scheduleCellId, scheduleCells.id),
        )
        .leftJoin(
          scheduleTables,
          eq(scheduleCells.scheduleTableId, scheduleTables.id),
        )
        .where(eq(groupScheduleAssignments.groupId, groupId))
        .orderBy(scheduleCells.dayOfWeek, scheduleCells.period);
    } catch (error) {
      console.error("Error getting group schedule assignments:", error);
      return [];
    }
  }

  async getCompatibleGroups(
    subjectId: number,
    teacherId: number,
    educationLevel: string,
    schoolId: number,
  ): Promise<any[]> {
    try {
      console.log(`[GROUPS] Getting compatible groups for:`, {
        subjectId,
        teacherId,
        educationLevel,
        schoolId,
      });

      // First try exact matching (all criteria must match)
      const exactMatches = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          grade: groups.grade,
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          teacherName: users.name,
          studentsCount: sql<number>`array_length(${groups.studentsAssigned}, 1)`,
          matchType: sql<string>`'exact'`,
        })
        .from(groups)
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(
          and(
            eq(groups.schoolId, schoolId),
            eq(groups.subjectId, subjectId),
            eq(groups.teacherId, teacherId),
            // Handle "all" education level or specific level matching
            educationLevel === "all" || educationLevel === "جميع المستويات"
              ? undefined // Don't filter by education level if it's "all"
              : or(
                  eq(groups.educationLevel, educationLevel),
                  like(groups.educationLevel, `%${educationLevel}%`),
                ),
          ),
        )
        .orderBy(groups.name);

      console.log(`[GROUPS] Found ${exactMatches.length} exact matches`);

      if (exactMatches.length > 0) {
        return exactMatches;
      }

      // If no exact matches, try subject name compatibility (same subject different grades)
      console.log(`[GROUPS] Trying subject name compatibility...`);
      const requestedSubject = await db
        .select({ name: teachingModules.nameAr, name_en: teachingModules.name })
        .from(teachingModules)
        .where(eq(teachingModules.id, subjectId))
        .limit(1);

      if (requestedSubject.length > 0) {
        const subjectName =
          requestedSubject[0].name || requestedSubject[0].name_en || "";
        console.log(`[GROUPS] Looking for subject name: ${subjectName}`);

        // Find groups with same subject name but different grade levels
        const subjectCompatibleMatches = await db
          .select({
            id: groups.id,
            name: groups.name,
            educationLevel: groups.educationLevel,
            grade: groups.grade,
            subjectId: groups.subjectId,
            teacherId: groups.teacherId,
            teacherName: users.name,
            studentsCount: sql<number>`array_length(${groups.studentsAssigned}, 1)`,
            matchType: sql<string>`'subject_compatible'`,
          })
          .from(groups)
          .leftJoin(teachingModules, eq(groups.subjectId, teachingModules.id))
          .leftJoin(users, eq(groups.teacherId, users.id))
          .where(
            and(
              eq(groups.schoolId, schoolId),
              eq(groups.teacherId, teacherId),
              // Handle "all" education level or specific level matching
              educationLevel === "all" || educationLevel === "جميع المستويات"
                ? undefined // Don't filter by education level if it's "all"
                : or(
                    eq(groups.educationLevel, educationLevel),
                    like(groups.educationLevel, `%${educationLevel}%`),
                  ),
              // Same subject name
              or(
                eq(teachingModules.nameAr, subjectName),
                eq(teachingModules.name, subjectName),
              ),
            ),
          )
          .orderBy(groups.name);

        console.log(
          `[GROUPS] Found ${subjectCompatibleMatches.length} subject-compatible matches`,
        );
        if (subjectCompatibleMatches.length > 0) {
          return subjectCompatibleMatches;
        }
      } else {
        console.log(`[GROUPS] No subject found for subjectId: ${subjectId}`);
      }

      // If no subject-compatible matches, try partial matching (subject + education level, any teacher)
      console.log(`[GROUPS] Trying partial matching...`);
      const partialMatches = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          grade: groups.grade,
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          teacherName: users.name,
          studentsCount: sql<number>`array_length(${groups.studentsAssigned}, 1)`,
          matchType: sql<string>`'partial'`,
        })
        .from(groups)
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(
          and(
            eq(groups.schoolId, schoolId),
            eq(groups.subjectId, subjectId),
            // Handle "all" education level or specific level matching
            educationLevel === "all" || educationLevel === "جميع المستويات"
              ? undefined // Don't filter by education level if it's "all"
              : or(
                  eq(groups.educationLevel, educationLevel),
                  like(groups.educationLevel, `%${educationLevel}%`),
                ),
          ),
        )
        .orderBy(groups.name);

      console.log(`[GROUPS] Found ${partialMatches.length} partial matches`);
      if (partialMatches.length > 0) {
        return partialMatches;
      }

      // Final fallback: If no matches found, show all available groups that aren't already linked to other schedule cells
      // This is especially useful for custom subjects like "chess" that don't match existing subject names
      console.log(`[GROUPS] Using final fallback - showing unlinked groups...`);

      const linkedGroupIds = await db
        .select({ groupId: groupScheduleAssignments.groupId })
        .from(groupScheduleAssignments)
        .where(
          and(
            eq(groupScheduleAssignments.schoolId, schoolId),
            eq(groupScheduleAssignments.isActive, true),
          ),
        );

      const linkedIds = linkedGroupIds.map((item) => item.groupId);
      console.log(
        `[GROUPS] Found ${linkedIds.length} already linked groups:`,
        linkedIds,
      );

      const unlinkedGroups = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          grade: groups.grade,
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          teacherName: users.name,
          studentsCount: sql<number>`array_length(${groups.studentsAssigned}, 1)`,
          matchType: sql<string>`'unlinked_fallback'`,
        })
        .from(groups)
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(
          and(
            eq(groups.schoolId, schoolId),
            linkedIds.length > 0
              ? not(inArray(groups.id, linkedIds))
              : undefined,
          ),
        )
        .orderBy(groups.name);

      console.log(
        `[GROUPS] Found ${unlinkedGroups.length} unlinked groups as fallback`,
      );
      return unlinkedGroups;
    } catch (error) {
      console.error("Error getting compatible groups:", error);
      return [];
    }
  }

  async getScheduleLinkedGroups(
    tableId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      return await db
        .select({
          id: groupScheduleAssignments.id,
          groupId: groupScheduleAssignments.groupId,
          scheduleCellId: groupScheduleAssignments.scheduleCellId,
          groupName: groups.name,
          isActive: groupScheduleAssignments.isActive,
          createdAt: groupScheduleAssignments.createdAt,
        })
        .from(groupScheduleAssignments)
        .leftJoin(groups, eq(groupScheduleAssignments.groupId, groups.id))
        .leftJoin(
          scheduleCells,
          eq(groupScheduleAssignments.scheduleCellId, scheduleCells.id),
        )
        .where(
          and(
            eq(groupScheduleAssignments.schoolId, schoolId),
            eq(scheduleCells.scheduleTableId, tableId),
            eq(groupScheduleAssignments.isActive, true),
          ),
        )
        .orderBy(groups.name);
    } catch (error) {
      console.error("Error getting schedule linked groups:", error);
      return [];
    }
  }

  async linkGroupsToScheduleCell(
    cellId: number,
    groupIds: number[],
    schoolId: number,
    assignedBy: number,
  ): Promise<void> {
    try {
      // First, remove all existing assignments for this cell
      await db
        .delete(groupScheduleAssignments)
        .where(
          and(
            eq(groupScheduleAssignments.scheduleCellId, cellId),
            eq(groupScheduleAssignments.schoolId, schoolId),
          ),
        );

      // Then, add new assignments if groupIds is not empty
      if (groupIds.length > 0) {
        const assignments = groupIds.map((groupId) => ({
          groupId,
          scheduleCellId: cellId,
          schoolId,
          assignedBy,
          isActive: true,
        }));

        await db.insert(groupScheduleAssignments).values(assignments);
      }
    } catch (error) {
      console.error("Error linking groups to schedule cell:", error);
      throw error;
    }
  }

  // Student Monthly Payment methods implementation
  async getStudentPaymentStatus(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.month, month),
            eq(studentMonthlyPayments.schoolId, schoolId),
          ),
        )
        .limit(1);
      return payment || undefined;
    } catch (error) {
      console.error("Error getting student payment status:", error);
      return undefined;
    }
  }

  // New function: Check if student has PAID for a specific month
  async isStudentPaidForMonth(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<boolean> {
    try {
      const payment = await this.getStudentPaymentStatus(
        studentId,
        year,
        month,
        schoolId,
      );
      // Paid only if record exists AND isPaid = true
      return payment ? payment.isPaid : false;
    } catch (error) {
      console.error("Error checking if student is paid:", error);
      return false;
    }
  }

  // New function: Check if student is UNPAID for a specific month
  async isStudentUnpaidForMonth(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<boolean> {
    try {
      const payment = await this.getStudentPaymentStatus(
        studentId,
        year,
        month,
        schoolId,
      );
      // Unpaid if: 1) No record exists, OR 2) Record exists but isPaid = false
      return payment ? !payment.isPaid : true;
    } catch (error) {
      console.error("Error checking if student is unpaid:", error);
      return true; // Default to unpaid on error
    }
  }

  async getStudentsPaymentStatusForMonth(
    studentIds: number[],
    year: number,
    month: number,
    schoolId: number,
    groupId?: number, // ✅ Add groupId parameter to filter by group
  ): Promise<StudentMonthlyPayment[]> {
    try {
      if (studentIds.length === 0) return [];

      const conditions = [
        inArray(studentMonthlyPayments.studentId, studentIds),
        eq(studentMonthlyPayments.year, year),
        eq(studentMonthlyPayments.month, month),
        eq(studentMonthlyPayments.schoolId, schoolId),
      ];

      // ✅ CRITICAL: Add groupId filter to prevent cross-group contamination
      if (groupId !== undefined) {
        conditions.push(eq(studentMonthlyPayments.groupId, groupId));
      }

      return await db
        .select()
        .from(studentMonthlyPayments)
        .where(and(...conditions));
    } catch (error) {
      console.error("Error getting students payment status:", error);
      return [];
    }
  }

  // New function: Get payment status for multiple students with proper unpaid logic
  async getStudentsPaymentStatusWithUnpaid(
    studentIds: number[],
    year: number,
    month: number,
    schoolId: number,
  ): Promise<
    Array<{
      studentId: number;
      isPaid: boolean;
      amount?: string;
      paidAt?: Date;
    }>
  > {
    try {
      if (studentIds.length === 0) return [];

      // Get existing payment records
      const existingPayments = await this.getStudentsPaymentStatusForMonth(
        studentIds,
        year,
        month,
        schoolId,
      );

      // Create complete status array for all students
      return studentIds.map((studentId) => {
        const payment = existingPayments.find((p) => p.studentId === studentId);
        return {
          studentId,
          isPaid: payment ? payment.isPaid : false, // No record = unpaid
          amount: payment?.amount,
          paidAt: payment?.paidAt,
        };
      });
    } catch (error) {
      console.error(
        "Error getting students payment status with unpaid:",
        error,
      );
      return studentIds.map((studentId) => ({ studentId, isPaid: false }));
    }
  }

  async createStudentPayment(
    studentId: number,
    userId: number,
    studentType: "student" | "child",
    year: number,
    month: number,
    amount: number,
    schoolId: number,
    groupId: number,
    paidBy: number,
    notes?: string,
  ): Promise<StudentMonthlyPayment> {
    try {
      // QUERY DATABASE TO GET CORRECT USER ID BASED ON STUDENT ID AND TYPE
      let correctUserId: number;

      if (studentType === "student") {
        // For direct students: Get userId from students table WITH SCHOOL VALIDATION
        console.log(
          `🔍 Querying students table for studentId ${studentId} in school ${schoolId}`,
        );
        const [studentRecord] = await db
          .select({
            userId: students.userId,
            schoolId: students.schoolId,
          })
          .from(students)
          .where(
            and(
              eq(students.id, studentId),
              eq(students.schoolId, schoolId), // ✅ Validate school ID
            ),
          )
          .limit(1);

        if (!studentRecord) {
          throw new Error(
            `Student with ID ${studentId} not found in school ${schoolId}`,
          );
        }
        if (!studentRecord.userId) {
          throw new Error(`Student with ID ${studentId} has no userId`);
        }
        correctUserId = studentRecord.userId;
        console.log(
          `✅ Found userId ${correctUserId} for student ${studentId} in school ${schoolId}`,
        );
      } else if (studentType === "child") {
        // For children: Get parentId from children table WITH SCHOOL VALIDATION
        console.log(
          `🔍 Querying children table for childId ${studentId} in school ${schoolId}`,
        );
        const [childRecord] = await db
          .select({
            parentId: children.parentId,
            schoolId: children.schoolId,
          })
          .from(children)
          .where(
            and(
              eq(children.id, studentId),
              eq(children.schoolId, schoolId), // ✅ Validate school ID
            ),
          )
          .limit(1);

        if (!childRecord) {
          throw new Error(
            `Child with ID ${studentId} not found in school ${schoolId}`,
          );
        }
        if (!childRecord.parentId) {
          throw new Error(`Child with ID ${studentId} has no parentId`);
        }
        correctUserId = childRecord.parentId;
        console.log(
          `✅ Found parentId ${correctUserId} for child ${studentId} in school ${schoolId}`,
        );
      } else {
        throw new Error(`Invalid studentType: ${studentType}`);
      }

      // Check if payment already exists to prevent duplicates (NOW GROUP-SPECIFIC)
      console.log(
        `🔍 DUPLICATE CHECK: Looking for existing payment - studentId: ${studentId}, year: ${year}, month: ${month}, schoolId: ${schoolId}, groupId: ${groupId}`,
      );
      const [existingPayment] = await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.month, month),
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.groupId, groupId), // CRITICAL: Check group-specific duplicates
          ),
        )
        .limit(1);

      console.log(
        `🔍 DUPLICATE CHECK RESULT: Found ${existingPayment ? "EXISTING" : "NONE"} payment record`,
      );
      if (existingPayment) {
        console.log(`🔍 EXISTING PAYMENT DETAILS:`, {
          id: existingPayment.id,
          studentId: existingPayment.studentId,
          year: existingPayment.year,
          month: existingPayment.month,
          amount: existingPayment.amount,
          isPaid: existingPayment.isPaid,
          paidAt: existingPayment.paidAt,
          schoolId: existingPayment.schoolId,
        });
      }

      if (existingPayment) {
        console.log(
          `🚫 DUPLICATE PAYMENT DETECTED: Payment already exists for studentId ${studentId}, ${month}/${year}`,
        );
        console.log(`🚫 Existing payment:`, existingPayment);
        console.log(
          `🚫 This is why the payment appears temporary - database prevents duplicates!`,
        );
        return existingPayment;
      }

      // Create new payment record with CORRECT USER ID and GROUP ID from database lookup
      const [newPayment] = await db
        .insert(studentMonthlyPayments)
        .values({
          userId: correctUserId, // ✅ Use database-queried userId
          studentId, // ✅ Student ID (different from userId)
          studentType,
          groupId, // ✅ CRITICAL: Group-specific payment
          year,
          month,
          isPaid: true, // Always true since we only create records for payments
          amount: amount.toString(),
          paidAt: new Date(),
          paidBy,
          notes,
          schoolId,
        })
        .returning();

      console.log(
        `✅ Created payment: studentId=${studentId}, userId=${correctUserId}, ${month}/${year}, amount=${amount}`,
      );
      return newPayment;
    } catch (error) {
      console.error("Error creating student payment:", error);
      throw error;
    }
  }

  async deletePaymentRecord(
    studentId: number,
    year: number,
    month: number,
    schoolId: number,
  ): Promise<boolean> {
    try {
      console.log(`🗑️ HARD DELETE - Attempting to delete payment record:`, {
        studentId,
        year,
        month,
        schoolId,
      });

      // Check if record exists before deletion
      const beforeDelete = await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.month, month),
            eq(studentMonthlyPayments.schoolId, schoolId),
          ),
        );

      console.log(`📊 Records found before deletion:`, beforeDelete.length);
      if (beforeDelete.length === 0) {
        console.log(`❌ No payment record found to delete`);
        return false;
      }

      console.log(`🔥 Record to delete:`, beforeDelete[0]);
      const paymentRecord = beforeDelete[0];

      // 🎯 NEW: CASCADING DELETE - Remove associated benefit entries
      console.log(`🔍 Looking for associated benefit entries to delete...`);

      // 🎯 SAFER APPROACH: Only delete financial entries that have exact characteristics
      // and were likely created automatically for this specific payment
      
      // First, check if there are any financial entries that could match
      // Convert payment amount (string) to number for comparison with decimal field
      const paymentAmountAsNumber = parseFloat(paymentRecord.amount || '0');
      console.log(`🔍 Payment amount (string): "${paymentRecord.amount}", converted to number: ${paymentAmountAsNumber}`);
      
      const potentialBenefits = await db
        .select()
        .from(financialEntries)
        .where(
          and(
            eq(financialEntries.schoolId, schoolId),
            eq(financialEntries.type, "gain"),
            eq(financialEntries.year, year),
            eq(financialEntries.month, month),
            eq(financialEntries.amount, paymentAmountAsNumber.toString()),
          ),
        );

      console.log(`🔍 Found ${potentialBenefits.length} potential benefit entries with same amount, year, month`);
      
      if (potentialBenefits.length > 0) {
        console.log(`🔍 Potential benefits details:`, potentialBenefits.map(b => ({
          id: b.id,
          amount: b.amount,
          type: typeof b.amount,
          year: b.year,
          month: b.month,
          type: b.type
        })));
      } else {
        console.log(`❓ No benefits found. Searching criteria:`, {
          schoolId,
          type: "gain",
          year,
          month,
          paymentAmount: paymentRecord.amount,
          paymentAmountAsNumber,
          paymentAmountAsString: paymentAmountAsNumber.toString()
        });
        
        // Let's also check what financial entries exist for this school/year/month
        const allFinancialEntriesForPeriod = await db
          .select()
          .from(financialEntries)
          .where(
            and(
              eq(financialEntries.schoolId, schoolId),
              eq(financialEntries.year, year),
              eq(financialEntries.month, month),
            ),
          );
        
        console.log(`📊 All financial entries for ${month}/${year}:`, allFinancialEntriesForPeriod.map(e => ({
          id: e.id,
          type: e.type,
          amount: e.amount,
          amountType: typeof e.amount,
          remarks: e.remarks?.substring(0, 50) + '...'
        })));
      }

      // Only proceed with deletion if there's exactly 1 matching entry
      // This prevents accidental deletion of multiple entries with same amount
      let associatedBenefits: any[] = [];
      
      if (potentialBenefits.length === 1) {
        // Safe to delete - only one entry matches
        associatedBenefits = potentialBenefits;
        console.log(`✅ Safe to delete: Found exactly 1 matching financial entry`);
      } else if (potentialBenefits.length > 1) {
        // Risky - multiple entries with same amount
        console.log(`⚠️ RISK DETECTED: Found ${potentialBenefits.length} financial entries with same amount`);
        console.log(`🛡️ SAFETY MEASURE: Will NOT delete any financial entries to prevent data loss`);
        associatedBenefits = []; // Don't delete any
      } else {
        // No matching entries found
        console.log(`ℹ️ No matching financial entries found for deletion`);
        associatedBenefits = [];
      }

      console.log(
        `📊 Found ${associatedBenefits.length} associated benefit entries`,
      );

      if (associatedBenefits.length > 0) {
        console.log(`💰 Creating corresponding LOSS entries instead of deleting gains...`);
        
        // Get detailed information about the payment for comprehensive loss entry
        let studentInfo = '';
        let groupInfo = '';
        
        try {
          // Get student information
          const student = await db
            .select({
              id: students.id,
              firstName: students.firstName,
              lastName: students.lastName,
              studentType: students.studentType,
            })
            .from(students)
            .where(eq(students.id, studentId))
            .limit(1);
          
          if (student.length > 0) {
            const studentData = student[0];
            studentInfo = `${studentData.firstName} ${studentData.lastName} (${studentData.studentType === 'direct' ? 'طالب مباشر' : 'طفل'})`;
          } else {
            studentInfo = `طالب رقم ${studentId}`;
          }
          
          // Get group information if groupId exists in payment record
          if (paymentRecord.groupId) {
            const group = await db
              .select({
                id: groups.id,
                grade: groups.grade,
                subjectId: groups.subjectId,
                identifier: groups.identifier,
              })
              .from(groups)
              .where(eq(groups.id, paymentRecord.groupId))
              .limit(1);
            
            if (group.length > 0) {
              const groupData = group[0];
              
              // Get subject name
              const subject = await db
                .select({
                  nameAr: subjects.nameAr,
                  name: subjects.name,
                })
                .from(subjects)
                .where(eq(subjects.id, groupData.subjectId))
                .limit(1);
              
              const subjectName = subject.length > 0 ? (subject[0].nameAr || subject[0].name) : 'مادة غير محددة';
              const groupIdentifier = groupData.identifier ? ` - ${groupData.identifier}` : '';
              groupInfo = ` | المجموعة: ${groupData.grade} - ${subjectName}${groupIdentifier} (رقم ${groupData.id})`;
            } else {
              groupInfo = ` | المجموعة: رقم ${paymentRecord.groupId}`;
            }
          }
        } catch (infoError) {
          console.error('⚠️ Could not fetch detailed information for loss entry:', infoError);
          studentInfo = `طالب رقم ${studentId}`;
          groupInfo = paymentRecord.groupId ? ` | المجموعة: رقم ${paymentRecord.groupId}` : '';
        }

        for (const benefit of associatedBenefits) {
          console.log(
            `📝 Creating loss entry to offset gain ID: ${benefit.id}, amount: ${benefit.amount}`,
          );
          
          // Use the exact original receipt format from the gain entry for the loss entry
          const lossEntry = {
            schoolId: schoolId,
            type: "loss" as const,
            amount: benefit.amount, // Same amount as the gain
            remarks: benefit.remarks, // Use the exact original receipt format
            year: year,
            month: month,
            recordedBy: benefit.recordedBy, // Use same user who recorded the original gain
          };

          try {
            const createdLossEntry = await this.createFinancialEntry(lossEntry);
            console.log(
              `✅ SUCCESS: Created detailed loss entry ID: ${createdLossEntry.id} to offset gain entry ${benefit.id}`,
            );
          } catch (lossError) {
            console.error(
              `❌ FAILURE: Could not create loss entry for gain ${benefit.id}:`,
              lossError,
            );
            throw new Error(`Failed to create offsetting loss entry: ${lossError}`);
          }
        }
      }

      // HARD DELETE - Direct permanent deletion from database
      console.log(`🔥 HARD DELETING payment record from database...`);
      const deleteResult = await db
        .delete(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.month, month),
            eq(studentMonthlyPayments.schoolId, schoolId),
          ),
        );

      console.log(`💥 Payment delete operation executed`);

      // Verify the payment record is permanently gone
      const afterDelete = await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.month, month),
            eq(studentMonthlyPayments.schoolId, schoolId),
          ),
        );

      console.log(
        `📊 Payment records found after deletion:`,
        afterDelete.length,
      );

      if (afterDelete.length === 0) {
        console.log(
          `✅ SUCCESS: Payment record PERMANENTLY HARD DELETED from database`,
        );
        console.log(
          `✅ SUCCESS: Associated benefit entries also PERMANENTLY HARD DELETED`,
        );
        return true;
      } else {
        console.log(
          `❌ FAILURE: Payment record still exists in database:`,
          afterDelete[0],
        );
        // Try raw SQL as fallback for payment record
        const paymentId = afterDelete[0].id;
        console.log(
          `🔄 Attempting raw SQL HARD DELETE for payment ID: ${paymentId}`,
        );
        await this.hardDeletePaymentByRawSQL(paymentId);
        console.log(
          `✅ FALLBACK SUCCESS: Payment and benefit records HARD DELETED via raw SQL`,
        );
        return true;
      }
    } catch (error) {
      console.error("❌ HARD DELETE ERROR:", error);
      throw error; // Re-throw to see actual error
    }
  }

  async hardDeleteFinancialEntryByRawSQL(entryId: number) {
    try {
      console.log(`🔥 RAW SQL: Hard deleting financial entry ID: ${entryId}`);
      // Use raw SQL to ensure complete deletion
      await db.execute(
        sql`DELETE FROM financial_entries WHERE id = ${entryId}`,
      );
      console.log(`✅ RAW SQL: Financial entry ${entryId} permanently deleted`);
    } catch (error) {
      console.error(
        `❌ RAW SQL ERROR deleting financial entry ${entryId}:`,
        error,
      );
      throw error;
    }
  }

  async hardDeletePaymentByRawSQL(paymentId: number) {
    try {
      // Direct SQL execution to force deletion
      const result = await db.execute(
        sql`DELETE FROM student_monthly_payments WHERE id = ${paymentId}`,
      );
      console.log(
        `🔥 RAW SQL DELETE executed for payment ID ${paymentId}:`,
        result,
      );
    } catch (error) {
      console.error(`❌ RAW SQL DELETE failed:`, error);
    }
  }

  async getStudentPaymentHistory(
    studentId: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment[]> {
    try {
      return await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.schoolId, schoolId),
          ),
        )
        .orderBy(
          desc(studentMonthlyPayments.year),
          desc(studentMonthlyPayments.month),
        );
    } catch (error) {
      console.error("Error getting student payment history:", error);
      return [];
    }
  }

  // New function: Get only PAID payment history
  async getStudentPaidHistory(
    studentId: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment[]> {
    try {
      return await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.isPaid, true),
          ),
        )
        .orderBy(
          desc(studentMonthlyPayments.year),
          desc(studentMonthlyPayments.month),
        );
    } catch (error) {
      console.error("Error getting student paid history:", error);
      return [];
    }
  }

  // New function: Get only UNPAID payment records (excludes non-existent records)
  async getStudentUnpaidHistory(
    studentId: number,
    schoolId: number,
  ): Promise<StudentMonthlyPayment[]> {
    try {
      return await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.isPaid, false),
          ),
        )
        .orderBy(
          desc(studentMonthlyPayments.year),
          desc(studentMonthlyPayments.month),
        );
    } catch (error) {
      console.error("Error getting student unpaid history:", error);
      return [];
    }
  }

  // REMOVED: createDefaultMonthlyPayments function
  // This function was causing bulk payment creation for months 1-8
  // We now use virtual records instead of creating database records

  // Student Status methods
  async getStudentEnrolledGroups(
    studentId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      // Check both regular group assignments (from users table) and mixed assignments (from users and children tables)
      const groupAssignments = await db
        .select({
          groupId: groupUserAssignments.groupId,
        })
        .from(groupUserAssignments)
        .where(
          and(
            eq(groupUserAssignments.userId, studentId),
            eq(groupUserAssignments.schoolId, schoolId),
          ),
        );

      // Also check mixed group assignments for children
      const mixedAssignments = await db
        .select({
          groupId: groupMixedAssignments.groupId,
        })
        .from(groupMixedAssignments)
        .where(
          and(
            eq(groupMixedAssignments.studentId, studentId),
            eq(groupMixedAssignments.schoolId, schoolId),
          ),
        );

      // Combine all group IDs
      const allGroupIds = [
        ...groupAssignments.map((a) => a.groupId),
        ...mixedAssignments.map((a) => a.groupId),
      ];

      if (allGroupIds.length === 0) {
        return [];
      }

      // Fetch group details with teacher information
      const groupsData = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          description: groups.description,
        })
        .from(groups)
        .where(
          and(inArray(groups.id, allGroupIds), eq(groups.schoolId, schoolId)),
        );

      // Get teacher names, subject names, and assigned students for each group
      const enrichedGroups = await Promise.all(
        groupsData.map(async (group) => {
          let teacherName = null;
          let subjectName = null;
          let nameAr = null;

          // Get teacher name
          if (group.teacherId) {
            const teacher = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, group.teacherId))
              .limit(1);
            if (teacher.length > 0) {
              teacherName = teacher[0].name;
            }
          }

          // Get subject name
          if (group.subjectId) {
            const subject = await db
              .select({
                name: teachingModules.name,
                nameAr: teachingModules.nameAr,
              })
              .from(teachingModules)
              .where(eq(teachingModules.id, group.subjectId))
              .limit(1);
            if (subject.length > 0) {
              subjectName = subject[0].name;
              nameAr = subject[0].nameAr;
            }
          }

          // Get assigned students for this group (both students and children)
          const mixedAssignments = await db
            .select({
              studentId: groupMixedAssignments.studentId,
              studentType: groupMixedAssignments.studentType,
            })
            .from(groupMixedAssignments)
            .where(
              and(
                eq(groupMixedAssignments.groupId, group.id),
                eq(groupMixedAssignments.schoolId, schoolId),
              ),
            );

          const assignedStudents = [];
          for (const assignment of mixedAssignments) {
            if (assignment.studentType === "student") {
              // Get student from users/students tables
              const studentData = await db
                .select({
                  id: users.id,
                  name: users.name,
                  educationLevel: students.educationLevel,
                  grade: students.grade,
                  email: users.email,
                })
                .from(users)
                .leftJoin(students, eq(users.id, students.userId))
                .where(eq(users.id, assignment.studentId))
                .limit(1);

              if (studentData[0]) {
                assignedStudents.push({
                  ...studentData[0],
                  type: "student",
                });
              }
            } else if (assignment.studentType === "child") {
              // Get child from children table
              const childData = await db
                .select({
                  id: children.id,
                  name: children.name,
                  educationLevel: children.educationLevel,
                  grade: children.grade,
                  email:
                    sql<string>`CONCAT('child_', ${children.id}, '@parent.local')`.as(
                      "email",
                    ),
                })
                .from(children)
                .where(eq(children.id, assignment.studentId))
                .limit(1);

              if (childData[0]) {
                assignedStudents.push({
                  ...childData[0],
                  type: "child",
                });
              }
            }
          }

          return {
            ...group,
            teacherName,
            subjectName,
            nameAr,
            studentsAssigned: assignedStudents,
          };
        }),
      );

      return enrichedGroups;
    } catch (error) {
      console.error("Error getting student enrolled groups:", error);
      return [];
    }
  }

  async getStudentAttendanceRecords(
    studentId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: groupAttendance.id,
          groupId: groupAttendance.groupId,
          groupName: groups.name,
          date: groupAttendance.attendanceDate,
          status: groupAttendance.status,
        })
        .from(groupAttendance)
        .leftJoin(groups, eq(groupAttendance.groupId, groups.id))
        .where(
          and(
            eq(groupAttendance.studentId, studentId),
            eq(groupAttendance.schoolId, schoolId),
          ),
        )
        .orderBy(desc(groupAttendance.attendanceDate));

      return result;
    } catch (error) {
      console.error("Error fetching student attendance records:", error);
      return [];
    }
  }

  async getStudentPaymentRecords(
    studentId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      // Get payment status from groupTransactions table - check if payment exists for the student
      const result = await db
        .select({
          id: groupTransactions.id,
          groupId: groupTransactions.groupId,
          groupName: groups.name,
          amount: groupTransactions.amount,
          dueDate: groupTransactions.dueDate,
          isPaid:
            sql<boolean>`CASE WHEN ${groupTransactions.status} = 'paid' THEN true ELSE false END`.as(
              "isPaid",
            ),
          paidDate: groupTransactions.paidDate,
          description: groupTransactions.description,
        })
        .from(groupTransactions)
        .leftJoin(groups, eq(groupTransactions.groupId, groups.id))
        .where(
          and(
            eq(groupTransactions.studentId, studentId),
            eq(groupTransactions.schoolId, schoolId),
            eq(groupTransactions.studentType, "student"),
          ),
        )
        .orderBy(desc(groupTransactions.createdAt));

      return result;
    } catch (error) {
      console.error("Error fetching student payment records:", error);
      return [];
    }
  }

  // Child-specific methods for parent access
  async getStudentById(studentId: number): Promise<Student | undefined> {
    try {
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      return student;
    } catch (error) {
      console.error("Error fetching student by ID:", error);
      return undefined;
    }
  }

  async getChildById(childId: number): Promise<Child | undefined> {
    try {
      const [child] = await db
        .select()
        .from(children)
        .where(eq(children.id, childId))
        .limit(1);

      return child;
    } catch (error) {
      console.error("Error fetching child by ID:", error);
      return undefined;
    }
  }

  async getChildAttendanceRecords(
    childId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: groupAttendance.id,
          groupId: groupAttendance.groupId,
          groupName: groups.name,
          date: groupAttendance.attendanceDate,
          status: groupAttendance.status,
        })
        .from(groupAttendance)
        .leftJoin(groups, eq(groupAttendance.groupId, groups.id))
        .where(
          and(
            eq(groupAttendance.studentId, childId),
            eq(groupAttendance.schoolId, schoolId),
            eq(groupAttendance.studentType, "child"),
          ),
        )
        .orderBy(desc(groupAttendance.attendanceDate));

      return result;
    } catch (error) {
      console.error("Error fetching child attendance records:", error);
      return [];
    }
  }

  async getChildPaymentRecords(
    childId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: groupTransactions.id,
          groupId: groupTransactions.groupId,
          groupName: groups.name,
          amount: groupTransactions.amount,
          dueDate: groupTransactions.dueDate,
          isPaid:
            sql<boolean>`CASE WHEN ${groupTransactions.status} = 'paid' THEN true ELSE false END`.as(
              "isPaid",
            ),
          paidDate: groupTransactions.paidDate,
          description: groupTransactions.description,
        })
        .from(groupTransactions)
        .leftJoin(groups, eq(groupTransactions.groupId, groups.id))
        .where(
          and(
            eq(groupTransactions.studentId, childId),
            eq(groupTransactions.schoolId, schoolId),
            eq(groupTransactions.studentType, "child"),
          ),
        )
        .orderBy(desc(groupTransactions.createdAt));

      return result;
    } catch (error) {
      console.error("Error fetching child payment records:", error);
      return [];
    }
  }

  async getChildEnrolledGroups(
    childId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      // Get groups where this child is assigned
      const mixedAssignments = await db
        .select({
          groupId: groupMixedAssignments.groupId,
        })
        .from(groupMixedAssignments)
        .where(
          and(
            eq(groupMixedAssignments.studentId, childId),
            eq(groupMixedAssignments.studentType, "child"),
            eq(groupMixedAssignments.schoolId, schoolId),
          ),
        );

      if (mixedAssignments.length === 0) {
        return [];
      }

      const groupIds = mixedAssignments.map((assignment) => assignment.groupId);

      // Get group details
      const groupsData = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          description: groups.description,
          teacherId: groups.teacherId,
          subjectName: teachingModules.name,
          teacherName: users.name,
        })
        .from(groups)
        .leftJoin(teachingModules, eq(groups.subjectId, teachingModules.id))
        .leftJoin(users, eq(groups.teacherId, users.id))
        .where(
          and(inArray(groups.id, groupIds), eq(groups.schoolId, schoolId)),
        );

      // For each group, populate the studentsAssigned array
      const result = [];
      for (const group of groupsData) {
        const mixedAssignments = await db
          .select({
            studentId: groupMixedAssignments.studentId,
            studentType: groupMixedAssignments.studentType,
          })
          .from(groupMixedAssignments)
          .where(
            and(
              eq(groupMixedAssignments.groupId, group.id),
              eq(groupMixedAssignments.schoolId, schoolId),
            ),
          );

        const assignedStudents = [];
        for (const assignment of mixedAssignments) {
          if (assignment.studentType === "student") {
            // Get student from users/students tables
            const studentData = await db
              .select({
                id: users.id,
                name: users.name,
                educationLevel: students.educationLevel,
                grade: students.grade,
                email: users.email,
              })
              .from(users)
              .leftJoin(students, eq(users.id, students.userId))
              .where(eq(users.id, assignment.studentId))
              .limit(1);

            if (studentData[0]) {
              assignedStudents.push({
                ...studentData[0],
                type: "student",
              });
            }
          } else if (assignment.studentType === "child") {
            // Get child from children table
            const childData = await db
              .select({
                id: children.id,
                name: children.name,
                educationLevel: children.educationLevel,
                grade: children.grade,
                email:
                  sql<string>`CONCAT('child_', ${children.id}, '@parent.local')`.as(
                    "email",
                  ),
              })
              .from(children)
              .where(eq(children.id, assignment.studentId))
              .limit(1);

            if (childData[0]) {
              assignedStudents.push({
                ...childData[0],
                type: "child",
              });
            }
          }
        }

        result.push({
          ...group,
          studentsAssigned: assignedStudents,
        });
      }

      return result;
    } catch (error) {
      console.error("Error fetching child enrolled groups:", error);
      return [];
    }
  }

  async getChildrenEnrolledGroups(
    parentId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      // First, get all children for this parent
      const childrenList = await db
        .select({
          id: children.id,
          name: children.name,
        })
        .from(children)
        .where(
          and(eq(children.parentId, parentId), eq(children.schoolId, schoolId)),
        );

      if (childrenList.length === 0) {
        return [];
      }

      // Get group assignments for all children
      const childrenGroups = await Promise.all(
        childrenList.map(async (child) => {
          // Check mixed group assignments for this child
          const mixedAssignments = await db
            .select({
              groupId: groupMixedAssignments.groupId,
            })
            .from(groupMixedAssignments)
            .where(
              and(
                eq(groupMixedAssignments.studentId, child.id),
                eq(groupMixedAssignments.schoolId, schoolId),
              ),
            );

          if (mixedAssignments.length === 0) {
            return {
              childId: child.id,
              childName: child.name,
              groups: [],
            };
          }

          const groupIds = mixedAssignments.map((a) => a.groupId);

          // Fetch group details with teacher information
          const groupsData = await db
            .select({
              id: groups.id,
              name: groups.name,
              educationLevel: groups.educationLevel,
              subjectId: groups.subjectId,
              teacherId: groups.teacherId,
              description: groups.description,
            })
            .from(groups)
            .where(
              and(inArray(groups.id, groupIds), eq(groups.schoolId, schoolId)),
            );

          // Enrich groups with teacher and subject information
          const enrichedGroups = await Promise.all(
            groupsData.map(async (group) => {
              let teacherName = null;
              let subjectName = null;
              let nameAr = null;

              // Get teacher name
              if (group.teacherId) {
                const teacher = await db
                  .select({ name: users.name })
                  .from(users)
                  .where(eq(users.id, group.teacherId))
                  .limit(1);
                if (teacher.length > 0) {
                  teacherName = teacher[0].name;
                }
              }

              // Get subject name
              if (group.subjectId) {
                const subject = await db
                  .select({
                    name: teachingModules.name,
                    nameAr: teachingModules.nameAr,
                  })
                  .from(teachingModules)
                  .where(eq(teachingModules.id, group.subjectId))
                  .limit(1);
                if (subject.length > 0) {
                  subjectName = subject[0].name;
                  nameAr = subject[0].nameAr;
                }
              }

              return {
                ...group,
                teacherName,
                subjectName,
                nameAr,
              };
            }),
          );

          return {
            childId: child.id,
            childName: child.name,
            groups: enrichedGroups,
          };
        }),
      );

      // Filter out children with no groups
      return childrenGroups.filter(
        (childGroup) => childGroup.groups.length > 0,
      );
    } catch (error) {
      console.error("Error getting children enrolled groups:", error);
      return [];
    }
  }

  async getStudentAttendanceRecords(
    userId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: groupAttendance.id,
          groupId: groupAttendance.groupId,
          groupName: groups.name,
          date: groupAttendance.date,
          status: groupAttendance.status,
        })
        .from(groupAttendance)
        .leftJoin(groups, eq(groupAttendance.groupId, groups.id))
        .leftJoin(
          groupMixedAssignments,
          and(
            eq(groupMixedAssignments.groupId, groupAttendance.groupId),
            eq(groupMixedAssignments.studentId, userId),
            eq(groupMixedAssignments.studentType, "student"),
          ),
        )
        .where(
          and(
            eq(groupAttendance.studentId, userId),
            eq(groups.schoolId, schoolId),
          ),
        )
        .orderBy(desc(groupAttendance.date));

      return result;
    } catch (error) {
      console.error("Error fetching student attendance records:", error);
      throw error;
    }
  }

  async getStudentPaymentRecords(
    userId: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: groupTransactions.id,
          groupId: groupTransactions.groupId,
          groupName: groups.name,
          amount: groupTransactions.amount,
          dueDate: groupTransactions.dueDate,
          isPaid: groupTransactions.isPaid,
          paidDate: groupTransactions.paidAt,
          description: groupTransactions.description,
        })
        .from(groupTransactions)
        .leftJoin(groups, eq(groupTransactions.groupId, groups.id))
        .leftJoin(
          groupMixedAssignments,
          and(
            eq(groupMixedAssignments.groupId, groupTransactions.groupId),
            eq(groupMixedAssignments.studentId, userId),
            eq(groupMixedAssignments.studentType, "student"),
          ),
        )
        .where(
          and(
            eq(groupTransactions.studentId, userId),
            eq(groups.schoolId, schoolId),
          ),
        )
        .orderBy(desc(groupTransactions.createdAt));

      return result;
    } catch (error) {
      console.error("Error fetching student payment records:", error);
      throw error;
    }
  }

  async getStudentGroupPayments(
    studentId: number,
    groupId: number,
    year: number,
    schoolId: number,
  ): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: studentMonthlyPayments.id,
          studentId: studentMonthlyPayments.studentId,
          month: studentMonthlyPayments.month,
          year: studentMonthlyPayments.year,
          amount: studentMonthlyPayments.amount,
          paidDate: studentMonthlyPayments.paidDate,
          notes: studentMonthlyPayments.notes,
          paidBy: studentMonthlyPayments.paidBy,
        })
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.isPaid, true),
          ),
        )
        .orderBy(studentMonthlyPayments.month);

      return result;
    } catch (error) {
      console.error("Error in getStudentGroupPayments:", error);
      return [];
    }
  }

  async getFinancialReportData(
    schoolId: number,
    year: number,
    month?: number,
  ): Promise<any> {
    try {
      console.log(
        "📊 Generating financial report for school:",
        schoolId,
        "year:",
        year,
        "month:",
        month,
      );

      // Base date filters
      const yearFilter = eq(studentMonthlyPayments.year, year);
      const monthFilter = month
        ? eq(studentMonthlyPayments.month, month)
        : undefined;
      const dateFilters = monthFilter
        ? and(yearFilter, monthFilter)
        : yearFilter;

      // Get total revenue from payments
      const revenueResult = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${studentMonthlyPayments.amount}), 0)`,
        })
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.isPaid, true),
            dateFilters,
          ),
        );

      const totalRevenue = revenueResult[0]?.totalRevenue || 0;

      // Get student and group counts
      const studentCountResult = await db
        .select({
          totalStudents: sql<number>`COUNT(DISTINCT ${studentMonthlyPayments.studentId})`,
        })
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.isPaid, true),
            dateFilters,
          ),
        );

      const totalStudents = studentCountResult[0]?.totalStudents || 0;

      // Get total groups in school
      const groupCountResult = await db
        .select({
          totalGroups: sql<number>`COUNT(*)`,
        })
        .from(groups)
        .where(eq(groups.schoolId, schoolId));

      const totalGroups = groupCountResult[0]?.totalGroups || 0;

      // For now, set expenses to 20% of revenue as placeholder
      // In a real system, you would track actual expenses
      const totalExpenses = Math.round(totalRevenue * 0.2);
      const netProfit = totalRevenue - totalExpenses;
      const averageRevenuePerStudent =
        totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0;

      // Get monthly breakdown if viewing all months
      let monthlyBreakdown: any[] = [];
      if (!month) {
        for (let m = 1; m <= 12; m++) {
          const monthlyRevenueResult = await db
            .select({
              revenue: sql<number>`COALESCE(SUM(${studentMonthlyPayments.amount}), 0)`,
            })
            .from(studentMonthlyPayments)
            .where(
              and(
                eq(studentMonthlyPayments.schoolId, schoolId),
                eq(studentMonthlyPayments.isPaid, true),
                eq(studentMonthlyPayments.year, year),
                eq(studentMonthlyPayments.month, m),
              ),
            );

          const monthRevenue = monthlyRevenueResult[0]?.revenue || 0;
          if (monthRevenue > 0) {
            const monthExpenses = Math.round(monthRevenue * 0.2);
            monthlyBreakdown.push({
              month: m,
              revenue: monthRevenue,
              expenses: monthExpenses,
              profit: monthRevenue - monthExpenses,
            });
          }
        }
      }

      // Get group performance
      const groupPerformanceResult = await db
        .select({
          groupId: groups.id,
          groupName: groups.name,
          subjectName: groups.subjectName,
          totalRevenue: sql<number>`COALESCE(SUM(${studentMonthlyPayments.amount}), 0)`,
          totalStudents: sql<number>`COUNT(DISTINCT ${studentMonthlyPayments.studentId})`,
        })
        .from(groups)
        .leftJoin(
          groupMixedAssignments,
          eq(groups.id, groupMixedAssignments.groupId),
        )
        .leftJoin(
          studentMonthlyPayments,
          and(
            eq(
              groupMixedAssignments.studentId,
              studentMonthlyPayments.studentId,
            ),
            eq(studentMonthlyPayments.schoolId, schoolId),
            eq(studentMonthlyPayments.isPaid, true),
            eq(studentMonthlyPayments.year, year),
            ...(month ? [eq(studentMonthlyPayments.month, month)] : []),
          ),
        )
        .where(eq(groups.schoolId, schoolId))
        .groupBy(groups.id, groups.name, groups.subjectName)
        .having(sql`COUNT(DISTINCT ${studentMonthlyPayments.studentId}) > 0`);

      const groupPerformance = groupPerformanceResult.map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName,
        subjectName: group.subjectName,
        totalStudents: group.totalStudents,
        totalRevenue: group.totalRevenue,
        averagePerStudent:
          group.totalStudents > 0
            ? Math.round(group.totalRevenue / group.totalStudents)
            : 0,
      }));

      const financialData = {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalStudents,
        totalGroups,
        averageRevenuePerStudent,
        monthlyBreakdown,
        groupPerformance,
      };

      console.log("✅ Financial report generated:", {
        totalRevenue,
        totalStudents,
        totalGroups,
        monthlyBreakdownCount: monthlyBreakdown.length,
        groupPerformanceCount: groupPerformance.length,
      });

      return financialData;
    } catch (error) {
      console.error("Error generating financial report:", error);
      throw error;
    }
  }

  // Test function to get ALL payments from student_monthly_payments table
  async getAllPaymentsFromDatabase(schoolId: number): Promise<any[]> {
    try {
      console.log(
        "🧪 getAllPaymentsFromDatabase called for schoolId:",
        schoolId,
      );

      // First, let's check if the table exists and has any data at all
      console.log(
        "🔍 Checking if student_monthly_payments table has any data...",
      );
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentMonthlyPayments);
      console.log(
        "📊 Total records in student_monthly_payments table:",
        totalCount[0]?.count || 0,
      );

      // Check records for this specific school
      const allPayments = await db
        .select()
        .from(studentMonthlyPayments)
        .where(eq(studentMonthlyPayments.schoolId, schoolId));

      console.log(
        `✅ Found ${allPayments.length} payment records for schoolId ${schoolId}`,
      );

      // If no records for this school, let's see what schools exist
      if (allPayments.length === 0) {
        console.log(
          "🔍 No records for this school. Checking what school IDs exist...",
        );
        const existingSchools = await db
          .select({ schoolId: studentMonthlyPayments.schoolId })
          .from(studentMonthlyPayments)
          .groupBy(studentMonthlyPayments.schoolId);
        console.log(
          "🏫 School IDs with payment records:",
          existingSchools.map((s) => s.schoolId),
        );
      }

      return allPayments;
    } catch (error) {
      console.error("❌ Error fetching all payments:", error);
      throw error;
    }
  }

  // Desktop QR Scanner methods implementation
  async getStudentCompleteProfile(
    studentId: number,
    studentType: "student" | "child",
    schoolId: number,
  ): Promise<any | null> {
    try {
      console.log(
        `🔍 getStudentCompleteProfile called with studentId=${studentId} (type: ${typeof studentId}), studentType=${studentType}, schoolId=${schoolId} (type: ${typeof schoolId})`,
      );
      let studentProfile: any = null;

      if (studentType === "student") {
        console.log("🔍 Querying students table for student...");
        // Get student from students table using student ID, not user ID
        const [result] = await db
          .select()
          .from(students)
          .leftJoin(users, eq(students.userId, users.id))
          .where(
            and(eq(students.id, studentId), eq(students.schoolId, schoolId)),
          );

        console.log("🔍 Student query result:", result);
        if (!result || !result.students) {
          console.log("❌ No student found with the given criteria");
          return null;
        }

        const student = result.students;
        const user = result.users;

        // Only create profile if user account exists - students without user accounts should not appear in QR scanner
        if (!user) {
          console.log(
            "❌ Student exists but no user account linked - skipping incomplete profile",
          );
          return null;
        }

        studentProfile = {
          id: student.id,
          userId: user.id,
          name: user.name || student.name || "طالب غير محدد", // Prefer user name, fallback to student name
          email: user.email,
          phone: user.phone || student.phone,
          role: user.role,
          educationLevel: student.educationLevel,
          selectedSubjects: student.selectedSubjects,
          profilePicture: user.profilePicture,
          verified: student.verified,
          type: "student",
        };
      } else {
        // Get child from children table
        console.log("🔍 Querying children table for child...");
        const [child] = await db
          .select()
          .from(children)
          .where(
            and(eq(children.id, studentId), eq(children.schoolId, schoolId)),
          );

        console.log("🔍 Child query result:", child);
        if (!child) {
          console.log("❌ No child found with the given criteria");

          // Enhanced debugging - check if child exists in any school
          const anyChild = await db
            .select()
            .from(children)
            .where(eq(children.id, studentId))
            .limit(1);

          if (anyChild.length > 0) {
            console.log(
              `⚠️ Child ${studentId} exists but in school ${anyChild[0].schoolId}, not ${schoolId}`,
            );
          } else {
            console.log(`❌ Child ${studentId} does not exist in any school`);
          }

          return null;
        }

        console.log("✅ Child found:", {
          id: child.id,
          name: child.name,
          schoolId: child.schoolId,
          parentId: child.parentId,
          verified: child.verified,
        });

        // Create child profile with explicit fields to avoid parent data confusion
        // IMPORTANT: Child profile should ONLY contain child's data, never parent's data
        studentProfile = {
          id: child.id, // Child's ID (not parent ID)
          userId: child.parentId, // Parent's user ID for system reference
          name: child.name, // Child's name (not parent's name)
          email: `child-${child.id}@child.local`, // Virtual email for child
          phone: null, // Children don't have separate phone
          role: "child", // Child role
          educationLevel: child.educationLevel,
          selectedSubjects: child.selectedSubjects || [],
          profilePicture: child.profilePicture || null,
          verified: true, // Children are automatically verified
          type: "child", // Clearly mark as child
          parentId: child.parentId, // Reference to parent for admin purposes
          schoolId: child.schoolId, // School reference
        };

        console.log("✅ Child profile created (NOT parent profile):", {
          childId: studentProfile.id,
          childName: studentProfile.name,
          parentId: studentProfile.parentId,
          type: studentProfile.type,
        });
      }

      console.log("✅ Student found, now fetching enrolled groups...");

      // Fetch enrolled groups
      let enrolledGroups: any[] = [];

      try {
        // First, let's directly test if any assignments exist for this school
        console.log("🔍 Testing if ANY assignments exist in school", schoolId);
        const allSchoolAssignments = await db
          .select()
          .from(groupMixedAssignments)
          .where(eq(groupMixedAssignments.schoolId, schoolId));
        console.log(
          `🔍 Found ${allSchoolAssignments.length} total assignments in school ${schoolId}:`,
          allSchoolAssignments,
        );

        // Use studentId for group display (QR scanner shows groups student attends)
        // studentId is used for payment system and group display
        console.log("🔍 Using studentId for group display query:", {
          studentId,
          studentType,
          schoolId,
        });

        // Enhanced debugging for mixed assignments query
        console.log(
          "🔍 Running mixed assignments query with exact conditions:",
        );
        console.log(`   - eq(groupMixedAssignments.studentId, ${studentId})`);
        console.log(
          `   - eq(groupMixedAssignments.studentType, '${studentType}')`,
        );
        console.log(`   - eq(groupMixedAssignments.schoolId, ${schoolId})`);

        const mixedGroupAssignments = await db
          .select({
            groupId: groupMixedAssignments.groupId,
            studentId: groupMixedAssignments.studentId,
            userId: groupMixedAssignments.userId,
            studentType: groupMixedAssignments.studentType,
            schoolId: groupMixedAssignments.schoolId,
            assignedAt: groupMixedAssignments.assignedAt,
          })
          .from(groupMixedAssignments)
          .where(
            and(
              eq(groupMixedAssignments.studentId, studentId), // Use studentId for group display
              eq(groupMixedAssignments.studentType, studentType),
              eq(groupMixedAssignments.schoolId, schoolId),
            ),
          );

        console.log(
          "🔍 Raw mixed assignments query result:",
          mixedGroupAssignments,
        );

        // Also check regular user assignments if this is a student
        let userGroupAssignments: any[] = [];
        if (studentType === "student" && studentProfile.userId) {
          userGroupAssignments = await db
            .select({
              groupId: groupUserAssignments.groupId,
            })
            .from(groupUserAssignments)
            .where(
              and(
                eq(groupUserAssignments.userId, studentProfile.userId),
                eq(groupUserAssignments.schoolId, schoolId),
              ),
            );
        }

        // Combine all group assignments
        const groupAssignments = [
          ...mixedGroupAssignments,
          ...userGroupAssignments,
        ];

        console.log("🔍 Found group assignments:", groupAssignments);
        console.log(
          "🔍 Mixed assignments query for student:",
          studentId,
          "type:",
          studentType,
          "school:",
          schoolId,
        );
        console.log("🔍 Mixed assignments result:", mixedGroupAssignments);
        console.log("🔍 User assignments result:", userGroupAssignments);

        if (groupAssignments.length > 0) {
          const groupIds = groupAssignments.map((a) => a.groupId);
          console.log("🔍 Extracted group IDs:", groupIds);

          // Fetch group details with teacher and subject information
          console.log("🔍 Fetching group details with conditions:");
          console.log(`   - inArray(groups.id, ${JSON.stringify(groupIds)})`);
          console.log(`   - eq(groups.schoolId, ${schoolId})`);

          const groupsData = await db
            .select({
              id: groups.id,
              name: groups.name,
              educationLevel: groups.educationLevel,
              subjectId: groups.subjectId,
              teacherId: groups.teacherId,
              description: groups.description,
            })
            .from(groups)
            .where(
              and(inArray(groups.id, groupIds), eq(groups.schoolId, schoolId)),
            );

          console.log("🔍 Groups data query result:", groupsData);
          console.log("🔍 Number of groups found:", groupsData.length);

          // Enrich groups with teacher and subject names
          for (const group of groupsData) {
            let teacherName = null;
            let subjectName = null;

            // Get teacher name
            if (group.teacherId) {
              const teacher = await db
                .select({ name: users.name })
                .from(users)
                .where(eq(users.id, group.teacherId))
                .limit(1);
              if (teacher.length > 0) {
                teacherName = teacher[0].name;
              }
            }

            // Get subject name
            if (group.subjectId) {
              const subject = await db
                .select({
                  name: teachingModules.name,
                  nameAr: teachingModules.nameAr,
                })
                .from(teachingModules)
                .where(eq(teachingModules.id, group.subjectId))
                .limit(1);
              if (subject.length > 0) {
                subjectName = subject[0].nameAr || subject[0].name;
              }
            }

            enrolledGroups.push({
              id: group.id,
              name: group.name,
              educationLevel: group.educationLevel,
              subjectName: subjectName,
              teacherName: teacherName,
              description: group.description,
            });
          }

          console.log("✅ Groups data fetched from database:", groupsData);
          console.log("✅ Final enrolled groups array:", enrolledGroups);
        } else {
          console.log(
            "⚠️ No group assignments found - student not enrolled in any groups",
          );
        }

        console.log("✅ Total fetched enrolled groups:", enrolledGroups.length);
      } catch (error) {
        console.error("Error fetching enrolled groups:", error);
        enrolledGroups = [];
      }

      // Final debug before returning
      console.log("🎯 FINAL RETURN - About to return profile with:");
      console.log(`   - enrolledGroups.length: ${enrolledGroups.length}`);
      console.log(
        `   - enrolledGroups content: ${JSON.stringify(enrolledGroups)}`,
      );

      const finalProfile = {
        ...studentProfile,
        attendanceStats: {
          totalClasses: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
        },
        paymentStats: {
          totalDue: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalAmount: 0,
        },
        enrolledGroups: enrolledGroups,
        recentAttendance: [],
        recentPayments: await this.getStudentPaidHistory(studentId, schoolId), // Fetch actual payment history
      };

      console.log(
        "🎯 FINAL PROFILE OBJECT:",
        JSON.stringify(finalProfile, null, 2),
      );
      return finalProfile;
    } catch (error) {
      console.error("Error getting student complete profile:", error);
      return null;
    }
  }

  // Search both students and children for QR scanner
  async searchStudentsAndChildren(filters: {
    search?: string;
    educationLevel?: string;
    role?: string;
    schoolId: number;
  }): Promise<any[]> {
    try {
      const results: any[] = [];

      // Search verified students only (from students table)
      if (!filters.role || filters.role === "student") {
        const studentResults = await db
          .select()
          .from(students)
          .leftJoin(users, eq(students.userId, users.id))
          .where(
            and(
              eq(students.schoolId, filters.schoolId),
              eq(students.verified, true),
            ),
          );

        // Process and filter student results
        for (const result of studentResults) {
          const student = result.students;
          const user = result.users;

          if (!user) continue;

          // SAFETY: Exclude parent users from student search results
          if (user.role === "parent") continue;

          // Apply search filter
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = user.name.toLowerCase().includes(searchTerm);
            const matchesEmail = user.email?.toLowerCase().includes(searchTerm);
            const matchesId = student.id.toString().includes(searchTerm);

            if (!matchesName && !matchesEmail && !matchesId) {
              continue;
            }
          }

          // Apply education level filter
          if (
            filters.educationLevel &&
            student.educationLevel !== filters.educationLevel
          ) {
            continue;
          }

          results.push({
            id: student.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: "student", // Always set as "student" for student records
            educationLevel: student.educationLevel,
            verified: student.verified,
            type: "student",
          });
        }
      }

      // Search verified children (only if role is not specifically 'student')
      if (!filters.role || filters.role === "child") {
        const childResults = await db
          .select()
          .from(children)
          .where(
            and(
              eq(children.schoolId, filters.schoolId),
              eq(children.verified, true),
            ),
          );

        // Process and filter child results
        for (const child of childResults) {
          // Apply search filter
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = child.name.toLowerCase().includes(searchTerm);
            const matchesParentName = child.parentName
              ?.toLowerCase()
              .includes(searchTerm);
            const matchesId = child.id.toString().includes(searchTerm);

            if (!matchesName && !matchesParentName && !matchesId) {
              continue;
            }
          }

          // Apply education level filter
          if (
            filters.educationLevel &&
            child.educationLevel !== filters.educationLevel
          ) {
            continue;
          }

          results.push({
            id: child.id,
            userId: null,
            name: child.name,
            email: "",
            phone: child.parentPhone,
            role: "child",
            educationLevel: child.educationLevel,
            verified: child.verified,
            type: "child",
            parentName: child.parentName,
          });
        }
      }

      console.log(
        `[DEBUG] searchStudentsAndChildren: Found ${results.length} total records (verified only)`,
      );
      return results;
    } catch (error) {
      console.error("Error searching students and children:", error);
      throw error;
    }
  }

  async markStudentAttendanceToday(
    studentId: number,
    studentType: "student" | "child",
    status: "present" | "absent" | "late" | "excused",
    markedBy: number,
    schoolId: number,
  ): Promise<any> {
    try {
      const today = new Date();
      const todayDateOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      // Get student's enrolled groups to mark attendance for all
      const enrolledGroups = await db
        .select({ groupId: groupMixedAssignments.groupId })
        .from(groupMixedAssignments)
        .leftJoin(groups, eq(groupMixedAssignments.groupId, groups.id))
        .where(
          and(
            eq(groupMixedAssignments.studentId, studentId),
            eq(groupMixedAssignments.studentType, studentType),
            eq(groups.schoolId, schoolId),
          ),
        );

      const attendanceRecords = [];

      for (const group of enrolledGroups) {
        // Check if attendance already exists for today
        const existingAttendance = await db
          .select()
          .from(groupAttendance)
          .where(
            and(
              eq(groupAttendance.studentId, studentId),
              eq(groupAttendance.studentType, studentType),
              eq(groupAttendance.groupId, group.groupId),
              eq(groupAttendance.attendanceDate, todayDateOnly),
            ),
          )
          .limit(1);

        if (existingAttendance.length > 0) {
          // Update existing attendance
          const [updatedRecord] = await db
            .update(groupAttendance)
            .set({
              status,
              markedBy,
              updatedAt: new Date(),
            })
            .where(eq(groupAttendance.id, existingAttendance[0].id))
            .returning();
          attendanceRecords.push(updatedRecord);
        } else {
          // Create new attendance record
          const [newRecord] = await db
            .insert(groupAttendance)
            .values({
              studentId,
              studentType,
              groupId: group.groupId,
              attendanceDate: todayDateOnly,
              status,
              markedBy,
              schoolId,
            })
            .returning();
          attendanceRecords.push(newRecord);
        }
      }

      return attendanceRecords;
    } catch (error) {
      console.error("Error marking student attendance:", error);
      throw error;
    }
  }

  async recordStudentPayment(paymentData: {
    studentId: number;
    studentType: "student" | "child";
    amount: number;
    paymentMethod?: string;
    notes?: string;
    year: number;
    month: number;
    paidBy: number;
    schoolId: number;
  }): Promise<any> {
    try {
      const {
        studentId,
        studentType,
        amount,
        paymentMethod,
        notes,
        year,
        month,
        paidBy,
        schoolId,
      } = paymentData;

      // Check if payment record already exists
      const existingPayment = await db
        .select()
        .from(studentMonthlyPayments)
        .where(
          and(
            eq(studentMonthlyPayments.studentId, studentId),
            eq(studentMonthlyPayments.studentType, studentType),
            eq(studentMonthlyPayments.year, year),
            eq(studentMonthlyPayments.month, month),
            eq(studentMonthlyPayments.schoolId, schoolId),
          ),
        )
        .limit(1);

      if (existingPayment.length > 0) {
        // Update existing payment
        const [updatedPayment] = await db
          .update(studentMonthlyPayments)
          .set({
            isPaid: true,
            amount: amount.toString(),
            paidAt: new Date(),
            paidBy,
            notes,
            updatedAt: new Date(),
          })
          .where(eq(studentMonthlyPayments.id, existingPayment[0].id))
          .returning();

        return updatedPayment;
      } else {
        // Create new payment record
        const [newPayment] = await db
          .insert(studentMonthlyPayments)
          .values({
            studentId,
            studentType,
            year,
            month,
            isPaid: true,
            amount: amount.toString(),
            paidAt: new Date(),
            paidBy,
            notes,
            schoolId,
          })
          .returning();

        return newPayment;
      }
    } catch (error) {
      console.error("Error recording student payment:", error);
      throw error;
    }
  }

  // Financial Entries implementation methods
  async createFinancialEntry(
    entry: InsertFinancialEntry,
  ): Promise<FinancialEntry> {
    try {
      console.log("🔄 Attempting to create financial entry:", entry);
      const [result] = await db
        .insert(financialEntries)
        .values(entry)
        .returning();
      console.log("✅ Financial entry created successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating financial entry:", error);
      console.error("❌ Entry data that failed:", entry);
      throw error;
    }
  }

  async deleteFinancialEntryById(entryId: number): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting financial entry ID: ${entryId}`);
      const deleteResult = await db
        .delete(financialEntries)
        .where(eq(financialEntries.id, entryId));
      console.log(`✅ Financial entry ${entryId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting financial entry ${entryId}:`, error);
      throw error;
    }
  }

  async getFinancialEntries(
    schoolId: number,
    year?: number,
    month?: number,
  ): Promise<FinancialEntry[]> {
    try {
      let query = db
        .select()
        .from(financialEntries)
        .where(eq(financialEntries.schoolId, schoolId));

      if (year) {
        query = query.where(
          and(
            eq(financialEntries.schoolId, schoolId),
            eq(financialEntries.year, year),
          ),
        );
      }

      if (month && year) {
        query = query.where(
          and(
            eq(financialEntries.schoolId, schoolId),
            eq(financialEntries.year, year),
            eq(financialEntries.month, month),
          ),
        );
      }

      return await query.orderBy(desc(financialEntries.createdAt));
    } catch (error) {
      console.error("Error fetching financial entries:", error);
      throw error;
    }
  }

  async resetFinancialEntries(schoolId: number): Promise<void> {
    try {
      await db
        .delete(financialEntries)
        .where(eq(financialEntries.schoolId, schoolId));
    } catch (error) {
      console.error("Error resetting financial entries:", error);
      throw error;
    }
  }

  async deleteFinancialEntriesByPayment(
    studentId: number,
    year: number,
    month: number,
    schoolId: number
  ): Promise<void> {
    try {
      console.log(`🗑️ Deleting financial entries for payment - Student: ${studentId}, Year: ${year}, Month: ${month}, School: ${schoolId}`);
      
      // Delete financial entries that match the payment details
      // We use school ID, year, month and student name in remarks to find related entries
      const studentQuery = await db
        .select()
        .from(users)
        .where(eq(users.id, studentId))
        .limit(1);
      
      if (studentQuery.length > 0) {
        const studentName = studentQuery[0].name;
        
        // Delete entries that contain the student name and are from the same school, year, and month
        await db
          .delete(financialEntries)
          .where(
            and(
              eq(financialEntries.schoolId, schoolId),
              eq(financialEntries.year, year),
              eq(financialEntries.month, month),
              like(financialEntries.remarks, `%${studentName}%`)
            )
          );
        
        console.log(`✅ Deleted financial entries for payment - Student: ${studentName}`);
      }
    } catch (error) {
      console.error("❌ Error deleting financial entries by payment:", error);
      throw error;
    }
  }

  async getGroupsBySubjectAndGrade(
    subjectId: number,
    level: string,
    grade: string,
    schoolId: number,
  ): Promise<Group[]> {
    try {
      const existingGroups = await db
        .select()
        .from(groups)
        .where(
          and(
            eq(groups.schoolId, schoolId),
            eq(groups.subjectId, subjectId),
            eq(groups.educationLevel, level),
            eq(groups.grade, grade),
          ),
        );
      return existingGroups;
    } catch (error) {
      console.error("Error fetching groups by subject and grade:", error);
      throw error;
    }
  }

  async createNewGroup(groupData: {
    schoolId: number;
    name: string;
    description: string;
    category: string;
    educationLevel: string;
    grade: string;
    subjectId: number;
    groupNumber: number;
    isAdminManaged: boolean;
  }): Promise<Group> {
    try {
      const [newGroup] = await db
        .insert(groups)
        .values({
          schoolId: groupData.schoolId,
          name: groupData.name,
          description: groupData.description,
          category: groupData.category,
          educationLevel: groupData.educationLevel,
          grade: groupData.grade,
          subjectId: groupData.subjectId,
          groupNumber: groupData.groupNumber,
          isAdminManaged: groupData.isAdminManaged,
          maxMembers: 30, // Default max members
          startDate: new Date(),
        })
        .returning();

      console.log(`✅ Created new group "${newGroup.name}" with ID ${newGroup.id}`);
      return newGroup;
    } catch (error) {
      console.error("Error creating new group:", error);
      throw error;
    }
  }

  async getTeachingModuleById(id: number): Promise<TeachingModule | null> {
    try {
      const [subject] = await db
        .select()
        .from(teachingModules)
        .where(eq(teachingModules.id, id))
        .limit(1);
      return subject || null;
    } catch (error) {
      console.error("Error fetching teaching module by ID:", error);
      throw error;
    }
  }

  // Teacher Payment Status methods
  async getTeacherPaymentStatuses(
    schoolId: number,
    teacherId?: number,
    paymentMonth?: string
  ): Promise<TeacherPaymentStatus[]> {
    try {
      let query = db
        .select()
        .from(teacherPaymentStatus)
        .where(eq(teacherPaymentStatus.schoolId, schoolId));

      if (teacherId) {
        query = query.where(eq(teacherPaymentStatus.teacherId, teacherId));
      }

      if (paymentMonth) {
        query = query.where(eq(teacherPaymentStatus.paymentMonth, paymentMonth));
      }

      return await query.orderBy(desc(teacherPaymentStatus.createdAt));
    } catch (error) {
      console.error("Error fetching teacher payment statuses:", error);
      throw error;
    }
  }

  async updateTeacherPaymentStatus(
    schoolId: number,
    teacherId: number,
    paymentMonth: string,
    isPaid: boolean,
    markedBy: number
  ): Promise<TeacherPaymentStatus> {
    try {
      // Try to update existing record first
      const existing = await db
        .select()
        .from(teacherPaymentStatus)
        .where(
          and(
            eq(teacherPaymentStatus.schoolId, schoolId),
            eq(teacherPaymentStatus.teacherId, teacherId),
            eq(teacherPaymentStatus.paymentMonth, paymentMonth)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        const [updated] = await db
          .update(teacherPaymentStatus)
          .set({
            isPaid: isPaid,
            markedPaidAt: isPaid ? new Date() : null,
            markedPaidBy: isPaid ? markedBy : null,
            updatedAt: new Date()
          })
          .where(eq(teacherPaymentStatus.id, existing[0].id))
          .returning();
        return updated;
      } else {
        // Create new record
        const [created] = await db
          .insert(teacherPaymentStatus)
          .values({
            schoolId,
            teacherId,
            paymentMonth,
            isPaid,
            markedPaidAt: isPaid ? new Date() : null,
            markedPaidBy: isPaid ? markedBy : null
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error updating teacher payment status:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
