import { relations } from "drizzle-orm/relations";
import { schools, blockedUsers, users, blogPosts, children, formationRegistrations, formations, groupAttendance, groups, groupMixedAssignments, announcements, groupScheduleAssignments, scheduleCells, groupUserAssignments, groupTransactions, teachingModules, notifications, pushSubscriptions, scheduleTables, messages, teachers, notificationLogs, students, suggestions, teacherSpecializations, studentMonthlyPayments, groupRegistrations, userReports, moduleYears } from "./schema";

export const blockedUsersRelations = relations(blockedUsers, ({one}) => ({
	school: one(schools, {
		fields: [blockedUsers.schoolId],
		references: [schools.id]
	}),
	user_blockerId: one(users, {
		fields: [blockedUsers.blockerId],
		references: [users.id],
		relationName: "blockedUsers_blockerId_users_id"
	}),
	user_blockedId: one(users, {
		fields: [blockedUsers.blockedId],
		references: [users.id],
		relationName: "blockedUsers_blockedId_users_id"
	}),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	blockedUsers: many(blockedUsers),
	blogPosts: many(blogPosts),
	children: many(children),
	formationRegistrations: many(formationRegistrations),
	formations: many(formations),
	groupAttendances: many(groupAttendance),
	groupMixedAssignments: many(groupMixedAssignments),
	announcements: many(announcements),
	groupScheduleAssignments: many(groupScheduleAssignments),
	groupUserAssignments: many(groupUserAssignments),
	groupTransactions: many(groupTransactions),
	groups: many(groups),
	notifications: many(notifications),
	pushSubscriptions: many(pushSubscriptions),
	scheduleTables: many(scheduleTables),
	messages: many(messages),
	scheduleCells: many(scheduleCells),
	notificationLogs: many(notificationLogs),
	students: many(students),
	suggestions: many(suggestions),
	teacherSpecializations: many(teacherSpecializations),
	studentMonthlyPayments: many(studentMonthlyPayments),
	teachers: many(teachers),
	users: many(users),
	groupRegistrations: many(groupRegistrations),
	teachingModules: many(teachingModules),
	userReports: many(userReports),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	blockedUsers_blockerId: many(blockedUsers, {
		relationName: "blockedUsers_blockerId_users_id"
	}),
	blockedUsers_blockedId: many(blockedUsers, {
		relationName: "blockedUsers_blockedId_users_id"
	}),
	blogPosts: many(blogPosts),
	children_parentId: many(children, {
		relationName: "children_parentId_users_id"
	}),
	children_verifiedBy: many(children, {
		relationName: "children_verifiedBy_users_id"
	}),
	groupAttendances: many(groupAttendance),
	groupMixedAssignments: many(groupMixedAssignments),
	announcements: many(announcements),
	groupScheduleAssignments: many(groupScheduleAssignments),
	groupUserAssignments_userId: many(groupUserAssignments, {
		relationName: "groupUserAssignments_userId_users_id"
	}),
	groupUserAssignments_assignedBy: many(groupUserAssignments, {
		relationName: "groupUserAssignments_assignedBy_users_id"
	}),
	groupTransactions: many(groupTransactions),
	groups: many(groups),
	notifications: many(notifications),
	pushSubscriptions: many(pushSubscriptions),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	scheduleCells: many(scheduleCells),
	notificationLogs: many(notificationLogs),
	students_userId: many(students, {
		relationName: "students_userId_users_id"
	}),
	students_verifiedBy: many(students, {
		relationName: "students_verifiedBy_users_id"
	}),
	suggestions: many(suggestions),
	teacherSpecializations: many(teacherSpecializations),
	studentMonthlyPayments: many(studentMonthlyPayments),
	school: one(schools, {
		fields: [users.schoolId],
		references: [schools.id]
	}),
	userReports_reporterId: many(userReports, {
		relationName: "userReports_reporterId_users_id"
	}),
	userReports_reportedUserId: many(userReports, {
		relationName: "userReports_reportedUserId_users_id"
	}),
}));

export const blogPostsRelations = relations(blogPosts, ({one}) => ({
	school: one(schools, {
		fields: [blogPosts.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [blogPosts.authorId],
		references: [users.id]
	}),
}));

export const childrenRelations = relations(children, ({one}) => ({
	school: one(schools, {
		fields: [children.schoolId],
		references: [schools.id]
	}),
	user_parentId: one(users, {
		fields: [children.parentId],
		references: [users.id],
		relationName: "children_parentId_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [children.verifiedBy],
		references: [users.id],
		relationName: "children_verifiedBy_users_id"
	}),
}));

export const formationRegistrationsRelations = relations(formationRegistrations, ({one}) => ({
	school: one(schools, {
		fields: [formationRegistrations.schoolId],
		references: [schools.id]
	}),
	formation: one(formations, {
		fields: [formationRegistrations.formationId],
		references: [formations.id]
	}),
}));

export const formationsRelations = relations(formations, ({one, many}) => ({
	formationRegistrations: many(formationRegistrations),
	school: one(schools, {
		fields: [formations.schoolId],
		references: [schools.id]
	}),
}));

export const groupAttendanceRelations = relations(groupAttendance, ({one}) => ({
	school: one(schools, {
		fields: [groupAttendance.schoolId],
		references: [schools.id]
	}),
	group: one(groups, {
		fields: [groupAttendance.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupAttendance.markedBy],
		references: [users.id]
	}),
}));

export const groupsRelations = relations(groups, ({one, many}) => ({
	groupAttendances: many(groupAttendance),
	groupMixedAssignments: many(groupMixedAssignments),
	groupScheduleAssignments: many(groupScheduleAssignments),
	groupUserAssignments: many(groupUserAssignments),
	groupTransactions: many(groupTransactions),
	school: one(schools, {
		fields: [groups.schoolId],
		references: [schools.id]
	}),
	teachingModule: one(teachingModules, {
		fields: [groups.subjectId],
		references: [teachingModules.id]
	}),
	user: one(users, {
		fields: [groups.teacherId],
		references: [users.id]
	}),
	scheduleCell: one(scheduleCells, {
		fields: [groups.scheduleCellId],
		references: [scheduleCells.id]
	}),
	groupRegistrations: many(groupRegistrations),
}));

export const groupMixedAssignmentsRelations = relations(groupMixedAssignments, ({one}) => ({
	school: one(schools, {
		fields: [groupMixedAssignments.schoolId],
		references: [schools.id]
	}),
	group: one(groups, {
		fields: [groupMixedAssignments.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupMixedAssignments.assignedBy],
		references: [users.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	school: one(schools, {
		fields: [announcements.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [announcements.authorId],
		references: [users.id]
	}),
}));

export const groupScheduleAssignmentsRelations = relations(groupScheduleAssignments, ({one}) => ({
	school: one(schools, {
		fields: [groupScheduleAssignments.schoolId],
		references: [schools.id]
	}),
	group: one(groups, {
		fields: [groupScheduleAssignments.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupScheduleAssignments.assignedBy],
		references: [users.id]
	}),
	scheduleCell: one(scheduleCells, {
		fields: [groupScheduleAssignments.scheduleCellId],
		references: [scheduleCells.id]
	}),
}));

export const scheduleCellsRelations = relations(scheduleCells, ({one, many}) => ({
	groupScheduleAssignments: many(groupScheduleAssignments),
	groups: many(groups),
	school: one(schools, {
		fields: [scheduleCells.schoolId],
		references: [schools.id]
	}),
	scheduleTable: one(scheduleTables, {
		fields: [scheduleCells.scheduleTableId],
		references: [scheduleTables.id]
	}),
	teachingModule: one(teachingModules, {
		fields: [scheduleCells.subjectId],
		references: [teachingModules.id]
	}),
	user: one(users, {
		fields: [scheduleCells.teacherId],
		references: [users.id]
	}),
}));

export const groupUserAssignmentsRelations = relations(groupUserAssignments, ({one}) => ({
	school: one(schools, {
		fields: [groupUserAssignments.schoolId],
		references: [schools.id]
	}),
	group: one(groups, {
		fields: [groupUserAssignments.groupId],
		references: [groups.id]
	}),
	user_userId: one(users, {
		fields: [groupUserAssignments.userId],
		references: [users.id],
		relationName: "groupUserAssignments_userId_users_id"
	}),
	user_assignedBy: one(users, {
		fields: [groupUserAssignments.assignedBy],
		references: [users.id],
		relationName: "groupUserAssignments_assignedBy_users_id"
	}),
}));

export const groupTransactionsRelations = relations(groupTransactions, ({one}) => ({
	school: one(schools, {
		fields: [groupTransactions.schoolId],
		references: [schools.id]
	}),
	group: one(groups, {
		fields: [groupTransactions.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupTransactions.recordedBy],
		references: [users.id]
	}),
}));

export const teachingModulesRelations = relations(teachingModules, ({one, many}) => ({
	groups: many(groups),
	scheduleCells: many(scheduleCells),
	teacherSpecializations: many(teacherSpecializations),
	school: one(schools, {
		fields: [teachingModules.schoolId],
		references: [schools.id]
	}),
	moduleYears: many(moduleYears),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	school: one(schools, {
		fields: [notifications.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	}),
	school: one(schools, {
		fields: [pushSubscriptions.schoolId],
		references: [schools.id]
	}),
}));

export const scheduleTablesRelations = relations(scheduleTables, ({one, many}) => ({
	school: one(schools, {
		fields: [scheduleTables.schoolId],
		references: [schools.id]
	}),
	scheduleCells: many(scheduleCells),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	school: one(schools, {
		fields: [messages.schoolId],
		references: [schools.id]
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
	teacher: one(teachers, {
		fields: [messages.teacherId],
		references: [teachers.id]
	}),
	userReports: many(userReports),
}));

export const teachersRelations = relations(teachers, ({one, many}) => ({
	messages: many(messages),
	school: one(schools, {
		fields: [teachers.schoolId],
		references: [schools.id]
	}),
}));

export const notificationLogsRelations = relations(notificationLogs, ({one}) => ({
	school: one(schools, {
		fields: [notificationLogs.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [notificationLogs.userId],
		references: [users.id]
	}),
}));

export const studentsRelations = relations(students, ({one}) => ({
	school: one(schools, {
		fields: [students.schoolId],
		references: [schools.id]
	}),
	user_userId: one(users, {
		fields: [students.userId],
		references: [users.id],
		relationName: "students_userId_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [students.verifiedBy],
		references: [users.id],
		relationName: "students_verifiedBy_users_id"
	}),
}));

export const suggestionsRelations = relations(suggestions, ({one}) => ({
	school: one(schools, {
		fields: [suggestions.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [suggestions.userId],
		references: [users.id]
	}),
}));

export const teacherSpecializationsRelations = relations(teacherSpecializations, ({one}) => ({
	school: one(schools, {
		fields: [teacherSpecializations.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [teacherSpecializations.teacherId],
		references: [users.id]
	}),
	teachingModule: one(teachingModules, {
		fields: [teacherSpecializations.moduleId],
		references: [teachingModules.id]
	}),
}));

export const studentMonthlyPaymentsRelations = relations(studentMonthlyPayments, ({one}) => ({
	school: one(schools, {
		fields: [studentMonthlyPayments.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [studentMonthlyPayments.paidBy],
		references: [users.id]
	}),
}));

export const groupRegistrationsRelations = relations(groupRegistrations, ({one}) => ({
	school: one(schools, {
		fields: [groupRegistrations.schoolId],
		references: [schools.id]
	}),
	group: one(groups, {
		fields: [groupRegistrations.groupId],
		references: [groups.id]
	}),
}));

export const userReportsRelations = relations(userReports, ({one}) => ({
	school: one(schools, {
		fields: [userReports.schoolId],
		references: [schools.id]
	}),
	user_reporterId: one(users, {
		fields: [userReports.reporterId],
		references: [users.id],
		relationName: "userReports_reporterId_users_id"
	}),
	user_reportedUserId: one(users, {
		fields: [userReports.reportedUserId],
		references: [users.id],
		relationName: "userReports_reportedUserId_users_id"
	}),
	message: one(messages, {
		fields: [userReports.messageId],
		references: [messages.id]
	}),
}));

export const moduleYearsRelations = relations(moduleYears, ({one}) => ({
	teachingModule: one(teachingModules, {
		fields: [moduleYears.moduleId],
		references: [teachingModules.id]
	}),
}));