import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertAnnouncementSchema,
  insertBlogPostSchema,
  insertTeacherSchema,
  insertMessageSchema,
  insertSuggestionSchema,
  insertGroupSchema,
  insertFormationSchema,
  insertGroupRegistrationSchema,
  insertFormationRegistrationSchema,
  formationRegistrationClientSchema,
  insertUserSchema,
  insertAdminSchema,
  insertTeacherUserSchema,
  insertStudentSchema,
  loginSchema,
  insertTeachingModuleSchema,
  insertTeacherSpecializationSchema,
  insertScheduleTableSchema,
  insertScheduleCellSchema,
  insertBlockedUserSchema,
  insertUserReportSchema,
  insertSuperAdminSchema,
  insertSchoolSchema,
  schoolSelectionSchema,
  insertChildSchema,
  insertStudentDataSchema,
  insertGroupAttendanceSchema,
  insertGroupTransactionSchema,
  insertFinancialEntrySchema,
} from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import session from "express-session";
// Firebase admin imports commented out until package is installed
// import { initializeApp, cert, getApps } from "firebase-admin/app";
// import { getStorage as getAdminStorage } from "firebase-admin/storage";

// Extend Express Request interface to include session with our custom properties
declare module "express-session" {
  interface SessionData {
    schoolId?: number;
    schoolCode?: string;
    userId?: number;
    user?: any;
  }
}
import { SMSService } from "./sms-service";
import { EmailService } from "./email-service";
import PushNotificationService from "./push-service";
import { insertPushSubscriptionSchema } from "../shared/schema";

// Remove global currentUser variable to prevent session bleeding between users
// We'll use req.session.user instead for proper session management

// Secret keys for admin and teacher registration
const ADMIN_SECRET_KEY = "ADMIN_2024_SECRET_KEY";
const TEACHER_SECRET_KEY = "TEACHER_2024_SECRET_KEY";
const SUPER_ADMIN_SECRET_KEY = "SUPER_ADMIN_2024_MASTER_KEY";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const prefix = req.body.type || "content";
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🔥 REGISTERING ROUTES - Starting route registration...');
  
  // Configure session middleware with proper persistence
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || "fallback-secret-key-for-development",
      resave: false,
      saveUninitialized: true, // Create session for anonymous users for school selection
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true, // Prevent XSS attacks
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax", // Allow cross-site cookies for proper functionality
      },
      name: "school.session", // Custom session name for clarity
    }),
  );

  // Firebase config endpoint
  app.get("/api/firebase-config", (req, res) => {
    const config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain:
        process.env.VITE_FIREBASE_AUTH_DOMAIN ||
        `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    // Only return config if all required fields are present
    if (config.apiKey && config.projectId && config.appId) {
      res.json(config);
    } else {
      res.status(503).json({ error: "Firebase configuration not available" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Get school context from session if available
      const schoolId = req.session?.schoolId;

      // Authenticate user with optional school context
      const user = await storage.authenticateUser(email, password, schoolId);

      if (user) {
        // Check if user is banned
        if (user.banned) {
          return res.status(403).json({
            error:
              "تم حظر حسابك من التطبيق. السبب: " +
              (user.banReason || "مخالفة شروط الاستخدام"),
          });
        }

        // Check if school access is enabled
        if (user.schoolId) {
          const school = await storage.getSchoolById(user.schoolId);
          if (school && school.isAccessEnabled === false) {
            return res.status(403).json({
              error: "تم إيقاف الوصول لهذه المدرسة مؤقتاً. يرجى المحاولة لاحقاً أو التواصل مع الإدارة",
            });
          }
        }

        // Store user session properly with school context
        req.session.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId || undefined,
          phone: user.phone,
          gender: user.gender,
          profilePicture: user.profilePicture,
        };
        req.session.userId = user.id;
        req.session.schoolId = user.schoolId || undefined;
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } else {
        res
          .status(401)
          .json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "تأكد من صحة البيانات المدخلة" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const {
        children: childrenData,
        educationLevel,
        grade,
        ...userData
      } = req.body;

      // Get school from session or request FIRST
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res
          .status(400)
          .json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }

      // Validate basic user data first
      const validatedUserData = insertUserSchema.parse(userData);

      // Check if user already exists by email in this school context
      console.log(
        "Checking for existing user with email:",
        validatedUserData.email,
        "in school:",
        schoolId,
      );
      const existingUser = await storage.getUserByEmail(
        validatedUserData.email,
        schoolId,
      );
      console.log("Existing user found:", existingUser);
      if (existingUser) {
        if (existingUser.banned) {
          return res.status(403).json({
            error:
              "هذا البريد الإلكتروني محظور من التطبيق. السبب: " +
              (existingUser.banReason || "مخالفة شروط الاستخدام"),
          });
        }
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }

      // Check if phone number already exists in this school context
      console.log(
        "Checking for existing phone:",
        validatedUserData.phone,
        "in school:",
        schoolId,
      );
      const existingPhone = await storage.getUserByPhone(
        validatedUserData.phone,
        schoolId,
      );
      console.log("Existing phone found:", existingPhone);
      if (existingPhone) {
        if (existingPhone.banned) {
          return res.status(403).json({
            error:
              "هذا الرقم محظور من التطبيق. السبب: " +
              (existingPhone.banReason || "مخالفة شروط الاستخدام"),
          });
        }
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }

      // Create user first with school context
      const userWithSchool = {
        ...validatedUserData,
        schoolId: schoolId,
      };
      const user = await storage.createUser(userWithSchool);

      // Create student record if this is a student
      if (userData.role === "student" && educationLevel && grade) {
        await storage.createStudent({
          userId: user.id,
          name: userData.name,
          phone: userData.phone,
          gender: userData.gender,
          educationLevel,
          grade,
          schoolId: schoolId,
        });
      }

      // Create children if provided (for parents)
      if (
        childrenData &&
        Array.isArray(childrenData) &&
        childrenData.length > 0
      ) {
        const childrenPromises = childrenData.map((child) =>
          storage.createChild({
            parentId: user.id,
            name: child.name,
            gender: child.gender,
            educationLevel: child.educationLevel,
            grade: child.grade,
            schoolId: schoolId,
          }),
        );
        await Promise.all(childrenPromises);
      }

      // Automatically log in the user after successful registration
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      };

      // Remove password from response
      const { password: ___, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "يرجى التأكد من صحة جميع البيانات المطلوبة" });
      } else {
        res
          .status(400)
          .json({ error: "حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى" });
      }
    }
  });

  // Admin registration with secret key
  app.post("/api/auth/register-admin", async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);

      // Get school from session or request
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res
          .status(400)
          .json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }

      const currentSchool = await storage.getSchoolById(schoolId);
      if (!currentSchool) {
        return res.status(400).json({ error: "المدرسة غير موجودة" });
      }

      if (validatedData.adminKey !== currentSchool.adminKey) {
        return res.status(403).json({
          error: "مفتاح الإدارة غير صحيح. تأكد من صحة المفتاح السري للمدرسة",
        });
      }

      // Check if user already exists by email in this school context
      const existingUser = await storage.getUserByEmail(
        validatedData.email,
        schoolId,
      );
      if (existingUser) {
        if (existingUser.banned) {
          return res.status(403).json({
            error:
              "هذا البريد الإلكتروني محظور من التطبيق. السبب: " +
              (existingUser.banReason || "مخالفة شروط الاستخدام"),
          });
        }
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }

      // Check if phone number already exists in this school context
      const existingPhone = await storage.getUserByPhone(
        validatedData.phone,
        schoolId,
      );
      if (existingPhone) {
        if (existingPhone.banned) {
          return res.status(403).json({
            error:
              "هذا الرقم محظور من التطبيق. السبب: " +
              (existingPhone.banReason || "مخالفة شروط الاستخدام"),
          });
        }
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }

      // Create user with admin role and school context
      const { adminKey: _, ...userDataWithoutKey } = validatedData;
      const userWithRole = {
        ...userDataWithoutKey,
        role: "admin",
        schoolId: currentSchool.id,
      };
      const user = await storage.createUser(userWithRole);

      // Automatically log in the user after successful registration
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      };

      // Remove password from response
      const { password: __, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Admin registration error:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "يرجى التأكد من صحة جميع البيانات المطلوبة" });
      } else {
        res.status(400).json({
          error: "حدث خطأ في إنشاء حساب المدير. يرجى المحاولة مرة أخرى",
        });
      }
    }
  });

  // Teacher registration with secret key
  app.post("/api/auth/register-teacher", async (req, res) => {
    try {
      const validatedData = insertTeacherUserSchema.parse(req.body);

      // Get school from session or request
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res
          .status(400)
          .json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }

      const currentSchool = await storage.getSchoolById(schoolId);
      if (!currentSchool) {
        return res.status(400).json({ error: "المدرسة غير موجودة" });
      }

      if (validatedData.teacherKey !== currentSchool.teacherKey) {
        return res.status(403).json({
          error: "مفتاح المعلم غير صحيح. تأكد من صحة المفتاح السري للمدرسة",
        });
      }

      // Check if user already exists by email in this school context
      const existingUser = await storage.getUserByEmail(
        validatedData.email,
        schoolId,
      );
      if (existingUser) {
        if (existingUser.banned) {
          return res.status(403).json({
            error:
              "هذا البريد الإلكتروني محظور من التطبيق. السبب: " +
              (existingUser.banReason || "مخالفة شروط الاستخدام"),
          });
        }
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }

      // Check if phone number already exists in this school context
      const existingPhone = await storage.getUserByPhone(
        validatedData.phone,
        schoolId,
      );
      if (existingPhone) {
        if (existingPhone.banned) {
          return res.status(403).json({
            error:
              "هذا الرقم محظور من التطبيق. السبب: " +
              (existingPhone.banReason || "مخالفة شروط الاستخدام"),
          });
        }
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }

      // Create user with teacher role and school context
      const { teacherKey: _, ...userDataWithoutKey } = validatedData;
      const userWithRole = {
        ...userDataWithoutKey,
        role: "teacher",
        schoolId: currentSchool.id,
      };
      const user = await storage.createUser(userWithRole);

      // Create teacher profile in teachers table
      const teacherData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        subject: "مادة عامة", // Default subject for new teacher registration
        bio: undefined,
        imageUrl: undefined,
        available: true,
        schoolId: currentSchool.id,
      };
      await storage.createTeacher(teacherData);

      // Automatically log in the user after successful registration
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      };

      // Remove password from response
      const { password: __, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Teacher registration error:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "يرجى التأكد من صحة جميع البيانات المطلوبة" });
      } else {
        res.status(400).json({
          error: "حدث خطأ في إنشاء حساب المعلم. يرجى المحاولة مرة أخرى",
        });
      }
    }
  });

  // Student account claiming endpoint
  app.post("/api/auth/claim-student-account", async (req, res) => {
    try {
      const { studentId, email, password, name, phone, gender, linkAs } =
        req.body;

      // Get school from session
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res
          .status(400)
          .json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }

      // Validate required fields
      if (!studentId || !email || !password || !name || !phone) {
        return res.status(400).json({ error: "جميع البيانات مطلوبة" });
      }

      // Check if student record exists and is unclaimed
      const unclaimedStudent = await storage.getUnclaimedStudent(
        parseInt(studentId),
        schoolId,
      );
      if (!unclaimedStudent) {
        return res.status(404).json({
          error: "رقم الطالب غير موجود أو تم ربطه بحساب مسبقاً",
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email, schoolId);
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }

      // Check if phone already exists
      const existingPhone = await storage.getUserByPhone(phone, schoolId);
      if (existingPhone) {
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }

      // Create user account with appropriate role based on linkAs
      const userData = {
        email,
        password,
        name,
        phone,
        role: linkAs === "parent" ? "parent" : "student",
        gender,
        schoolId,
      };
      const user = await storage.createUser(userData);

      // Link student record to user account
      await storage.claimStudentAccount(unclaimedStudent.id, user.id);

      // If linking as parent, create parent-child relationship
      if (linkAs === "parent") {
        // Create a child record linking the student to the parent
        await storage.createChild({
          name: unclaimedStudent.name,
          educationLevel: unclaimedStudent.educationLevel,
          grade: unclaimedStudent.grade,
          gender: unclaimedStudent.gender as "male" | "female",
          parentId: user.id,
          schoolId: user.schoolId!,
        });
      }

      // Auto-login the user
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      };

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        student: unclaimedStudent,
        message: "تم ربط الحساب بنجاح",
      });
    } catch (error) {
      console.error("Student claim error:", error);
      res.status(500).json({ error: "حدث خطأ في ربط الحساب" });
    }
  });

  // Check if student ID exists and is available for claiming
  app.post("/api/auth/check-student-id", async (req, res) => {
    try {
      const { studentId } = req.body;

      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة" });
      }

      if (!studentId) {
        return res.status(400).json({ error: "رقم الطالب مطلوب" });
      }

      const student = await storage.getUnclaimedStudent(
        parseInt(studentId),
        schoolId,
      );
      if (student) {
        res.json({
          available: true,
          studentName: student.name,
          educationLevel: student.educationLevel,
          grade: student.grade,
        });
      } else {
        res.json({ available: false });
      }
    } catch (error) {
      console.error("Check student ID error:", error);
      res.status(500).json({ error: "حدث خطأ في التحقق من رقم الطالب" });
    }
  });

  // Middleware to check authentication and school access
  const requireAuth = async (req: any, res: any, next: any) => {
    console.log("Auth check - Session data:", req.session);
    console.log("Auth check - Session user:", req.session?.user);
    const currentUser = req.session.user;
    if (!currentUser) {
      console.log("No currentUser found in session");
      return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
    }

    // Attach user to request for easy access in routes
    req.currentUser = currentUser;

    // CRITICAL: Users can only access data from their registered school
    // Super admins can access all schools
    if (req.session.user.role !== "super_admin") {
      if (!req.session.user.schoolId) {
        return res.status(403).json({
          error: "المستخدم غير مرتبط بأي مدرسة",
        });
      }

      // Check if school access is still enabled - CRITICAL SECURITY
      try {
        const school = await storage.getSchoolById(req.session.user.schoolId);
        if (school && school.isAccessEnabled === false) {
          // Destroy the session to force re-authentication
          req.session.destroy((err: any) => {
            if (err) {
              console.error("Error destroying session:", err);
            }
          });
          return res.status(403).json({
            error: "تم إيقاف الوصول لهذه المدرسة مؤقتاً. يرجى المحاولة لاحقاً أو التواصل مع الإدارة",
          });
        }
      } catch (error) {
        console.error("Error checking school access:", error);
        return res.status(500).json({
          error: "خطأ في التحقق من حالة المدرسة",
        });
      }

      // For regular users, validate school access by checking the schoolId in the request
      // This prevents cross-school data access completely
      req.userSchoolId = req.session.user.schoolId;
    }

    next();
  };

  // Get current user info (for role verification)
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      // Get fresh user data from database including profile picture
      const latestUserData = await storage.getUser(req.session.user.id);
      if (!latestUserData) {
        req.session.user = null; // Clear the session
        return res.status(401).json({ error: "المستخدم غير موجود" });
      }

      // Check if the current user is banned
      if (latestUserData.banned) {
        req.session.user = null; // Clear the session
        return res.status(403).json({
          error:
            "تم حظر حسابك من التطبيق. السبب: " +
            (latestUserData.banReason || "مخالفة شروط الاستخدام"),
        });
      }

      // Update session with fresh data including profile picture
      req.session.user = {
        id: latestUserData.id,
        email: latestUserData.email,
        name: latestUserData.name,
        role: latestUserData.role,
        schoolId: latestUserData.schoolId,
        phone: latestUserData.phone,
        gender: latestUserData.gender,
        profilePicture: latestUserData.profilePicture,
      };

      const { password: _, ...userWithoutPassword } = latestUserData;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    req.session.user = null;
    req.session.userId = undefined;
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });

  // Phone verification routes
  app.post("/api/auth/send-verification-code", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: "رقم الهاتف مطلوب" });
      }

      // Validate phone number format
      if (!SMSService.isValidPhoneNumber(phone)) {
        return res
          .status(400)
          .json({ error: "رقم الهاتف غير صالح. يرجى إدخال رقم جزائري صحيح" });
      }

      // Check if user exists
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Generate verification code
      const verificationCode = SMSService.generateVerificationCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Format phone number for SMS
      const formattedPhone = SMSService.formatPhoneNumber(phone);

      // Send SMS (this will log if Twilio is not configured)
      const smsResult = await SMSService.sendVerificationCode(
        formattedPhone,
        verificationCode,
      );

      // Save verification code to database regardless of SMS success
      await storage.savePhoneVerificationCode(
        user.id,
        verificationCode,
        expiry,
      );

      if (smsResult.success) {
        const responseData: any = {
          message: "تم إرسال رمز التحقق إلى هاتفك",
          phoneNumber: phone.replace(/\d(?=\d{4})/g, "*"), // Hide most digits for security
        };

        // Include development code if available (when SMS providers fail)
        if (smsResult.developmentCode) {
          responseData.developmentCode = smsResult.developmentCode;
          responseData.message = "تم إنشاء رمز التحقق (وضع التطوير)";
        }

        res.json(responseData);
      } else {
        // Handle different error types
        let errorMessage = "رمز التحقق تم إنشاؤه لكن فشل في إرسال الرسالة";

        if (smsResult.error === "trial_account_restriction") {
          errorMessage =
            "حساب Twilio تجريبي - يرجى التحقق من رقم الهاتف في لوحة Twilio أولاً";
        } else if (smsResult.error === "invalid_phone_number") {
          errorMessage = "رقم الهاتف غير صالح أو غير مدعوم";
        } else if (smsResult.error === "SMS service not configured") {
          errorMessage = "خدمة الرسائل القصيرة غير مفعلة حالياً";
        }

        res.json({
          message: errorMessage,
          phoneNumber: phone.replace(/\d(?=\d{4})/g, "*"),
          developmentCode: verificationCode, // Only for development/testing
          smsError: smsResult.error,
        });
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ error: "خطأ في إرسال رمز التحقق" });
    }
  });

  // Update phone verification status (for Firebase verification)
  app.post("/api/auth/update-phone-verification", async (req, res) => {
    try {
      const { phone, verified } = req.body;

      if (!phone || typeof verified !== "boolean") {
        return res
          .status(400)
          .json({ error: "رقم الهاتف وحالة التحقق مطلوبان" });
      }

      // Get user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Update phone verification status
      if (verified) {
        await storage.markPhoneAsVerified(user.id);
      }

      res.json({
        message: "تم تحديث حالة التحقق بنجاح",
        verified: verified,
      });
    } catch (error) {
      console.error("Error updating phone verification:", error);
      res.status(500).json({ error: "خطأ في تحديث حالة التحقق" });
    }
  });

  // Fallback SMS verification route (for when Firebase is not available)
  app.post("/api/auth/verify-phone", async (req, res) => {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res
          .status(400)
          .json({ error: "رقم الهاتف ورمز التحقق مطلوبان" });
      }

      // Get user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Verify code
      const isValid = await storage.verifyPhoneCode(user.id, code);
      if (!isValid) {
        return res
          .status(400)
          .json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
      }

      // Mark phone as verified
      await storage.markPhoneAsVerified(user.id);

      res.json({
        message: "تم التحقق من رقم الهاتف بنجاح",
        verified: true,
      });
    } catch (error) {
      console.error("Error verifying phone:", error);
      res.status(500).json({ error: "خطأ في التحقق من الهاتف" });
    }
  });

  // Email verification routes
  app.post("/api/auth/send-email-verification", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      }

      // Validate email format
      if (!EmailService.isValidEmail(email)) {
        return res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
      }

      // Generate verification code
      const verificationCode = EmailService.generateVerificationCode();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Send email verification code
      const emailResult = await EmailService.sendVerificationCode(
        email,
        verificationCode,
      );

      // Save verification code to database regardless of email success
      await storage.saveEmailVerificationCode(
        req.session.user.id,
        verificationCode,
        expiry,
      );

      if (emailResult.success) {
        const responseData: any = {
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
          email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Hide middle part for security
        };

        // Include development code if available
        if (emailResult.developmentCode) {
          responseData.developmentCode = emailResult.developmentCode;
          responseData.message = "تم إنشاء رمز التحقق (وضع التطوير)";
        }

        res.json(responseData);
      } else {
        res
          .status(500)
          .json({ error: emailResult.error || "حدث خطأ في إرسال الرمز" });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  // Update Firebase UID route
  app.put("/api/auth/update-firebase-uid", async (req, res) => {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
    }

    try {
      const { firebaseUid } = req.body;

      if (!firebaseUid) {
        return res.status(400).json({ error: "Firebase UID مطلوب" });
      }

      const updatedUser = await storage.updateUserFirebaseUid(currentUser.id, firebaseUid);
      
      // Update session
      req.session.user = updatedUser;
      
      res.json({ 
        user: updatedUser,
        message: "تم تحديث Firebase UID بنجاح" 
      });
    } catch (error) {
      console.error("Firebase UID update error:", error);
      res.status(500).json({ error: "خطأ في تحديث Firebase UID" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "رمز التحقق مطلوب" });
      }

      // Verify the code
      const isValid = await storage.verifyEmailCode(req.session.user.id, code);

      if (isValid) {
        // Mark email as verified
        await storage.markEmailAsVerified(req.session.user.id);

        // Update current user session
        req.session.user.emailVerified = true;

        res.json({
          message: "تم التحقق من البريد الإلكتروني بنجاح",
          verified: true,
        });
      } else {
        res
          .status(400)
          .json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  // Serve static files
  app.use("/uploads", express.static(uploadDir));

  // Profile picture routes
  app.post("/api/profile/picture", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { profilePictureUrl } = req.body;

      if (!profilePictureUrl) {
        return res.status(400).json({ error: "رابط الصورة مطلوب" });
      }

      const updatedUser = await storage.updateUserProfilePicture(
        req.session.user.id,
        profilePictureUrl,
      );

      // Update current user session
      req.session.user = updatedUser;

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "فشل في تحديث الصورة الشخصية" });
    }
  });

  // File upload endpoint for profile pictures
  app.post(
    "/api/profile/picture/upload",
    upload.single("profilePicture"),
    async (req, res) => {
      try {
        const currentUser = req.session.user;
        if (!currentUser) {
          return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "لم يتم رفع أي ملف" });
        }

        // Use absolute URL for local storage (Firebase Storage integration to be added later)
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        const updatedUser = await storage.updateUserProfilePicture(
          req.session.user.id,
          fileUrl,
        );

        // Update current user session
        req.session.user = updatedUser;

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ user: userWithoutPassword, fileUrl });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: "فشل في رفع الصورة الشخصية" });
      }
    },
  );

  // General profile update endpoint (name, email)
  app.put("/api/profile", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { name, email } = req.body;

      if (!name && !email) {
        return res.status(400).json({ error: "يجب توفير اسم أو بريد إلكتروني للتحديث" });
      }

      // Check if email already exists for another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email, currentUser.schoolId);
        if (existingUser && existingUser.id !== currentUser.id) {
          return res.status(400).json({ error: "البريد الإلكتروني مستخدم من قبل مستخدم آخر" });
        }
      }

      const updatedUser = await storage.updateUserProfile(currentUser.id, { name, email });

      // Update current user session
      req.session.user = updatedUser;

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "فشل في تحديث الملف الشخصي" });
    }
  });

  // Content upload endpoint for blogs, groups, formations, and school logos
  app.post(
    "/api/upload-content",
    upload.fields([
      { name: "contentImage", maxCount: 1 },
      { name: "logo", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const currentUser = req.session.user;
        if (
          !currentUser ||
          (req.session.user.role !== "admin" &&
            req.session.user.role !== "super_admin")
        ) {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
        }

        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const file = files?.contentImage?.[0] || files?.logo?.[0];

        if (!file) {
          return res.status(400).json({ error: "لم يتم رفع أي ملف" });
        }

        // Create URL for the uploaded file
        const fileUrl = `/uploads/${file.filename}`;

        res.json({
          message: "تم رفع الصورة بنجاح",
          url: fileUrl,
          imageUrl: fileUrl,
        });
      } catch (error) {
        console.error("Error uploading content image:", error);
        res.status(500).json({ error: "فشل في رفع الصورة" });
      }
    },
  );

  // User management routes (Admin only)
  // New endpoint for QR scanner that searches both students and children
  app.get("/api/qr-scanner/search", requireAuth, async (req, res) => {
    try {
      if (!["admin", "teacher"].includes(req.session.user.role)) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      // CRITICAL: Prevent access if user doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res
          .status(403)
          .json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const { search, educationLevel, role } = req.query;

      // Build filter object
      const filters = {
        search: search && typeof search === "string" ? search : undefined,
        educationLevel:
          educationLevel && typeof educationLevel === "string"
            ? educationLevel
            : undefined,
        role: role && typeof role === "string" ? role : undefined,
        schoolId: req.session.user.schoolId,
      };

      // Use new search method that includes both students and children
      const results = await storage.searchStudentsAndChildren(filters);

      res.json(results);
    } catch (error) {
      console.error("Error searching students and children:", error);
      res.status(500).json({ error: "Failed to search students and children" });
    }
  });

  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      // CRITICAL: Prevent access if admin doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res.status(403).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }

      const { search, educationLevel, subject, assignedTeacher, role } =
        req.query;

      // Build filter object
      const filters = {
        search: search && typeof search === "string" ? search : undefined,
        educationLevel:
          educationLevel && typeof educationLevel === "string"
            ? educationLevel
            : undefined,
        subject:
          subject && typeof subject === "string"
            ? parseInt(subject)
            : undefined,
        assignedTeacher:
          assignedTeacher && typeof assignedTeacher === "string"
            ? parseInt(assignedTeacher)
            : undefined,
        role: role && typeof role === "string" ? role : undefined,
      };

      // Use new filtered search method with schoolId filtering
      const users = await storage.searchUsersWithFilters({
        ...filters,
        schoolId: req.session.user.schoolId,
      });

      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // CRITICAL: Prevent access if admin doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res.status(403).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }

      // CRITICAL: Ensure user belongs to admin's school (multi-tenancy)
      if (user.schoolId !== req.session.user.schoolId) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذا المستخدم" });
      }

      // Get user's children
      const children = await storage.getChildrenByParentId(userId);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, children });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/messages", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const userId = parseInt(req.params.id);
      // CRITICAL: Verify user belongs to admin's school before accessing messages
      const user = await storage.getUser(userId);
      if (!user || user.schoolId !== req.session.user.schoolId) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى رسائل هذا المستخدم" });
      }

      const messages = await storage.getMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  });

  // Bulk messaging route (Admin only)
  app.post("/api/messages/bulk", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const { receiverIds, subject, content } = req.body;

      if (
        !receiverIds ||
        !Array.isArray(receiverIds) ||
        receiverIds.length === 0
      ) {
        return res.status(400).json({ error: "يجب تحديد المستلمين" });
      }

      if (!subject || !content) {
        return res.status(400).json({ error: "العنوان والمحتوى مطلوبان" });
      }

      const messages = await storage.createBulkMessage(
        [req.session.user.id], // sender
        receiverIds,
        subject,
        content,
      );

      res.status(201).json({
        message: "تم إرسال الرسائل بنجاح",
        count: messages.length,
        messages,
      });
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      res.status(500).json({ error: "Failed to send bulk messages" });
    }
  });

  // Debug endpoint for school information
  app.get("/api/debug/session", requireAuth, async (req, res) => {
    try {
      const user = req.session.user;
      const school = user.schoolId ? await storage.getSchoolById(user.schoolId) : null;
      
      // Get all schools for debugging
      const allSchools = await storage.getSchools();
      
      res.json({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId
        },
        school: school ? {
          id: school.id,
          name: school.name,
          code: school.code
        } : null,
        allSchools: allSchools.map(s => ({ id: s.id, name: s.name, code: s.code }))
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: "Debug info failed", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Announcement routes
  app.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      const announcements = await storage.getAnnouncementsBySchool(
        req.session.user.schoolId,
      );
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      console.log("Creating announcement - User session:", {
        userId: currentUser.id,
        schoolId: currentUser.schoolId,
        role: currentUser.role
      });

      // Check if schoolId exists
      if (!currentUser.schoolId) {
        console.error("User has no school ID:", currentUser.id);
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة. يرجى تسجيل الدخول مرة أخرى" });
      }

      // Check if school exists or create a default one
      let school = await storage.getSchoolById(currentUser.schoolId);
      let validSchoolId = currentUser.schoolId;
      
      if (!school) {
        console.error("School not found for ID:", currentUser.schoolId);
        
        // Get the first available school as fallback
        const availableSchools = await storage.getSchools();
        if (availableSchools.length > 0) {
          school = availableSchools[0];
          validSchoolId = school.id;
          console.log("Using fallback school:", { id: school.id, name: school.name });
        } else {
          // Create a default school if none exist
          try {
            school = await storage.createSchool({
              name: "المدرسة الافتراضية",
              code: "DEFAULT",
              adminKey: "ADMIN001",
              teacherKey: "TEACHER001"
            });
            validSchoolId = school.id;
            console.log("Created default school:", { id: school.id, name: school.name });
          } catch (createError) {
            console.error("Failed to create default school:", createError);
            return res.status(500).json({ error: "فشل في إنشاء مدرسة افتراضية. يرجى الاتصال بالمدير" });
          }
        }
      }

      console.log("School found:", { id: school.id, name: school.name });

      const validatedData = insertAnnouncementSchema.parse(req.body);

      // Add schoolId for multi-tenancy - use valid school ID
      const announcementData = {
        ...validatedData,
        schoolId: validSchoolId,
        authorId: req.session.user.id,
      };

      console.log("Creating announcement with data:", announcementData);
      const announcement = await storage.createAnnouncement(announcementData);

      // Create notifications for all users about new announcement
      const allUsers = await storage.getAllUsers(validSchoolId);
      const nonAdminUsers = allUsers.filter((u) => u.role !== "admin");
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map((u) => u.id),
          "announcement",
          "📅 إعلان جديد",
          `إعلان جديد: "${announcement.title}"`,
          announcement.id,
          validSchoolId,
        );
      }

      // Send push notification to all users in school
      const notificationPayload =
        PushNotificationService.createAnnouncementNotification(
          announcement.title,
          announcement.content,
        );

      // Fire and forget - don't wait for push notifications
      PushNotificationService.broadcastToSchool(
        validSchoolId,
        notificationPayload,
        [req.session.user.id], // Exclude the admin who created it
      ).catch((error) => {
        console.error("Failed to send announcement push notification:", error);
      });

      res.status(201).json(announcement);
    } catch (error) {
      console.error("Announcement creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid announcement data" });
      }
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.json({ message: "تم حذف الإعلان بنجاح" });
    } catch (error) {
      console.error("Announcement deletion error:", error);
      res.status(500).json({ error: "خطأ في حذف الإعلان" });
    }
  });

  // Blog post routes
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const blogPosts = await storage.getBlogPostsBySchool(
        req.session.user.schoolId,
      );
      res.json(blogPosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPostData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
        authorId: req.session.user.id,
      };
      const blogPost = await storage.createBlogPost(blogPostData);

      // Create notifications for all users about new blog post
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter((u) => u.role !== "admin");
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map((u) => u.id),
          "blog",
          "📚 مقال جديد",
          `تم نشر مقال جديد: "${blogPost.title}"`,
          blogPost.id,
          req.session.user.schoolId,
        );
      }

      res.status(201).json(blogPost);
    } catch (error) {
      res.status(400).json({ error: "Invalid blog post data" });
    }
  });

  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ message: "تم حذف المقال بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Public school directory endpoint
  // School code verification endpoint
  app.post("/api/school/verify-code", async (req, res) => {
    try {
      const { schoolCode } = req.body;

      if (!schoolCode) {
        return res.status(400).json({ error: "رمز المدرسة مطلوب" });
      }

      const school = await storage.getSchoolByCode(schoolCode);

      if (!school) {
        return res.status(404).json({ error: "رمز المدرسة غير صحيح" });
      }

      res.json({
        success: true,
        school: {
          id: school.id,
          name: school.name,
          code: school.code,
        },
      });
    } catch (error) {
      console.error("Error verifying school code:", error);
      res.status(500).json({ error: "فشل في التحقق من رمز المدرسة" });
    }
  });

  // Teacher routes
  app.get("/api/teachers", requireAuth, async (req, res) => {
    try {
      const teachers = await storage.getTeacherUsers(
        req.session.user.schoolId,
      );
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teacher users:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.get(
    "/api/teachers-with-specializations",
    requireAuth,
    async (req, res) => {
      try {
        const teachers = await storage.getTeachersWithSpecializations(
          req.session.user.schoolId,
        );
        res.json(teachers);
      } catch (error) {
        console.error("Error fetching teachers with specializations:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch teachers with specializations" });
      }
    },
  );

  app.post("/api/teachers", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      console.log('=== SERVER Teacher Creation Debug ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User session:', {
        id: req.session.user.id,
        schoolId: req.session.user.schoolId,
        role: req.session.user.role
      });
      
      // Validate the data
      let validatedData;
      try {
        validatedData = insertTeacherSchema.parse(req.body);
        console.log('✓ Validation successful:', validatedData);
      } catch (validationError: any) {
        console.error('✗ Validation failed:', validationError.errors);
        return res.status(400).json({ 
          error: "Invalid teacher data", 
          details: validationError.errors,
          message: validationError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      const teacherData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
      };
      
      console.log('Final teacher data for creation:', JSON.stringify(teacherData, null, 2));
      
      const teacher = await storage.createTeacher(teacherData);
      console.log('✓ Teacher created successfully:', teacher.id);
      res.status(201).json(teacher);
    } catch (error: any) {
      console.error('✗ Teacher creation error:', error);
      res.status(500).json({ error: "Server error", message: error?.message || 'Unknown error' });
    }
  });

  // Get single teacher by ID
  app.get("/api/teachers/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getTeacher(teacherId);
      
      if (!teacher) {
        return res.status(404).json({ error: "لم يتم العثور على المعلم" });
      }

      res.json(teacher);
    } catch (error: any) {
      console.error("Get teacher error:", error);
      res.status(500).json({ error: "خطأ في جلب المعلم", details: error.message });
    }
  });

  // Update teacher (user-based system)
  app.put("/api/teachers/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const userId = parseInt(req.params.id);
      const { name, email, phone, bio, imageUrl, password } = req.body;

      console.log(`Updating teacher user with ID: ${userId}`);

      // Verify the user exists and is a teacher
      const userTeacher = await storage.getUser(userId);
      if (!userTeacher || userTeacher.role !== "teacher") {
        return res.status(404).json({ error: "لم يتم العثور على المعلم" });
      }

      console.log("Updating user-based teacher directly");
      
      // Update user record
      const userData: any = {
        name,
        email,
        phone: phone || null,
        profilePicture: imageUrl || null,
      };
      
      // Only update password if provided
      if (password && password.trim() !== '') {
        userData.password = password;
      }
      
      await storage.updateUser(userId, userData);

      res.json({ message: "تم تحديث المعلم بنجاح" });
    } catch (error: any) {
      console.error("Teacher update error:", error);
      res.status(500).json({ error: "خطأ في تحديث المعلم", details: error.message });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const id = parseInt(req.params.id);
      const adminId = req.session.user.id;
      await storage.deleteTeacher(id, adminId);
      res.json({ message: "تم حذف المعلم بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  });

  // Teacher pre-registration routes
  app.get("/api/teachers/pre-registered", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const preRegisteredTeachers = await storage.getPreRegisteredTeachers(
        req.session.user.schoolId
      );
      res.json(preRegisteredTeachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pre-registered teachers" });
    }
  });

  app.get("/api/teachers/link/:linkCode", async (req, res) => {
    try {
      const { linkCode } = req.params;
      const teacher = await storage.getTeacherByLinkCode(linkCode);
      
      if (!teacher) {
        return res.status(404).json({ error: "رمز الربط غير صالح" });
      }

      // Skip pre-registration check since we're creating user accounts directly

      res.json(teacher);
    } catch (error) {
      res.status(500).json({ error: "Failed to get teacher link information" });
    }
  });

  app.post("/api/teachers/verify/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const teacherId = parseInt(req.params.id);
      const { notes } = req.body;

      const verifiedTeacher = await storage.verifyTeacher(
        teacherId,
        req.session.user.id,
        notes
      );
      res.json(verifiedTeacher);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify teacher" });
    }
  });

  app.post("/api/teachers/link/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      }

      const teacherId = parseInt(req.params.id);
      const linkedTeacher = await storage.linkTeacherToUser(
        teacherId,
        req.session.user.id
      );
      res.json(linkedTeacher);
    } catch (error) {
      res.status(500).json({ error: "Failed to link teacher to user" });
    }
  });

  // Test endpoint to verify server is working
  app.get("/api/test-endpoint", (req, res) => {
    console.log('🧪 Test endpoint hit!');
    res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
  });

  // Create teacher as user account with specializations
  console.log('📝 REGISTERING ENDPOINT: POST /api/users/create-teacher');
  app.post("/api/users/create-teacher", async (req, res) => {
    console.log('🚀 CREATE TEACHER ENDPOINT HIT!');
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
    console.log('Session user:', req.session?.user?.id, req.session?.user?.role);
    
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        console.log('❌ Authentication failed - session:', req.session?.user);
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      console.log('✅ Authentication passed');
      console.log('=== Creating Teacher User ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const { name, email, password, phone, bio, imageUrl, specializations } = req.body;
      console.log('🔍 Extracted specializations from request:', specializations, typeof specializations, Array.isArray(specializations));

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email, req.session.user.schoolId);
      if (existingUser) {
        return res.status(400).json({ error: "البريد الإلكتروني موجود بالفعل" });
      }

      console.log('📝 About to create user with data...');
      
      // Create user account with teacher role  
      const userData = {
        schoolId: req.session.user.schoolId,
        name,
        email,
        phone: phone || null,
        profilePicture: imageUrl || null,
        role: "teacher",
        emailVerified: true, // Pre-verified by admin
        phoneVerified: !!phone, // Verified if phone provided
        password: password, // Use the password provided in the request
        firebaseUid: null
      };
      
      console.log('📋 User data prepared:', userData);
      const teacherUser = await storage.createUser(userData);
      console.log('👤 User created successfully:', teacherUser.id);

      console.log('Teacher user created:', teacherUser.id);

      // Create teacher profile in teachers table
      const teacherData = {
        schoolId: req.session.user.schoolId,
        name: teacherUser.name,
        email: teacherUser.email,
        phone: teacherUser.phone || null,
        subject: specializations && specializations.length > 0 ? specializations[0] : "مادة عامة", // Use first specialization or default
        bio: bio || null,
        imageUrl: teacherUser.profilePicture,
        available: true,
      };
      
      console.log('📋 Teacher data prepared:', teacherData);
      const teacherProfile = await storage.createTeacher(teacherData);
      console.log('👨‍🏫 Teacher profile created successfully:', teacherProfile.id);

      // Handle specializations if provided
      if (specializations && specializations.length > 0) {
        console.log('Processing specializations:', specializations);
        
        for (const specializationItem of specializations) {
          try {
            console.log('Processing specialization item:', specializationItem);
            
            let moduleId;
            
            // Check if we have the new format with moduleId
            if (typeof specializationItem === 'object' && specializationItem.moduleId) {
              moduleId = specializationItem.moduleId;
              console.log('✅ Using provided module ID:', moduleId);
            } else {
              // Fallback to old string parsing method
              const specializationName = typeof specializationItem === 'string' ? specializationItem : specializationItem.subject;
              console.log('📝 Parsing specialization string:', specializationName);
              
              // Parse subject and education level from format like "الرياضيات (المتوسط)"
              const match = specializationName.match(/^(.+?)\s*\((.+?)\)$/);
              const subjectName = match ? match[1].trim() : specializationName;
              const educationLevel = match ? match[2].trim() : 'عام';
              
              console.log('Parsed subject:', subjectName, 'level:', educationLevel);
              
              // Find or create teaching module
              console.log(`🔍 Looking for teaching module: "${subjectName}" at level "${educationLevel}"`);
              let teachingModule = await storage.getTeachingModuleByName(subjectName, educationLevel);
              console.log('🔍 Found existing module:', teachingModule ? `ID: ${teachingModule.id}` : 'NOT FOUND');
              
              if (!teachingModule) {
                console.log('🔧 Creating new teaching module...');
                const moduleData = {
                  name: subjectName, // English name (same as Arabic for now)
                  nameAr: subjectName, // Arabic name
                  educationLevel,
                  description: null,
                };
                console.log('📋 Module data to create:', moduleData);
                teachingModule = await storage.createTeachingModule(moduleData);
                console.log('📚 Created new teaching module:', teachingModule.id);
              } else {
                console.log('📚 Using existing teaching module:', teachingModule.id);
              }
              
              moduleId = teachingModule.id;
            }
            
            // Create teacher specialization link
            const specializationData = {
              schoolId: req.session.user.schoolId, // Required school ID
              teacherId: teacherUser.id, // Use the user ID as teacher ID (correct)
              moduleId: moduleId, // Use the module ID directly
            };
            
            console.log('🔧 Creating teacher specialization with data:', specializationData);
            const specialization = await storage.createTeacherSpecialization(specializationData);
            console.log('🎯 Created specialization successfully:', specialization.id);
            
          } catch (specError) {
            console.error('Error processing specialization:', specializationItem, specError);
            // Continue with other specializations even if one fails
          }
        }
      }

      console.log('✓ Teacher created successfully with all data:', teacherUser.id);
      res.status(201).json(teacherUser);
    } catch (error: any) {
      console.error('✗ Teacher user creation error:', error);
      res.status(500).json({ error: "Server error", message: error?.message || 'Unknown error' });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Enhanced messages with user info
  app.get("/api/messages/with-user-info", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const messages = await storage.getMessagesWithUserInfo(
        req.session.user.id,
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages with user info:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get conversation history between current user and another user
  app.get("/api/messages/conversation/:userId", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const otherUserId = parseInt(req.params.userId);
      const conversation = await storage.getConversationBetweenUsers(
        req.session.user.id,
        otherUserId,
      );
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Mark message as read
  app.post("/api/messages/:id/mark-read", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ message: "تم تحديد الرسالة كمقروءة" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Block user
  app.post("/api/block-user", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { blockedId, reason } = req.body;

      if (!blockedId) {
        return res
          .status(400)
          .json({ error: "معرف المستخدم المراد حظره مطلوب" });
      }

      if (blockedId === req.session.user.id) {
        return res.status(400).json({ error: "لا يمكنك حظر نفسك" });
      }

      const blockedUser = await storage.blockUser(
        req.session.user.id,
        blockedId,
        reason,
        req.session.user.schoolId,
      );
      res.json({ message: "تم حظر المستخدم بنجاح", blockedUser });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Unblock user
  app.post("/api/unblock-user", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { blockedId } = req.body;

      if (!blockedId) {
        return res
          .status(400)
          .json({ error: "معرف المستخدم المراد إلغاء حظره مطلوب" });
      }

      await storage.unblockUser(req.session.user.id, blockedId);
      res.json({ message: "تم إلغاء حظر المستخدم بنجاح" });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // Get blocked users
  app.get("/api/blocked-users", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const blockedUsers = await storage.getBlockedUsers(req.session.user.id);
      res.json(blockedUsers);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      res.status(500).json({ error: "Failed to fetch blocked users" });
    }
  });

  // Report user
  app.post("/api/report-user", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { reportedUserId, messageId, reason, description } = req.body;

      if (!reportedUserId || !reason) {
        return res
          .status(400)
          .json({ error: "معرف المستخدم المراد الإبلاغ عنه والسبب مطلوبان" });
      }

      if (reportedUserId === req.session.user.id) {
        return res.status(400).json({ error: "لا يمكنك الإبلاغ عن نفسك" });
      }

      const reportData = {
        reporterId: req.session.user.id,
        reportedUserId,
        messageId,
        reason,
        description,
        schoolId: req.session.user.schoolId,
      };

      const report = await storage.reportUser(reportData);
      res.json({ message: "تم الإبلاغ بنجاح", report });
    } catch (error) {
      console.error("Error reporting user:", error);
      res.status(500).json({ error: "Failed to report user" });
    }
  });

  // Admin routes for reports and user management
  app.get("/api/admin/reports", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      // Pass schoolId to only get reports for this admin's school
      const reports = await storage.getAllReports(req.session.user.schoolId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.patch("/api/admin/reports/:id/status", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const reportId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "حالة الإبلاغ مطلوبة" });
      }

      const report = await storage.updateReportStatus(reportId, status);
      res.json({ message: "تم تحديث حالة الإبلاغ", report });
    } catch (error) {
      console.error("Error updating report status:", error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  app.post("/api/admin/ban-user", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const { userId, reason } = req.body;

      if (!userId || !reason) {
        return res
          .status(400)
          .json({ error: "معرف المستخدم وسبب الحظر مطلوبان" });
      }

      if (userId === req.session.user.id) {
        return res.status(400).json({ error: "لا يمكنك حظر نفسك" });
      }

      const bannedUser = await storage.banUser(
        userId,
        reason,
        req.session.user.id,
      );
      res.json({ message: "تم حظر المستخدم بنجاح", user: bannedUser });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/unban-user", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      }

      const unbannedUser = await storage.unbanUser(userId);
      res.json({ message: "تم إلغاء حظر المستخدم بنجاح", user: unbannedUser });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.get("/api/admin/banned-users", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const bannedUsers = await storage.getBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      console.error("Error fetching banned users:", error);
      res.status(500).json({ error: "Failed to fetch banned users" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      console.log("Received message request:", req.body);
      console.log("Session user:", req.session.user);

      // Validate the request body
      const validatedData = insertMessageSchema.parse(req.body);
      console.log("Validated data:", validatedData);

      // Check if the sender is blocked by the receiver
      const isBlocked = await storage.isUserBlocked(
        validatedData.receiverId!,
        validatedData.senderId!,
      );
      if (isBlocked) {
        return res.status(403).json({
          error: "لا يمكنك إرسال رسائل لهذا المستخدم. تم حظرك من قبل المستخدم",
        });
      }

      // Add school context to message
      const messageData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
      };

      const message = await storage.createMessage(messageData);
      console.log("Created message:", message);

      // Create notification for message receiver
      const sender = await storage.getUser(message.senderId!);
      await storage.createNotification({
        schoolId: req.session.user.schoolId!,
        userId: message.receiverId!,
        type: "message",
        title: "💬 رسالة جديدة",
        message: `رسالة جديدة من ${sender?.name}: "${message.subject}"`,
        relatedId: message.id,
      });

      // Send push notification to message receiver
      if (sender) {
        const notificationPayload =
          PushNotificationService.createMessageNotification(
            sender.name,
            message.content,
          );

        // Fire and forget - don't wait for push notifications
        PushNotificationService.sendToUser(
          req.session.user.schoolId!,
          message.receiverId!,
          notificationPayload,
        ).catch((error) => {
          console.error("Failed to send message push notification:", error);
        });
      }

      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      if (error.name === "ZodError") {
        console.error("Validation error details:", error.errors);
        res.status(400).json({
          error: "خطأ في بيانات الرسالة",
          details: error.errors,
        });
      } else {
        res.status(400).json({ error: "Invalid message data" });
      }
    }
  });

  // Suggestion routes
  app.get("/api/suggestions", requireAuth, async (req, res) => {
    try {
      // CRITICAL: Prevent access if user doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res
          .status(403)
          .json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const suggestions = await storage.getSuggestions(
        req.session.user.schoolId,
      );
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.post("/api/suggestions", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      console.log("Suggestion request body:", req.body);
      const validatedData = insertSuggestionSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const suggestionData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
      };
      console.log("Suggestion data with school:", suggestionData);
      const suggestion = await storage.createSuggestion(suggestionData);

      // Create notification for admins about new suggestion
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const adminUsers = allUsers.filter((u) => u.role === "admin");
      if (adminUsers.length > 0) {
        await storage.createNotificationForUsers(
          adminUsers.map((u) => u.id),
          "suggestion",
          "📥 اقتراح جديد",
          `تم تقديم اقتراح جديد: "${suggestion.title}"`,
          suggestion.id,
          req.session.user.schoolId,
        );
      }

      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Suggestion creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({
          error:
            "بيانات الاقتراح غير صحيحة: " +
            error.errors.map((e) => e.message).join(", "),
        });
      } else {
        res
          .status(400)
          .json({ error: "فشل في إرسال الاقتراح. يرجى المحاولة مرة أخرى" });
      }
    }
  });
  // Group routes
  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getAdminGroups(req.session.user.schoolId);
      // Filter out placeholder groups and only return real groups with student data
      const realGroups = groups.filter(group => !group.isPlaceholder).map(group => ({
        id: group.id,
        name: group.name,
        subjectName: group.subjectName,
        subjectNameAr: group.nameAr,
        educationLevel: group.educationLevel,
        grade: group.grade,
        teacherId: group.teacherId,
        studentsAssigned: group.studentsAssigned || []
      }));
      res.json(realGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const validatedData = insertGroupSchema.parse(req.body);
      const groupData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
      };
      const group = await storage.createGroup(groupData);

      // Create notifications for all users about new group
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter((u) => u.role !== "admin");
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map((u) => u.id),
          "group_update",
          "👥 مجموعة جديدة",
          `تم إنشاء مجموعة جديدة: "${group.name}"`,
          group.id,
          req.session.user.schoolId,
        );
      }

      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.json({ message: "تم حذف المجموعة بنجg  �ح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Schedule Group Linking routes
  app.get("/api/groups/compatible", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const { subjectId, teacherId, educationLevel } = req.query;

      console.log("Compatible groups request params:", {
        subjectId,
        teacherId,
        educationLevel,
        schoolId: req.session.user.schoolId,
      });

      if (!subjectId || !teacherId) {
        return res.status(400).json({ error: "معاملات البحث مطلوبة" });
      }

      const compatibleGroups = await storage.getCompatibleGroups(
        parseInt(subjectId as string),
        parseInt(teacherId as string),
        educationLevel as string || 'all',
        req.session.user.schoolId,
      );

      console.log("Found compatible groups:", compatibleGroups);
      res.json(compatibleGroups);
    } catch (error) {
      console.error("Error fetching compatible groups:", error);
      res.status(500).json({ error: "فشل في جلب المجموعات المتوافقة" });
    }
  });

  app.get("/api/schedule-cells/linked-groups/:tableId", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const tableId = parseInt(req.params.tableId);
      const linkedGroups = await storage.getScheduleLinkedGroups(
        tableId,
        req.session.user.schoolId,
      );

      res.json(linkedGroups);
    } catch (error) {
      console.error("Error fetching linked groups:", error);
      res.status(500).json({ error: "فشل في جلب المجموعات المربوطة" });
    }
  });

  app.post("/api/schedule-cells/:cellId/link-groups", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const cellId = parseInt(req.params.cellId);
      const { groupIds } = req.body;

      if (!Array.isArray(groupIds)) {
        return res.status(400).json({ error: "قائمة المجموعات مطلوبة" });
      }

      await storage.linkGroupsToScheduleCell(
        cellId,
        groupIds,
        req.session.user.schoolId,
        req.session.user.id,
      );

      res.json({ message: "تم ربط المجموعات بالحصة بنجاح" });
    } catch (error) {
      console.error("Error linking groups to schedule cell:", error);
      res.status(500).json({ error: "فشل في ربط المجموعات بالحصة" });
    }
  });

  // Group attendance history endpoint for read-only access
  app.get(
    "/api/groups/:id/attendance-history",
    requireAuth,
    async (req, res) => {
      try {
        const groupId = parseInt(req.params.id);
        const schoolId = req.session.user!.schoolId!;

        if (!groupId) {
          return res.status(400).json({ error: "معرف المجموعة مطلوب" });
        }

        const attendanceHistory = await storage.getGroupAttendanceHistory(
          groupId,
          schoolId,
        );
        res.json(attendanceHistory);
      } catch (error) {
        console.error("Error fetching group attendance history:", error);
        res.status(500).json({ error: "فشل في جلب سجل الحضور" });
      }
    },
  );

  // Group scheduled dates endpoint for read-only access
  app.get("/api/groups/:id/scheduled-dates", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const schoolId = req.session.user!.schoolId!;

      if (!groupId) {
        return res.status(400).json({ error: "معرف المجموعة مطلوب" });
      }

      const scheduledDates = await storage.getGroupScheduledLessonDates(
        groupId,
        schoolId,
      );
      res.json({ dates: scheduledDates });
    } catch (error) {
      console.error("Error fetching group scheduled dates:", error);
      res.status(500).json({ error: "فشل في جلب مواعيد الحصص" });
    }
  });

  // Get student record by user ID
  app.get("/api/student-by-user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const schoolId = req.session.user!.schoolId!;

      if (!userId) {
        return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      }

      // Check if user is requesting their own student record or is admin/teacher
      if (req.session.user!.id !== userId && 
          !['admin', 'teacher', 'super_admin'].includes(req.session.user!.role)) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }

      const student = await storage.getStudentByUserId(userId);
      
      if (!student) {
        return res.status(404).json({ error: "لم يتم العثور على سجل طالب لهذا المستخدم" });
      }

      // Verify student belongs to same school
      if (student.schoolId !== schoolId) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }

      res.json(student);
    } catch (error) {
      console.error("Error fetching student by user ID:", error);
      res.status(500).json({ error: "فشل في جلب بيانات الطالب" });
    }
  });

  // Admin group management routes
  app.get("/api/admin/groups", async (req, res) => {
    try {
      console.log("🔍 Admin groups access attempt:", {
        sessionExists: !!req.session,
        userExists: !!req.session?.user,
        userRole: req.session?.user?.role,
        sessionId: req.session?.id,
        query: req.query,
      });

      if (
        !req.session.user ||
        (req.session.user.role !== "admin" &&
          req.session.user.role !== "super_admin")
      ) {
        console.log("❌ Access denied - role check failed");
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      // Handle super admin vs regular admin
      if (req.session.user.role === "super_admin") {
        // Super admins need to specify a schoolId via query parameter
        const schoolId = req.query.schoolId
          ? parseInt(req.query.schoolId as string)
          : null;
        if (!schoolId) {
          // Return empty array for super admin without schoolId context
          // Frontend should handle school selection for super admins
          return res.json([]);
        }
        const adminGroups = await storage.getAdminGroups(schoolId);
        res.json(adminGroups);
      } else {
        // Regular admin - must have schoolId
        if (!req.session.user.schoolId) {
          return res
            .status(403)
            .json({ error: "المدير غير مرتبط بمدرسة محددة" });
        }
        const adminGroups = await storage.getAdminGroups(
          req.session.user.schoolId,
        );
        res.json(adminGroups);
      }
    } catch (error) {
      console.error("Error in /api/admin/groups:", error);
      res.status(500).json({ error: "Failed to fetch admin groups" });
    }
  });

  app.get(
    "/api/admin/groups/students/:educationLevel/:subjectId",
    async (req, res) => {
      try {
        if (!req.session.user) {
          return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
        }

        if (req.session.user.role !== "admin") {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
        }

        const educationLevel = req.params.educationLevel;
        const subjectId = parseInt(req.params.subjectId);

        console.log(
          `[DEBUG] Available students API called with: educationLevel=${educationLevel}, subjectId=${subjectId}, schoolId=${req.session.user.schoolId}`,
        );
        const availableStudents =
          await storage.getAvailableStudentsByLevelAndSubject(
            educationLevel,
            subjectId,
            req.session.user.schoolId,
          );
        console.log(
          `[DEBUG] Returning ${availableStudents.length} available students to frontend`,
        );
        res.json(availableStudents);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch available students" });
      }
    },
  );

  app.put("/api/admin/groups/:id/assignments", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const groupId = req.params.id === "null" ? null : parseInt(req.params.id);
      const { studentIds, teacherId, groupData } = req.body;

      if (!Array.isArray(studentIds) || typeof teacherId !== "number") {
        return res.status(400).json({ error: "Invalid assignment data" });
      }

      const updatedGroup = await storage.updateGroupAssignments(
        groupId,
        studentIds,
        teacherId,
        groupData,
        req.session.user.schoolId,
        req.session.user.id,
      );
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group assignments:", error);
      res.status(500).json({ error: "Failed to update group assignments" });
    }
  });

  // Delete group route
  app.delete("/api/admin/groups/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const groupId = parseInt(req.params.id);

      if (isNaN(groupId)) {
        return res.status(400).json({ error: "معرف المجموعة غير صحيح" });
      }

      await storage.deleteGroup(groupId, req.session.user.schoolId);

      // If no error was thrown, the deletion was successful
      res.json({ success: true, message: "تم حذف المجموعة بنجاح" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "فشل في حذف المجموعة" });
    }
  });

  // Create new group route
  app.post("/api/admin/create-group", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const { level, grade, subjectId, identifier } = req.body;

      if (!level || !grade || !subjectId) {
        return res.status(400).json({
          error: "المستوى التعليمي والسنة الدراسية والمادة مطلوبة",
        });
      }

      // Get subject name for group naming
      const subject = await storage.getTeachingModuleById(parseInt(subjectId));
      if (!subject) {
        return res.status(400).json({ error: "المادة المحددة غير موجودة" });
      }

      // Check for existing groups with same subject/level/grade
      const existingGroups = await storage.getGroupsBySubjectAndGrade(
        parseInt(subjectId),
        level,
        grade,
        req.session.user.schoolId,
      );

      // Determine group number for automatic numbering
      const nextGroupNumber = existingGroups.length + 1;

      // Create group name with automatic numbering or custom identifier
      let groupName = subject.nameAr || subject.name;
      if (nextGroupNumber > 1) {
        if (identifier.trim()) {
          groupName = `${groupName} - ${identifier.trim()}`;
        } else {
          groupName = `${groupName} (${nextGroupNumber})`;
        }
      } else if (identifier.trim()) {
        groupName = `${groupName} - ${identifier.trim()}`;
      }

      // Create the group
      const newGroup = await storage.createNewGroup({
        schoolId: req.session.user.schoolId,
        name: groupName,
        description: `مجموعة تعليمية لمادة ${subject.nameAr || subject.name} - ${grade}`,
        category: "دراسية",
        educationLevel: level,
        grade: grade,
        subjectId: parseInt(subjectId),
        groupNumber: nextGroupNumber,
        isAdminManaged: true,
      });

      res.status(201).json({
        group: newGroup,
        groupName: groupName,
        message: `تم إنشاء المجموعة "${groupName}" بنجاح`,
      });
    } catch (error) {
      console.error("Error creating new group:", error);
      res.status(500).json({ error: "فشل في إنشاء المجموعة الجديدة" });
    }
  });

  // Custom subjects route
  app.post("/api/admin/custom-subjects", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const { name, nameAr, educationLevel, grade } = req.body;

      // ✅ FIX: Allow "All Levels" subjects without requiring grade
      const isAllLevels = educationLevel === "جميع المستويات";
      
      if (!name || !nameAr || !educationLevel || (!isAllLevels && !grade)) {
        return res.status(400).json({
          error: isAllLevels 
            ? "اسم المادة والمستوى التعليمي مطلوبان"
            : "اسم المادة والمستوى التعليمي والسنة الدراسية مطلوبان",
        });
      }

      // Check if custom subject already exists for this specific education level and grade
      const existingSubject = await storage.getTeachingModuleByNameAndGrade(
        nameAr,
        educationLevel,
        grade || "جميع الصفوف", // Use default for universal subjects
      );
      if (existingSubject) {
        return res.status(400).json({
          error: isAllLevels 
            ? `المادة "${nameAr}" موجودة بالفعل للمستوى "${educationLevel}"`
            : `المادة "${nameAr}" موجودة بالفعل للمستوى "${educationLevel}" - ${grade}`,
        });
      }

      // Create subject for specific education level and grade (or universal)
      const customSubject = await storage.createCustomSubject({
        name,
        nameAr,
        educationLevel,
        grade: grade || "جميع الصفوف", // Use default for universal subjects
        description: isAllLevels 
          ? `مادة مخصصة عامة تم إنشاؤها بواسطة الإدارة - متاحة لجميع المستويات`
          : `مادة مخصصة تم إنشاؤها بواسطة الإدارة - ${educationLevel} ${grade}`,
        schoolId: req.session.user.schoolId, // ✅ FIX: Add schoolId for proper assignment
      });

      let createdSubjects = [customSubject];

      res.status(201).json({
        subjects: createdSubjects,
        message: isAllLevels
          ? `تم إنشاء المادة العامة "${nameAr}" بنجاح - متاحة لجميع المستويات التعليمية`
          : `تم إنشاء المادة "${nameAr}" للمستوى "${educationLevel} - ${grade}" بنجاح`,
      });
    } catch (error) {
      console.error("Error creating custom subject:", error);
      res.status(500).json({ error: "Failed to create custom subject" });
    }
  });

  // Fix missing custom subjects for existing groups
  app.post("/api/admin/fix-custom-subjects", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const schoolId = req.session.user.schoolId;
      
      // Get groups that have missing subjects (subjectIds 1413, 1414)
      const problemGroups = await storage.getGroupsBySubjectIds([1413, 1414], schoolId);
      
      if (problemGroups.length === 0) {
        return res.json({ message: "لا توجد مجموعات تحتاج إصلاح", fixedGroups: [] });
      }

      const fixedGroups = [];

      for (const group of problemGroups) {
        let customSubject = null;
        
        if (group.subjectId === 1413) {
          // Create chess custom subject
          customSubject = await storage.createCustomSubject({
            name: "Chess",
            nameAr: "الشطرنج",
            educationLevel: "جميع المستويات",
            grade: "جميع الصفوف",
            description: "مادة مخصصة للشطرنج تم إنشاؤها بواسطة الإدارة",
            schoolId: schoolId,
          });
        } else if (group.subjectId === 1414) {
          // Create programming custom subject
          customSubject = await storage.createCustomSubject({
            name: "Programming",
            nameAr: "البرمجة",
            educationLevel: "جميع المستويات", 
            grade: "جميع الصفوف",
            description: "مادة مخصصة للبرمجة تم إنشاؤها بواسطة الإدارة",
            schoolId: schoolId,
          });
        }

        if (customSubject) {
          // Update group to reference the new custom subject
          await storage.updateGroupSubject(group.id, customSubject.id, schoolId);
          fixedGroups.push({
            groupId: group.id,
            groupName: group.name,
            oldSubjectId: group.subjectId,
            newSubjectId: customSubject.id,
            subjectName: customSubject.nameAr
          });
        }
      }

      res.json({
        message: `تم إصلاح ${fixedGroups.length} مجموعة بنجاح`,
        fixedGroups: fixedGroups
      });
    } catch (error) {
      console.error("Error fixing custom subjects:", error);
      res.status(500).json({ error: "Failed to fix custom subjects" });
    }
  });

  // Formation routes
  app.get("/api/formations", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const formations = await storage.getFormationsBySchool(
        req.session.user.schoolId,
      );
      res.json(formations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formations" });
    }
  });

  app.post("/api/formations", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const validatedData = insertFormationSchema.parse(req.body);
      const formationData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
      };
      const formation = await storage.createFormation(formationData);

      // Create notifications for all users about new formation
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter((u) => u.role !== "admin");
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map((u) => u.id),
          "formation_update",
          "🎓 تدريب جديد",
          `تم إنشاء تدريب جديد: "${formation.title}"`,
          formation.id,
          req.session.user.schoolId,
        );
      }

      res.status(201).json(formation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation data" });
    }
  });

  app.delete("/api/formations/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteFormation(id);
      res.json({ message: "تم حذف التكوين بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete formation" });
    }
  });

  // Children routes
  app.get("/api/children", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const children = await storage.getChildrenByParentId(req.session.user.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.post("/api/children", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const childData = {
        parentId: req.session.user.id,
        name: req.body.name,
        gender: req.body.gender,
        educationLevel: req.body.educationLevel,
        grade: req.body.grade,
        schoolId: req.session.user.schoolId,
      };

      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.delete("/api/children/:id", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const childId = parseInt(req.params.id);
      await storage.deleteChild(childId);
      res.json({ message: "تم حذف الطفل بنجاح" });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete child" });
    }
  });

  // Registration routes
  app.post("/api/group-registrations", async (req, res) => {
    try {
      const validatedData = insertGroupRegistrationSchema.parse(req.body);
      const registration = await storage.createGroupRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ error: "Invalid group registration data" });
    }
  });

  app.post("/api/formation-registrations", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      console.log("Formation registration attempt:", {
        body: req.body,
        user: currentUser?.email,
        schoolId: currentUser?.schoolId
      });

      const validatedData = formationRegistrationClientSchema.parse(req.body);
      console.log("Schema validation passed:", validatedData);
      
      // Check if formation exists
      const formation = await storage.getFormationById(validatedData.formationId);
      if (!formation) {
        return res.status(400).json({ error: "التكوين المحدد غير موجود" });
      }
      console.log("Formation found:", formation);

      const registrationData = {
        ...validatedData,
        schoolId: currentUser.schoolId,
      };
      console.log("Final registration data:", registrationData);
      console.log("Data types:", {
        formationId: typeof registrationData.formationId,
        schoolId: typeof registrationData.schoolId,
        userId: typeof registrationData.userId,
        fullName: typeof registrationData.fullName,
        phone: typeof registrationData.phone,
        email: typeof registrationData.email,
      });
      
      // Validate final data against server schema
      const serverValidatedData = insertFormationRegistrationSchema.parse(registrationData);
      console.log("Server validation passed:", serverValidatedData);
      
      const registration = await storage.createFormationRegistration(serverValidatedData);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Formation registration error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      console.error("Request body:", req.body);
      res.status(400).json({ error: `Invalid formation registration data: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Check if user is registered for a specific formation
  app.get("/api/formation-registrations/check/:formationId", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const formationId = parseInt(req.params.formationId);
      const userId = req.session.user.id;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const isRegistered = await storage.isUserRegisteredForFormation(userId, formationId, schoolId);
      res.json({ isRegistered });
    } catch (error) {
      console.error("Registration check error:", error);
      res.status(500).json({ error: "Failed to check registration status" });
    }
  });

  app.get("/api/formation-registrations", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const registrations = await storage.getFormationRegistrations(schoolId);
      
      // If not admin, return only user's own registrations
      if (req.session.user.role !== "admin") {
        const userRegistrations = registrations.filter(reg => reg.userId === req.session.user.id);
        return res.json(userRegistrations);
      }
      
      // Admin gets all registrations
      res.json(registrations);
    } catch (error) {
      console.error("Formation registrations fetch error:", error);
      res.status(500).json({ error: "Failed to fetch formation registrations" });
    }
  });

  // COURSES API ROUTES
  app.get("/api/courses", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const courses = await storage.getCourses(schoolId);
      res.json(courses);
    } catch (error) {
      console.error("Courses fetch error:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "ليس لديك صلاحية إنشاء الدورات" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const insertCourseData = {
        ...req.body,
        schoolId,
      };

      const course = await storage.createCourse(insertCourseData);
      res.json(course);
    } catch (error) {
      console.error("Course creation error:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "ليس لديك صلاحية تعديل الدورات" });
      }

      const courseId = parseInt(req.params.id);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const course = await storage.updateCourse(courseId, req.body, schoolId);
      res.json(course);
    } catch (error) {
      console.error("Course update error:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "ليس لديك صلاحية حذف الدورات" });
      }

      const courseId = parseInt(req.params.id);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      await storage.deleteCourse(courseId, schoolId);
      res.json({ success: true });
    } catch (error) {
      console.error("Course deletion error:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Course Registration Routes
  app.post("/api/course-registrations", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const schoolId = req.session.user.schoolId;
      const userId = req.session.user.id;

      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      // For new students without accounts, don't assign userId
      const registrationData = {
        ...req.body,
        schoolId,
        userId: req.body.isNewStudent ? null : userId,
      };

      const registration = await storage.createCourseRegistration(registrationData);
      res.json(registration);
    } catch (error) {
      console.error("Course registration error:", error);
      res.status(400).json({ error: `Invalid course registration data: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Check if user is registered for a specific course
  app.get("/api/course-registrations/check/:courseId", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const courseId = parseInt(req.params.courseId);
      const userId = req.session.user.id;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const isRegistered = await storage.isUserRegisteredForCourse(userId, courseId, schoolId);
      res.json({ isRegistered });
    } catch (error) {
      console.error("Course registration check error:", error);
      res.status(500).json({ error: "Failed to check course registration status" });
    }
  });

  // Check if child is registered for a specific course
  app.get("/api/course-registrations/check/:courseId/child/:childId", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const courseId = parseInt(req.params.courseId);
      const childId = parseInt(req.params.childId);
      const userId = req.session.user.id;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const isRegistered = await storage.isChildRegisteredForCourse(userId, childId, courseId, schoolId);
      res.json({ isRegistered });
    } catch (error) {
      console.error("Child course registration check error:", error);
      res.status(500).json({ error: "Failed to check child course registration status" });
    }
  });

  // Update course registration payment status
  app.put("/api/course-registrations/:id/payment", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لتحديث حالة الدفع" });
      }

      const registrationId = parseInt(req.params.id);
      const schoolId = req.session.user.schoolId;
      
      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const updateData = {
        paymentStatus: req.body.paymentStatus,
        paidAt: req.body.paidAt ? new Date(req.body.paidAt) : null,
        paidBy: req.body.paidBy,
        receiptId: req.body.receiptId
      };

      const updatedRegistration = await storage.updateCourseRegistrationPayment(
        registrationId,
        schoolId,
        updateData
      );

      res.json(updatedRegistration);
    } catch (error) {
      console.error("Update course registration payment error:", error);
      res.status(500).json({ error: "فشل في تحديث حالة الدفع" });
    }
  });

  app.get("/api/course-registrations", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }

      const registrations = await storage.getCourseRegistrations(schoolId);
      
      // Return all registrations for the school
      // This allows students to check if they're already registered
      // and admins to see all registration info
      res.json(registrations);
    } catch (error) {
      console.error("Course registrations fetch error:", error);
      res.status(500).json({ error: "Failed to fetch course registrations" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const notifications = await storage.getNotifications(
        req.session.user.id,
        req.session.user.schoolId,
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const count = await storage.getUnreadNotificationCount(
        req.session.user.id,
        req.session.user.schoolId,
      );
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // QR Code Routes
  app.get("/api/qrcode/:type/:id", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { type, id } = req.params;
      const studentId = parseInt(id);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم اختيار مدرسة" });
      }

      if (type !== "student" && type !== "child") {
        return res.status(400).json({ error: "نوع غير صحيح" });
      }

      // Check access permissions and verification status
      if (req.session.user.role === "parent") {
        // Parents can only access QR codes of their children AND must be verified
        if (!req.session.user.verified) {
          return res
            .status(403)
            .json({ error: "يجب التحقق من هويتك أولاً للوصول للرموز" });
        }

        if (type === "child") {
          const children = await storage.getChildrenByParentId(
            req.session.user.id,
          );
          const hasAccess = children.some((child) => child.id === studentId);
          if (!hasAccess) {
            return res
              .status(403)
              .json({ error: "غير مسموح لك بالوصول لهذا الرمز" });
          }
        } else {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول لرموز الطلاب" });
        }
      } else if (req.session.user.role === "student") {
        // Students can only access their own QR code AND must be verified
        if (!req.session.user.verified) {
          return res
            .status(403)
            .json({ error: "يجب التحقق من هويتك أولاً للحصول على الرمز" });
        }

        if (type !== "student") {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول لهذا الرمز" });
        }
        const student = await storage.getStudentByUserId(req.session.user.id);
        if (!student || student.id !== studentId) {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول لهذا الرمز" });
        }
      }
      // Admins and teachers can access all QR codes without verification requirement

      const qrData = await storage.getStudentQRCode(
        studentId,
        type as "student" | "child",
      );

      if (!qrData) {
        return res.status(404).json({ error: "لم يتم العثور على الرمز" });
      }

      res.json(qrData);
    } catch (error) {
      console.error("Error getting QR code:", error);
      res.status(500).json({ error: "فشل في جلب الرمز" });
    }
  });

  app.post("/api/qrcode/:type/:id/regenerate", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { type, id } = req.params;
      const studentId = parseInt(id);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم اختيار مدرسة" });
      }

      if (type !== "student" && type !== "child") {
        return res.status(400).json({ error: "نوع غير صحيح" });
      }

      // Only admins can regenerate QR codes
      if (req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بإعادة توليد الرموز" });
      }

      const qrData = await storage.regenerateStudentQRCode(
        studentId,
        type as "student" | "child",
      );

      res.json(qrData);
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      res.status(500).json({ error: "فشل في إعادة توليد الرمز" });
    }
  });

  // Get current student data for logged-in student user
  app.get("/api/students/me", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (req.session.user.role !== "student") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول لهذه البيانات" });
      }

      const student = await storage.getStudentByUserId(req.session.user.id);

      if (!student) {
        return res
          .status(404)
          .json({ error: "لم يتم العثور على بيانات الطالب" });
      }

      res.json(student);
    } catch (error) {
      console.error("Error getting student data:", error);
      res.status(500).json({ error: "فشل في جلب بيانات الطالب" });
    }
  });

  // Get current school information
  app.get("/api/school/current", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (!req.session.user.schoolId) {
        return res.status(404).json({ error: "لا توجد مدرسة مرتبطة بالحساب" });
      }

      const school = await storage.getSchoolById(req.session.user.schoolId);

      if (!school) {
        return res.status(404).json({ error: "لم يتم العثور على بيانات المدرسة" });
      }

      res.json({
        id: school.id,
        name: school.name,
        code: school.code
      });
    } catch (error) {
      console.error("Error getting school data:", error);
      res.status(500).json({ error: "فشل في جلب بيانات المدرسة" });
    }
  });

  // Get detailed school information (All authenticated users can view)
  app.get("/api/school/info", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Allow all authenticated users to view school information
      // (Only editing requires admin privileges)

      if (!req.session.user.schoolId) {
        return res.status(404).json({ error: "لا توجد مدرسة مرتبطة بالحساب" });
      }

      const school = await storage.getSchoolById(req.session.user.schoolId);

      if (!school) {
        return res.status(404).json({ error: "لم يتم العثور على بيانات المدرسة" });
      }

      res.json({
        id: school.id,
        name: school.name,
        wilaya: school.location || '',
        fullAddress: school.fullAddress || '',
        adminPhone: school.adminPhone || '',
        schoolEmail: school.schoolEmail || '',
        website: school.website || '',
        logoUrl: school.logoUrl || ''
      });
    } catch (error) {
      console.error("Error getting school info:", error);
      res.status(500).json({ error: "فشل في جلب معلومات المدرسة" });
    }
  });

  // Update school information (Admin only)
  app.put("/api/school/info", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      if (!req.session.user.schoolId) {
        return res.status(404).json({ error: "لا توجد مدرسة مرتبطة بالحساب" });
      }

      const { name, wilaya, fullAddress, adminPhone, schoolEmail, website, logoUrl } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: "اسم المدرسة مطلوب" });
      }

      const updatedSchool = await storage.updateSchool(req.session.user.schoolId, {
        name: name.trim(),
        location: wilaya || '',
        logoUrl: logoUrl || '',
        fullAddress: fullAddress || '',
        adminPhone: adminPhone || '',
        schoolEmail: schoolEmail || '',
        website: website || ''
      } as any);

      res.json({
        message: "تم تحديث معلومات المدرسة بنجاح",
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error updating school info:", error);
      res.status(500).json({ error: "فشل في تحديث معلومات المدرسة" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "تم تحديث الإشعار" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      await storage.markAllNotificationsAsRead(req.session.user.id);
      res.json({ message: "تم تحديث جميع الإشعارات" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  });

  // School logo upload endpoint (Admin only)
  app.post("/api/upload/school-logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع أي ملف" });
      }

      // Create URL for the uploaded logo
      const logoUrl = `/uploads/${req.file.filename}`;

      res.json({
        message: "تم رفع شعار المدرسة بنجاح",
        logoUrl: logoUrl,
      });
    } catch (error) {
      console.error("Error uploading school logo:", error);
      res.status(500).json({ error: "فشل في رفع شعار المدرسة" });
    }
  });

  // Verification routes (Admin only) - Children and Students only

  app.get("/api/admin/unverified-children", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const unverifiedChildren = await storage.getUnverifiedChildren(
        req.session.user.schoolId,
      );
      res.json(unverifiedChildren);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unverified children" });
    }
  });

  app.get("/api/admin/unverified-students", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const unverifiedStudents = await storage.getUnverifiedStudents(
        req.session.user.schoolId,
      );
      res.json(unverifiedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unverified students" });
    }
  });

  app.get("/api/admin/verified-children", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const verifiedChildren = await storage.getVerifiedChildren(
        req.session.user.schoolId,
      );
      res.json(verifiedChildren);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified children" });
    }
  });

  app.get("/api/admin/verified-students", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const verifiedStudents = await storage.getVerifiedStudents(
        req.session.user.schoolId,
      );
      res.json(verifiedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified students" });
    }
  });

  // Verification endpoints removed for users - only children and students need verification

  app.post("/api/admin/verify-child/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const childId = parseInt(req.params.id);
      const { notes, educationLevel, selectedSubjects } = req.body;

      const verifiedChild = await storage.verifyChild(
        childId,
        req.session.user.id,
        notes,
        educationLevel,
        selectedSubjects,
      );

      // Generate QR code for verified child's parent
      await storage.generateQRCodeForVerifiedUser(verifiedChild.parentId!);

      // Create notification for the parent
      await storage.createNotification({
        schoolId: req.session.user.schoolId!,
        userId: verifiedChild.parentId!,
        type: "verification",
        title: "✅ تم التحقق من طفلك",
        message: `تم التحقق من بيانات ${verifiedChild.name} بنجاح من قبل الإدارة`,
        relatedId: verifiedChild.id,
      });

      res.json({ message: "تم التحقق من الطفل بنجاح", child: verifiedChild });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify child" });
    }
  });

  app.post("/api/admin/verify-student/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const studentId = parseInt(req.params.id);
      const { notes, educationLevel, selectedSubjects } = req.body;

      console.log("Verifying student:", studentId, "with data:", {
        notes,
        educationLevel,
        selectedSubjects,
      });

      const verifiedStudent = await storage.verifyStudent(
        studentId,
        req.session.user.id,
        notes,
        educationLevel,
        selectedSubjects,
      );
      console.log("Student verified:", verifiedStudent);

      // Get user associated with student
      const user = await storage.getUser(verifiedStudent.userId!);
      if (user) {
        // Generate QR code for verified user
        await storage.generateQRCodeForVerifiedUser(user.id);
        console.log("Creating notification for user:", user.id);
        // Create notification for the student
        await storage.createNotification({
          schoolId: req.session.user.schoolId!,
          userId: user.id,
          type: "verification",
          title: "✅ تم التحقق من حسابك الطلابي",
          message: "تم التحقق من بياناتك التعليمية بنجاح من قبل الإدارة",
          relatedId: verifiedStudent.id,
        });
      }

      res.json({
        message: "تم التحقق من الطالب بنجاح",
        student: verifiedStudent,
      });
    } catch (error) {
      console.error("Error verifying student:", error);
      res.status(500).json({ error: "Failed to verify student" });
    }
  });

  // Undo verification endpoints
  app.post("/api/admin/undo-verify-child/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const childId = parseInt(req.params.id);
      const child = await storage.undoVerifyChild(childId);

      res.json({ message: "تم إلغاء التحقق من الطفل", child });
    } catch (error) {
      res.status(500).json({ error: "Failed to undo child verification" });
    }
  });

  app.post("/api/admin/undo-verify-student/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const studentId = parseInt(req.params.id);
      const student = await storage.undoVerifyStudent(studentId);

      res.json({ message: "تم إلغاء التحقق من الطالب", student });
    } catch (error) {
      res.status(500).json({ error: "Failed to undo student verification" });
    }
  });

  // Teaching module routes
  app.get("/api/teaching-modules", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Return both global subjects AND school-specific custom subjects
      // getTeachingModulesBySchool already includes both global (schoolId=NULL) and school-specific modules
      const modules = await storage.getTeachingModulesBySchool(req.session.user.schoolId);
      
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teaching modules" });
    }
  });

  app.get("/api/teaching-modules/by-level/:level", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const level = req.params.level;
      const modules = await storage.getTeachingModulesByLevel(level, req.session.user.schoolId);
      res.json(modules);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch teaching modules by level" });
    }
  });

  app.post("/api/admin/teaching-modules", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const moduleData = req.body;
      const module = await storage.createTeachingModule(moduleData);
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to create teaching module" });
    }
  });

  app.delete("/api/admin/teaching-modules/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const moduleId = parseInt(req.params.id);
      await storage.deleteTeachingModule(moduleId);
      res.json({ message: "تم حذف المادة التعليمية بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teaching module" });
    }
  });

  // ChatGPT's solution: New API endpoints for module-year mapping
  app.get("/api/modules-with-years", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const modules = await storage.getModulesWithYears(
        req.session.user.schoolId,
      );
      res.json(modules);
    } catch (error) {
      console.error("Error getting modules with years:", error);
      res.status(500).json({ error: "خطأ في جلب المواد والسنوات" });
    }
  });

  app.post("/api/admin/module-years", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "غير مصرح لك بهذا الإجراء" });
      }

      const { moduleId, grade } = req.body;
      await storage.createModuleYear(moduleId, grade);
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating module year:", error);
      res.status(500).json({ error: "خطأ في ربط المادة بالسنة" });
    }
  });

  // Teacher specialization routes
  app.get("/api/teacher-specializations/:teacherId", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const specializations =
        await storage.getTeacherSpecializations(teacherId);
      res.json(specializations);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch teacher specializations" });
    }
  });

  app.post("/api/teacher-specializations", async (req, res) => {
    console.log('🚀 POST /api/teacher-specializations - REQUEST RECEIVED');
    console.log('📋 Request body:', req.body);
    console.log('👤 Session user:', req.session.user?.id, req.session.user?.role);
    
    try {
      if (
        !req.session.user ||
        (req.session.user.role !== "teacher" &&
          req.session.user.role !== "admin")
      ) {
        console.log('❌ Authentication failed');
        return res
          .status(403)
          .json({ error: "صلاحيات المعلم أو المدير مطلوبة" });
      }

      const { teacherId, moduleId, specialization } = req.body;
      
      if (!teacherId || !moduleId) {
        console.log('❌ Missing required data:', { teacherId, moduleId, specialization });
        return res.status(400).json({ error: "معرف المعلم ومعرف المادة مطلوبان" });
      }
      
      // Ensure the teacher can only add specializations for themselves unless they are admin
      if (
        req.session.user.role === "teacher" &&
        teacherId !== req.session.user.id
      ) {
        return res
          .status(403)
          .json({ error: "لا يمكنك إضافة تخصصات لمعلم آخر" });
      }

      console.log('🔧 Adding specialization for teacher:', teacherId, 'with module ID:', moduleId);
      console.log('🏫 School ID:', req.session.user.schoolId);
      
      // Use the module ID directly (no parsing needed)
      const specializationData = {
        schoolId: req.session.user.schoolId,
        teacherId: parseInt(teacherId),
        moduleId: parseInt(moduleId),
      };

      console.log('💾 Creating specialization with data:', specializationData);
      const savedSpecialization = await storage.createTeacherSpecialization(specializationData);
      console.log('✅ Successfully created specialization:', savedSpecialization);
      
      if (!savedSpecialization || !savedSpecialization.id) {
        console.log('❌ Specialization creation failed - no ID returned:', savedSpecialization);
        throw new Error('Failed to create teacher specialization');
      }
      
      res.json(savedSpecialization);
    } catch (error) {
      console.error("Teacher specialization creation error:", error);
      res
        .status(500)
        .json({ error: "Failed to create teacher specialization" });
    }
  });

  // DEBUG: Simple test endpoint for teacher specialization
  app.post("/api/test-specialization", async (req, res) => {
    console.log('🧪 TEST SPECIALIZATION ENDPOINT');
    
    try {
      if (!req.session.user?.schoolId) {
        return res.status(403).json({ error: "Not authenticated" });
      }

      const { teacherId, moduleId } = req.body;
      
      console.log('🧪 Test data:', { 
        schoolId: req.session.user.schoolId, 
        teacherId, 
        moduleId 
      });

      // Direct database insertion
      const testData = {
        schoolId: req.session.user.schoolId,
        teacherId: parseInt(teacherId),
        moduleId: parseInt(moduleId),
      };

      console.log('🧪 Inserting test specialization:', testData);
      const result = await storage.createTeacherSpecialization(testData);
      console.log('🧪 Test result:', result);

      res.json({ success: true, result });
    } catch (error: any) {
      console.error('🧪 Test error:', error);
      res.status(500).json({ error: error?.message || 'Unknown error' });
    }
  });

  app.delete("/api/teacher-specializations/:id", async (req, res) => {
    try {
      if (
        !req.session.user ||
        (req.session.user.role !== "teacher" &&
          req.session.user.role !== "admin")
      ) {
        return res
          .status(403)
          .json({ error: "صلاحيات المعلم أو المدير مطلوبة" });
      }

      const specializationId = parseInt(req.params.id);
      await storage.deleteTeacherSpecialization(specializationId);
      res.json({ message: "تم حذف التخصص بنجاح" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to delete teacher specialization" });
    }
  });

  app.get("/api/teachers-by-module/:moduleId", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const teachers = await storage.getTeachers();
      // Filter teachers by school and then by module specialization
      const schoolTeachers = teachers.filter(
        (t) => t.schoolId === req.session.user.schoolId,
      );
      const moduleTeachers = await storage.getTeachersByModule(moduleId);
      const filteredTeachers = moduleTeachers.filter((t) =>
        schoolTeachers.some((st) => st.id === t.id),
      );
      res.json(filteredTeachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers by module" });
    }
  });

  // Schedule table routes
  app.get("/api/schedule-tables", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const tables = await storage.getScheduleTablesBySchool(
        req.session.user.schoolId,
      );
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule tables" });
    }
  });

  app.post("/api/schedule-tables", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      console.log(
        "Creating schedule table for user:",
        req.session.user.email,
        "role:",
        req.session.user.role,
      );
      console.log("Request body:", req.body);

      const tableData = insertScheduleTableSchema.parse(req.body);
      console.log("Validated table data:", tableData);

      // Add schoolId for multi-tenancy
      const tableDataWithSchool = {
        ...tableData,
        schoolId: req.session.user.schoolId,
      };
      console.log("Table data with schoolId:", tableDataWithSchool);

      const table = await storage.createScheduleTable(tableDataWithSchool);
      console.log("Schedule table created successfully:", table);
      res.json(table);
    } catch (error) {
      console.error("Error creating schedule table:", error);
      res.status(500).json({ error: "Failed to create schedule table" });
    }
  });

  app.put("/api/schedule-tables/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const tableId = parseInt(req.params.id);
      const updates = req.body;
      const table = await storage.updateScheduleTable(tableId, updates);
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule table" });
    }
  });

  app.delete("/api/schedule-tables/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const tableId = parseInt(req.params.id);
      await storage.deleteScheduleTable(tableId);
      res.json({ message: "تم حذف الجدول بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule table" });
    }
  });

  // Schedule cell routes
  app.get("/api/schedule-cells/:tableId", async (req, res) => {
    try {
      const tableId = parseInt(req.params.tableId);
      const cells = await storage.getScheduleCellsWithDetails(tableId);
      res.json(cells);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule cells" });
    }
  });

  app.post("/api/schedule-cells", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const cellDataWithSchool = {
        ...req.body,
        schoolId: req.session.user.schoolId,
      };
      const cellData = insertScheduleCellSchema.parse(cellDataWithSchool);
      const cell = await storage.createScheduleCell(cellData);
      res.json(cell);
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule cell" });
    }
  });

  app.put("/api/schedule-cells/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const cellId = parseInt(req.params.id);
      const updates = req.body;
      const cell = await storage.updateScheduleCell(cellId, updates);
      res.json(cell);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule cell" });
    }
  });

  app.delete("/api/schedule-cells/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const cellId = parseInt(req.params.id);
      await storage.deleteScheduleCell(cellId);
      res.json({ message: "تم حذف الخلية بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule cell" });
    }
  });

  // User details route for admin verification
  app.get("/api/users/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Return user without sensitive information
      const { password: _, firebaseUid: __, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });

  // Emergency super admin creation endpoint
  app.post("/api/emergency/create-super-admin", async (req, res) => {
    try {
      const { emergencyKey } = req.body;

      // Safety check
      if (emergencyKey !== "EMERGENCY_SUPER_ADMIN_CREATE_2024") {
        return res.status(403).json({ error: "Emergency key required" });
      }

      const email = "mou3atheacc@gmail.com";
      const password = "SUPER_ADMIN_2024_MASTER_KEY";

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log("🔍 Super admin already exists:", {
          userRole: existingUser.role,
          userBanned: existingUser.banned,
          passwordType: existingUser.password.startsWith("$2b$")
            ? "bcrypt"
            : "plaintext",
        });
        return res.json({
          message: "Super admin already exists",
          userExists: true,
          role: existingUser.role,
          email: existingUser.email,
        });
      }

      // Create new super admin user
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        email: email,
        password: hashedPassword,
        name: "Super Administrator",
        phone: "0123456789",
        role: "super_admin",
        schoolId: null,
      });

      console.log("✅ Emergency super admin created:", newUser.email);
      res.json({
        message: "Super admin created successfully",
        userCreated: true,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (error) {
      console.error("Emergency super admin creation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  // Super Admin Authentication Routes (Hidden Access)
  app.post("/api/auth/super-admin-login", async (req, res) => {
    console.log("🔍 Received super admin login request");
    console.log("Request body:", req.body);
    console.log("Content-Type:", req.get("Content-Type"));

    try {
      const { email, password } = loginSchema.parse(req.body);

      console.log("🔍 Super admin login attempt:", {
        email: email,
        passwordLength: password.length,
        timestamp: new Date().toISOString(),
      });

      // Check for master super admin account (not in database)
      const MASTER_SUPER_ADMIN_EMAIL = process.env.MASTER_SUPER_ADMIN_EMAIL || "master@superadmin.com";
      const MASTER_SUPER_ADMIN_PASSWORD = process.env.MASTER_SUPER_ADMIN_PASSWORD || "Master@SuperAdmin2024!";
      
      if (email === MASTER_SUPER_ADMIN_EMAIL && password === MASTER_SUPER_ADMIN_PASSWORD) {
        console.log("✅ Master super admin login successful (no DB)");
        
        // Create a virtual super admin user object (not from database)
        const masterSuperAdmin = {
          id: -1, // Special ID to indicate this is not a DB user
          email: MASTER_SUPER_ADMIN_EMAIL,
          name: "Master Super Administrator",
          phone: "0000000000",
          role: "super_admin",
          schoolId: null,
          phoneVerified: true,
          emailVerified: true,
          verified: true,
          banned: false,
          gender: null,
          profilePicture: null,
          firebaseUid: null,
          createdAt: new Date(),
        };
        
        req.session.user = masterSuperAdmin;
        req.session.userId = masterSuperAdmin.id;
        
        const { ...userWithoutPassword } = masterSuperAdmin;
        return res.json({ user: userWithoutPassword });
      }

      // Normal database authentication for regular super admins
      const user = await storage.authenticateUser(email, password);

      console.log("🔍 Authentication result:", {
        userFound: !!user,
        userRole: user?.role,
        userEmail: user?.email,
        userBanned: user?.banned,
      });

      if (!user || user.role !== "super_admin") {
        console.log("❌ Login failed: No user found or not super admin");
        return res
          .status(401)
          .json({ error: "بيانات اعتماد المسؤول العام غير صحيحة" });
      }

      // Check if user is banned
      if (user.banned) {
        console.log("❌ Login failed: User is banned");
        return res.status(403).json({
          error: `تم حظر حسابك من النظام. السبب: ${user.banReason || "لم يتم تحديد السبب"}`,
        });
      }

      console.log("✅ Super admin login successful:", user.email);
      req.session.user = user;
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("❌ Super admin login error details:");
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error(
        "Error name:",
        error instanceof Error ? error.name : "Unknown",
      );
      console.error("Full error:", error);
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Super Admin Password Reset Route
  app.post("/api/auth/super-admin-reset-password", async (req, res) => {
    try {
      const { email, newPassword, superAdminKey } = req.body;

      // Verify super admin secret key
      if (superAdminKey !== SUPER_ADMIN_SECRET_KEY) {
        return res.status(400).json({ error: "مفتاح المسؤول العام غير صحيح" });
      }

      // Find existing super admin
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser || existingUser.role !== "super_admin") {
        return res.status(400).json({ error: "حساب المسؤول العام غير موجود" });
      }

      // Hash new password and update
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, existingUser.id));

      res.json({ message: "تم تحديث كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Super admin password reset error:", error);
      res.status(400).json({ error: "فشل في تحديث كلمة المرور" });
    }
  });

  app.post("/api/auth/super-admin-register", async (req, res) => {
    try {
      const data = insertSuperAdminSchema.parse(req.body);

      // Verify super admin secret key
      if (data.superAdminKey !== SUPER_ADMIN_SECRET_KEY) {
        return res.status(400).json({ error: "مفتاح المسؤول العام غير صحيح" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }

      // Check if phone already exists
      const existingPhone = await storage.getUserByPhone(data.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }

      // Create super admin user (without schoolId)
      // Note: storage.createUser() handles password hashing internally
      const newUser = await storage.createUser({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        role: "super_admin",
        schoolId: null, // Super admin doesn't belong to any specific school
      });

      req.session.user = newUser;
      req.session.userId = newUser.id;
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Super admin registration error:", error);
      res.status(400).json({ error: "فشل في إنشاء حساب المسؤول العام" });
    }
  });

  // Super Admin School Management Routes
  app.get("/api/super-admin/schools", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ error: "فشل في جلب المدارس" });
    }
  });

  app.post("/api/super-admin/schools", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const data = insertSchoolSchema.parse(req.body);

      // Check if school code already exists
      const existingSchool = await storage.getSchoolByCode(data.code);
      if (existingSchool) {
        return res.status(400).json({ error: "كود المدرسة مستخدم بالفعل" });
      }

      const newSchool = await storage.createSchool(data);
      res.json(newSchool);
    } catch (error) {
      console.error("Error creating school:", error);

      // Handle specific database constraint errors
      if (error && typeof error === "object" && "code" in error) {
        if ((error as any).code === "23505") {
          // Unique constraint violation
          if ((error as any).constraint === "schools_code_unique") {
            return res.status(400).json({
              error: "كود المدرسة مستخدم بالفعل، يرجى اختيار كود آخر",
            });
          }
          if ((error as any).constraint === "schools_domain_unique") {
            return res
              .status(400)
              .json({ error: "النطاق مستخدم بالفعل، يرجى اختيار نطاق آخر" });
          }
        }
      }

      res.status(400).json({
        error: "فشل في إنشاء المدرسة، يرجى التحقق من البيانات المدخلة",
      });
    }
  });

  app.delete("/api/super-admin/schools/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      await storage.deleteSchool(schoolId);
      res.json({ message: "تم حذف المدرسة بنجاح" });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ error: "فشل في حذف المدرسة" });
    }
  });

  // School Selection Route (for accessing specific school - PUBLIC ROUTE)
  app.post("/api/school/select", async (req, res) => {
    try {
      const { schoolCode } = schoolSelectionSchema.parse(req.body);

      const school = await storage.getSchoolByCode(schoolCode);
      if (!school) {
        return res
          .status(404)
          .json({ error: "المدرسة غير موجودة أو غير مفعلة" });
      }

      // Set school context in session for registration
      req.session.schoolId = school.id;
      req.session.schoolCode = school.code;

      res.json({ school });
    } catch (error) {
      console.error("Error selecting school:", error);
      res.status(400).json({ error: "كود المدرسة غير صحيح" });
    }
  });

  // Get school statistics
  app.get("/api/super-admin/schools/:id/stats", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      const stats = await storage.getSchoolStatistics(schoolId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching school statistics:", error);
      res.status(500).json({ error: "فشل في جلب إحصائيات المدرسة" });
    }
  });

  // Update school access keys
  app.patch("/api/super-admin/schools/:id/keys", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      const { adminKey, teacherKey } = req.body;

      if (!adminKey || !teacherKey) {
        return res.status(400).json({ error: "مفاتيح الوصول مطلوبة" });
      }

      await storage.updateSchoolKeys(schoolId, adminKey, teacherKey);
      res.json({ message: "تم تحديث مفاتيح الوصول بنجاح" });
    } catch (error) {
      console.error("Error updating school keys:", error);
      res.status(500).json({ error: "فشل في تحديث مفاتيح الوصول" });
    }
  });

  // Super Admin - School Subscription Management
  app.patch("/api/super-admin/schools/:id/subscription", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      const { subscriptionExpiry, subscriptionStatus, subscriptionNotes } = req.body;

      // Allow updating any of the subscription fields
      if (!subscriptionExpiry && !subscriptionStatus && !subscriptionNotes) {
        return res.status(400).json({ error: "يجب تحديد على الأقل أحد قيم الاشتراك" });
      }

      await storage.updateSchoolSubscription(schoolId, {
        subscriptionExpiry: subscriptionExpiry ? new Date(subscriptionExpiry) : null,
        subscriptionStatus,
        subscriptionNotes,
        subscriptionLastUpdated: new Date(),
        subscriptionUpdatedBy: req.session.user.id,
      });

      res.json({ message: "تم تحديث اشتراك المدرسة بنجاح" });
    } catch (error) {
      console.error("Error updating school subscription:", error);
      res.status(500).json({ error: "فشل في تحديث اشتراك المدرسة" });
    }
  });

  // Toggle school access (pause/resume authentication)
  app.patch("/api/super-admin/schools/:id/access", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      const { isAccessEnabled } = req.body;

      if (typeof isAccessEnabled !== "boolean") {
        return res.status(400).json({ error: "قيمة التحكم في الوصول يجب أن تكون true أو false" });
      }

      await storage.toggleSchoolAccess(schoolId, isAccessEnabled);
      
      const statusMessage = isAccessEnabled 
        ? "تم تفعيل الوصول للمدرسة بنجاح" 
        : "تم إيقاف الوصول للمدرسة بنجاح";
      
      res.json({ message: statusMessage, isAccessEnabled });
    } catch (error) {
      console.error("Error toggling school access:", error);
      res.status(500).json({ error: "فشل في تغيير حالة الوصول للمدرسة" });
    }
  });

  // Get school subscription status (for school admins)
  app.get("/api/school/subscription", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لعرض حالة الاشتراك" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const subscriptionInfo = await storage.getSchoolSubscriptionStatus(schoolId);
      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "فشل في جلب حالة الاشتراك" });
    }
  });

  // Get schools with expiring subscriptions (for alerts)
  app.get("/api/super-admin/schools/expiring-subscriptions", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const daysThreshold = parseInt(req.query.days as string) || 7;
      const expiringSchools = await storage.getSchoolsWithExpiringSubscriptions(daysThreshold);
      res.json(expiringSchools);
    } catch (error) {
      console.error("Error fetching expiring subscriptions:", error);
      res.status(500).json({ error: "فشل في جلب الاشتراكات المنتهية" });
    }
  });

  // Group Attendance Routes
  app.get("/api/groups/:groupId/attendance", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لعرض الحضور" });
      }

      const groupId = parseInt(req.params.groupId);
      const { date } = req.query;
      const schoolId = req.session.user.schoolId; // Get schoolId from session for data isolation

      const attendance = await storage.getAttendanceWithStudentDetails(
        groupId,
        date as string
      );
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "فشل في جلب بيانات الحضور" });
    }
  });

  app.post("/api/groups/:groupId/attendance", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لتسجيل الحضور" });
      }

      const groupId = parseInt(req.params.groupId);
      const { userId, attendanceDate, status, notes } = req.body;

      if (!userId) {
        return res
          .status(400)
          .json({ error: "معرف المستخدم مطلوب لتسجيل الحضور" });
      }

      const attendanceData = {
        groupId,
        userId,
        studentId: userId, // Use userId as studentId for backward compatibility
        studentType: "student" as const, // Default to student type
        attendanceDate: new Date(attendanceDate),
        status,
        notes,
        markedBy: req.session.user.id,
        schoolId: req.session.user.schoolId,
      };

      const attendance = await storage.markAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ error: "فشل في تسجيل الحضور" });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لتعديل الحضور" });
      }

      const attendanceId = parseInt(req.params.id);
      const updates = req.body;

      const attendance = await storage.updateAttendance(attendanceId, updates);
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ error: "فشل في تحديث الحضور" });
    }
  });

  // Get attendance history for a group
  app.get("/api/groups/:groupId/attendance-history", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const attendanceHistory = await storage.getGroupAttendanceHistory(
        groupId,
        req.session.user.schoolId,
      );
      res.json(attendanceHistory);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      res.status(500).json({ error: "فشل في جلب سجل الحضور" });
    }
  });


  // Group Schedule Routes (Admin only)
  app.get("/api/groups/:groupId/scheduled-dates", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لعرض الجدول" });
      }

      const groupId = parseInt(req.params.groupId);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const scheduledDates = await storage.getGroupScheduledLessonDates(
        groupId,
        schoolId,
      );
      res.json({ dates: scheduledDates });
    } catch (error) {
      console.error("Error getting scheduled dates:", error);
      res.status(500).json({ error: "فشل في جلب مواعيد الحصص" });
    }
  });

  app.post("/api/groups/:groupId/assign-schedule", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لتعيين الجدول" });
      }

      const groupId = parseInt(req.params.groupId);
      const { scheduleCellId } = req.body;
      const schoolId = req.session.user.schoolId;
      const assignedBy = req.session.user.id;

      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const assignment = await storage.assignGroupToSchedule(
        groupId,
        scheduleCellId,
        schoolId,
        assignedBy,
      );
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning group to schedule:", error);
      res.status(500).json({ error: "فشل في تعيين الجدول للمجموعة" });
    }
  });

  app.get("/api/groups/:groupId/schedule-assignments", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لعرض التعيينات" });
      }

      const groupId = parseInt(req.params.groupId);
      const assignments = await storage.getGroupScheduleAssignments(groupId);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting group schedule assignments:", error);
      res.status(500).json({ error: "فشل في جلب تعيينات الجدول" });
    }
  });

  // Get group student assignments (mixed assignments from groupMixedAssignments table)
  app.get("/api/groups/:groupId/assignments", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      }

      const groupId = parseInt(req.params.groupId);
      const assignments = await storage.getGroupAssignments(groupId);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting group assignments:", error);
      res.status(500).json({ error: "فشل في جلب مخصصات المجموعة" });
    }
  });

  // Group Financial Transaction Routes
  app.get("/api/groups/:groupId/transactions", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const { studentId } = req.query;

      const transactions = studentId
        ? await storage.getGroupTransactions(
            groupId,
            parseInt(studentId as string),
          )
        : await storage.getTransactionsWithDetails(groupId);

      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "فشل في جلب المعاملات المالية" });
    }
  });

  app.post("/api/groups/:groupId/transactions", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const transactionData = {
        ...req.body,
        groupId,
        recordedBy: req.session.user.id,
        schoolId: req.session.user.schoolId,
      };

      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: "فشل في إنشاء المعاملة المالية" });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const transactionId = parseInt(req.params.id);
      const updates = req.body;

      const transaction = await storage.updateTransaction(
        transactionId,
        updates,
      );
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ error: "فشل في تحديث المعاملة المالية" });
    }
  });

  app.get(
    "/api/groups/:groupId/students/:studentId/financial-summary",
    async (req, res) => {
      try {
        if (!req.session?.user || req.session.user.role !== "admin") {
          return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
        }

        const groupId = parseInt(req.params.groupId);
        const studentId = parseInt(req.params.studentId);

        const summary = await storage.getStudentFinancialSummary(
          groupId,
          studentId,
        );
        res.json(summary);
      } catch (error) {
        console.error("Error fetching financial summary:", error);
        res.status(500).json({ error: "فشل في جلب الملخص المالي" });
      }
    },
  );

  // Student Payment Status Routes
  app.get(
    "/api/students/:studentId/payment-status/:year/:month",
    async (req, res) => {
      try {
        if (!req.session?.user) {
          return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
        }

        const { studentId, year, month } = req.params;
        const schoolId = req.session.user.schoolId;

        const paymentStatus = await storage.getStudentPaymentStatus(
          parseInt(studentId),
          parseInt(year),
          parseInt(month),
          schoolId,
        );

        res.json(paymentStatus || { isPaid: false });
      } catch (error) {
        console.error("Error getting payment status:", error);
        res.status(500).json({ error: "فشل في جلب حالة الدفع" });
      }
    },
  );

  app.get(
    "/api/groups/:groupId/payment-status/:year/:month",
    async (req, res) => {
      try {
        if (!req.session?.user) {
          return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
        }

        const { groupId, year, month } = req.params;
        const schoolId = req.session.user.schoolId;
        const targetYear = parseInt(year);
        const targetMonth = parseInt(month);

        // Get group with students
        const group = await storage.getGroupById(parseInt(groupId));
        if (!group || group.schoolId !== schoolId) {
          return res.status(404).json({ error: "المجموعة غير موجودة" });
        }

        // Get students assigned to this group (mixed assignments)
        const groupAssignments = await storage.getGroupAssignments(
          parseInt(groupId),
        );

        // Get all student IDs (both actual students and children) for payment processing
        const allStudentIds = groupAssignments.map(
          (assignment: any) => assignment.studentId,
        );

        if (allStudentIds.length === 0) {
          return res.json([]);
        }

        // Get current date for comparison
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // Calculate previous month
        let prevYear = targetYear;
        let prevMonth = targetMonth - 1;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = targetYear - 1;
        }

        // Check if previous month has ended
        const previousMonthEnded =
          targetYear < currentYear ||
          (targetYear === currentYear && targetMonth <= currentMonth);

        // Get attendance data for target month to check if students attended
        const attendanceData = await storage.getGroupAttendanceForMonth(
          parseInt(groupId),
          targetYear,
          targetMonth,
        );

        // Get existing payment records - ✅ CRITICAL: Filter by groupId to prevent cross-group contamination
        const existingPayments = await storage.getStudentsPaymentStatusForMonth(
          allStudentIds,
          targetYear,
          targetMonth,
          schoolId,
          parseInt(groupId), // ✅ Pass groupId to filter payments for this specific group only
        );

        // Build payment status for each student - NO VIRTUAL RECORDS
        const paymentStatuses = [];

        for (const assignment of groupAssignments) {
          const studentId = assignment.studentId;
          const existingPayment = existingPayments.find(
            (p: any) => p.studentId === studentId,
          );

          if (existingPayment) {
            // Payment record exists in database - use actual isPaid value
            const isPaidStatus = existingPayment.isPaid ?? true;
            paymentStatuses.push({
              studentId: studentId,
              userId: existingPayment.userId,
              year: targetYear,
              month: targetMonth,
              isPaid: isPaidStatus,
              amount: existingPayment.amount,
              paidAt: existingPayment.paidAt,
              paymentNote: isPaidStatus ? "مدفوع" : "غير مدفوع", // Paid or Not Paid based on actual status
              studentType: existingPayment.studentType,
            });
          } else {
            // No payment record - student hasn't paid
            paymentStatuses.push({
              studentId: studentId,
              userId: assignment.userId,
              year: targetYear,
              month: targetMonth,
              isPaid: false,
              paymentNote: "يجب الدفع", // Must pay
              studentType: assignment.studentType || "student",
            });
          }
        }

        res.json(paymentStatuses);
      } catch (error) {
        console.error("Error getting group payment status:", error);
        res.status(500).json({ error: "فشل في جلب حالة دفع المجموعة" });
      }
    },
  );

  // Create payment for multiple months
  app.post("/api/students/create-payment", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بتعديل حالة الدفع" });
      }

      const { studentId, userId, studentType, months, amount, notes, groupId } = req.body;
      const schoolId = req.session.user.schoolId;
      const paidBy = req.session.user.id;
      
      if (!studentId || !userId || !studentType || !months || !amount) {
        return res.status(400).json({ error: "معلومات ناقصة" });
      }

      const paymentRecords = [];
      
      // Create payment for each selected month
      for (const monthData of months) {
        const { year, month } = monthData;
        
        const paymentRecord = await storage.createStudentPayment(
          parseInt(studentId),
          parseInt(userId),
          studentType,
          parseInt(year),
          parseInt(month),
          parseFloat(amount),
          schoolId,
          groupId, // ✅ CRITICAL: Pass groupId for group-specific payments
          paidBy,
          notes,
        );
        
        paymentRecords.push(paymentRecord);
      }

      res.json(paymentRecords);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "فشل في إنشاء الدفع" });
    }
  });
  
  // Delete payment record - HARD DELETE from database
  app.delete("/api/payments/delete", async (req, res) => {
    try {
      console.log("🗑️ DELETE payment request received:", req.body);
      
      if (!req.session?.user || req.session.user.role !== "admin") {
        console.log("❌ Access denied - user not admin:", req.session?.user?.role);
        return res
          .status(403)
          .json({ error: "غير مسموح لك بحذف المدفوعات" });
      }

      const { studentId, year, month, schoolId } = req.body;
      console.log("📝 Extracted parameters:", { studentId, year, month, schoolId });
      
      // Convert all parameters to proper types
      const parsedStudentId = parseInt(studentId);
      const parsedYear = parseInt(year);
      const parsedMonth = parseInt(month);
      const parsedSchoolId = parseInt(schoolId);
      
      if (!parsedStudentId || !parsedYear || !parsedMonth || !parsedSchoolId) {
        console.log("❌ Invalid parameters after parsing:", { parsedStudentId, parsedYear, parsedMonth, parsedSchoolId });
        return res.status(400).json({ error: "معلومات غير صالحة" });
      }

      // Verify the school ID matches the admin's school
      if (parsedSchoolId !== req.session.user.schoolId) {
        console.log("❌ School ID mismatch:", parsedSchoolId, "vs", req.session.user.schoolId);
        return res.status(403).json({ error: "غير مسموح بحذف مدفوعات مدرسة أخرى" });
      }

      // Hard delete the payment record from database
      console.log("🔄 Calling deletePaymentRecord with parsed values:", {
        studentId: parsedStudentId,
        year: parsedYear, 
        month: parsedMonth,
        schoolId: parsedSchoolId
      });
      
      const deleted = await storage.deletePaymentRecord(
        parsedStudentId,
        parsedYear,
        parsedMonth,
        parsedSchoolId
      );

      console.log("✅ Delete operation result:", deleted);
      
      if (deleted) {
        // Also delete related financial entries created from payment receipts
        try {
          console.log("🔄 Attempting to delete related financial entries...");
          await storage.deleteFinancialEntriesByPayment(
            parsedStudentId,
            parsedYear,
            parsedMonth,
            parsedSchoolId
          );
          console.log("✅ Related financial entries deleted successfully");
        } catch (finError) {
          console.warn("⚠️ Could not delete related financial entries:", finError);
          // Don't fail the payment deletion if financial entry deletion fails
        }
        
        res.json({ 
          message: "تم حذف سجل الدفع بنجاح",
          deleted: true,
          details: {
            studentId: parsedStudentId,
            year: parsedYear,
            month: parsedMonth
          }
        });
      } else {
        res.status(404).json({ error: "لم يتم العثور على سجل الدفع أو فشل الحذف" });
      }
    } catch (error) {
      console.error("❌ Error deleting payment - Full error:", error);
      res.status(500).json({ 
        error: "فشل في حذف سجل الدفع",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get payment history for a student
  app.get("/api/students/:studentId/payment-history", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { studentId } = req.params;
      const schoolId = req.session.user.schoolId;

      const paymentHistory = await storage.getStudentPaymentHistory(
        parseInt(studentId),
        schoolId,
      );

      res.json(paymentHistory);
    } catch (error) {
      console.error("Error getting payment history:", error);
      res.status(500).json({ error: "فشل في جلب سجل المدفوعات" });
    }
  });

  // Student status endpoints
  app.get("/api/student/attendance/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUser = req.session.user;

      // Handle parent accessing child data
      if (requestingUser.role === "parent") {
        // Verify the child belongs to this parent
        const child = await storage.getChildById(userId);
        if (!child || child.parentId !== requestingUser.id) {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
        }
        // Use child-specific attendance records
        const attendanceRecords = await storage.getChildAttendanceRecords(
          userId,
          requestingUser.schoolId,
        );
        return res.json(attendanceRecords);
      }

      // Only allow students to view their own data
      if (requestingUser.role === "student" && requestingUser.id !== userId) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }

      const attendanceRecords = await storage.getStudentAttendanceRecords(
        userId,
        requestingUser.schoolId,
      );
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ error: "فشل في جلب سجل الحضور" });
    }
  });

  app.get("/api/student/payments/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUser = req.session.user;

      // Handle parent accessing child data
      if (requestingUser.role === "parent") {
        // Verify the child belongs to this parent
        const child = await storage.getChildById(userId);
        if (!child || child.parentId !== requestingUser.id) {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
        }
        // Use child-specific payment records
        const paymentRecords = await storage.getChildPaymentRecords(
          userId,
          requestingUser.schoolId,
        );
        return res.json(paymentRecords);
      }

      // Only allow students to view their own data
      if (requestingUser.role === "student" && requestingUser.id !== userId) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }

      const paymentRecords = await storage.getStudentPaymentRecords(
        userId,
        requestingUser.schoolId,
      );
      res.json(paymentRecords);
    } catch (error) {
      console.error("Error fetching student payments:", error);
      res.status(500).json({ error: "فشل في جلب سجل المدفوعات" });
    }
  });

  app.get("/api/student/groups/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUser = req.session.user;

      // Handle parent accessing child data
      if (requestingUser.role === "parent") {
        // Verify the child belongs to this parent
        const child = await storage.getChildById(userId);
        if (!child || child.parentId !== requestingUser.id) {
          return res
            .status(403)
            .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
        }
        // Use child-specific group enrollments
        const enrolledGroups = await storage.getChildEnrolledGroups(
          userId,
          requestingUser.schoolId,
        );
        return res.json(enrolledGroups);
      }

      // Only allow students to view their own data
      if (requestingUser.role === "student" && requestingUser.id !== userId) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }

      const enrolledGroups = await storage.getStudentEnrolledGroups(
        userId,
        requestingUser.schoolId,
      );
      res.json(enrolledGroups);
    } catch (error) {
      console.error("Error fetching student enrolled groups:", error);
      res.status(500).json({ error: "فشل في جلب المجموعات المسجل بها الطالب" });
    }
  });

  app.get("/api/children/groups", requireAuth, async (req, res) => {
    try {
      const requestingUser = req.session.user;

      // Only allow parents to view their children's groups
      if (requestingUser.role === "student") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }

      const childrenGroups = await storage.getChildrenEnrolledGroups(
        requestingUser.id,
        requestingUser.schoolId,
      );
      res.json(childrenGroups);
    } catch (error) {
      console.error("Error fetching children enrolled groups:", error);
      res.status(500).json({ error: "فشل في جلب مجموعات الأطفال" });
    }
  });

  // Push Notification Routes
  app.get("/api/push/vapid-public-key", (req, res) => {
    try {
      const publicKey = PushNotificationService.getVapidPublicKey();
      res.json({ publicKey });
    } catch (error) {
      console.error("Error getting VAPID public key:", error);
      res.status(500).json({ error: "فشل في الحصول على مفتاح الإشعارات" });
    }
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      if (!req.session?.user || !req.session?.schoolId) {
        return res.status(401).json({ error: "المصادقة مطلوبة" });
      }

      const subscriptionData = insertPushSubscriptionSchema.parse({
        ...req.body,
        userId: req.session.user.id,
        schoolId: req.session.schoolId,
      });

      const subscription =
        await storage.createPushSubscription(subscriptionData);
      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      res.status(400).json({ error: "فشل في تفعيل الإشعارات" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المصادقة مطلوبة" });
      }

      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "عنوان الاشتراك مطلوب" });
      }

      // Find and delete subscription by endpoint and user
      const subscriptions = await storage.getUserPushSubscriptions(
        req.session.user.id,
      );
      const targetSubscription = subscriptions.find(
        (sub) => sub.endpoint === endpoint,
      );

      if (targetSubscription) {
        await storage.deletePushSubscription(targetSubscription.id);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      res.status(400).json({ error: "فشل في إلغاء تفعيل الإشعارات" });
    }
  });

  app.post("/api/push/test", async (req, res) => {
    try {
      if (!req.session?.user || !req.session?.schoolId) {
        return res.status(401).json({ error: "المصادقة مطلوبة" });
      }

      const payload = PushNotificationService.createMessageNotification(
        "النظام",
        "هذا إشعار تجريبي للتأكد من عمل نظام الإشعارات",
      );

      const success = await PushNotificationService.sendToUser(
        req.session.schoolId,
        req.session.user.id,
        payload,
      );

      if (success) {
        res.json({ success: true, message: "تم إرسال الإشعار التجريبي بنجاح" });
      } else {
        res.status(400).json({ error: "فشل في إرسال الإشعار التجريبي" });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "فشل في إرسال الإشعار التجريبي" });
    }
  });

  app.get("/api/push/status", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المصادقة مطلوبة" });
      }

      const subscriptions = await storage.getUserPushSubscriptions(
        req.session.user.id,
      );
      const isSubscribed = subscriptions.length > 0;

      res.json({
        isSubscribed,
        subscriptionCount: subscriptions.length,
        lastUsed: subscriptions[0]?.lastUsed || null,
      });
    } catch (error) {
      console.error("Error checking push notification status:", error);
      res.status(500).json({ error: "فشل في فحص حالة الإشعارات" });
    }
  });

  // Admin: Send notification to specific users
  app.post("/api/admin/push/send", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const { userIds, title, body, type, url } = req.body;

      if (!userIds || !Array.isArray(userIds) || !title || !body) {
        return res.status(400).json({ error: "بيانات الإشعار غير كاملة" });
      }

      const payload = {
        title,
        body,
        type: type || "admin",
        data: { url: url || "/" },
      };

      const result = await PushNotificationService.sendToUsers(
        req.session.schoolId!,
        userIds,
        payload,
      );

      res.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        message: `تم إرسال ${result.success} إشعار، فشل ${result.failed}`,
      });
    } catch (error) {
      console.error("Error sending admin notification:", error);
      res.status(500).json({ error: "فشل في إرسال الإشعار" });
    }
  });

  // Admin: Broadcast to all users in school
  app.post("/api/admin/push/broadcast", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const { title, body, type, url, excludeRoles } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: "عنوان ومحتوى الإشعار مطلوبان" });
      }

      const payload = {
        title,
        body,
        type: type || "broadcast",
        data: { url: url || "/" },
      };

      // Get users to exclude based on roles
      let excludeUserIds: number[] = [];
      if (excludeRoles && excludeRoles.length > 0) {
        const excludeUsers = await storage.getUsersByRoles(
          req.session.schoolId!,
          excludeRoles,
        );
        excludeUserIds = excludeUsers.map((user) => user.id);
      }

      const result = await PushNotificationService.broadcastToSchool(
        req.session.schoolId!,
        payload,
        excludeUserIds,
      );

      res.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        message: `تم إرسال ${result.success} إشعار، فشل ${result.failed}`,
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ error: "فشل في إرسال الإشعار العام" });
    }
  });

  // Admin endpoints for student claim system
  app.post("/api/admin/preregister-student", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const { name, phone, gender, educationLevel, grade, selectedSubjects } =
        req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }

      if (!name || !gender || !educationLevel || !grade) {
        return res.status(400).json({ error: "جميع البيانات مطلوبة" });
      }

      const student = await storage.preRegisterStudent({
        name,
        phone,
        gender,
        educationLevel,
        grade,
        schoolId,
        selectedSubjects,
      });

      res.status(201).json({
        message: "تم تسجيل الطالب مسبقاً بنجاح",
        student,
        studentId: student.id,
        generatedCredentials: student.generatedEmail ? {
          email: student.generatedEmail,
          password: student.generatedPassword,
        } : null,
      });
    } catch (error) {
      console.error("Error pre-registering student:", error);
      res.status(500).json({ error: "فشل في تسجيل الطالب مسبقاً" });
    }
  });

  app.get("/api/admin/unclaimed-students", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }

      const students = await storage.getUnclaimedStudents(schoolId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching unclaimed students:", error);
      res.status(500).json({ error: "فشل في جلب الطلاب غير المربوطين" });
    }
  });

  // Update unclaimed student
  app.put("/api/admin/students/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const studentId = parseInt(req.params.id);
      const { name, phone, gender, educationLevel, grade, selectedSubjects } =
        req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }

      // Verify the student belongs to this school and is unclaimed
      const existingStudent = await storage.getUnclaimedStudent(
        studentId,
        schoolId,
      );
      if (!existingStudent) {
        return res
          .status(404)
          .json({ error: "الطالب غير موجود أو مربوط بحساب بالفعل" });
      }

      if (!name || !gender || !educationLevel || !grade) {
        return res.status(400).json({ error: "جميع البيانات مطلوبة" });
      }

      const updatedStudent = await storage.updateStudent(studentId, {
        name,
        phone,
        gender,
        educationLevel,
        grade,
        selectedSubjects,
      });

      res.json({
        message: "تم تحديث بيانات الطالب بنجاح",
        student: updatedStudent,
      });
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ error: "فشل في تحديث بيانات الطالب" });
    }
  });

  // Delete unclaimed student
  app.delete("/api/admin/students/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const studentId = parseInt(req.params.id);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }

      // Verify the student belongs to this school and is unclaimed
      const existingStudent = await storage.getUnclaimedStudent(
        studentId,
        schoolId,
      );
      if (!existingStudent) {
        return res
          .status(404)
          .json({ error: "الطالب غير موجود أو مربوط بحساب بالفعل" });
      }

      await storage.deleteStudent(studentId);

      res.json({ message: "تم حذف الطالب بنجاح" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "فشل في حذف الطالب" });
    }
  });

  // Desktop QR Scanner API endpoints
  app.post("/api/scan-student-qr", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Only admins and teachers can use desktop scanner
      if (!["admin", "teacher"].includes(req.session.user.role)) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك باستخدام الماسح المكتبي" });
      }

      const { qrData } = req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة" });
      }

      if (!qrData) {
        return res.status(400).json({ error: "بيانات الرمز مطلوبة" });
      }

      // Parse QR data - supporting multiple formats:
      // Format 1: "student:id:schoolId:verified" (test QR codes)
      // Format 2: "student:id:schoolId:uniqueCode" (real student QR codes)
      let studentId: number;
      let studentType: "student" | "child";
      let verificationPart: string;

      try {
        const parts = qrData.split(":");
        if (parts.length < 4 || !["student", "child"].includes(parts[0])) {
          throw new Error("صيغة الرمز غير صحيحة");
        }

        studentType = parts[0] as "student" | "child";
        studentId = parseInt(parts[1]);
        const qrSchoolId = parseInt(parts[2]);
        verificationPart = parts[3];

        // Verify school ID matches
        if (qrSchoolId !== schoolId) {
          return res.status(400).json({ error: "هذا الرمز لا ينتمي لمدرستك" });
        }

        // For test QR codes, check if it's "verified"
        // For real QR codes, we'll verify the student is verified in the database
        if (verificationPart === "verified") {
          console.log(
            "Test QR code detected - bypassing database verification check",
          );
        } else {
          console.log(
            "Real student QR code detected with unique code:",
            verificationPart,
          );
          // For real QR codes, we'll check student verification status from database
        }
      } catch (error) {
        console.error("Error parsing QR data:", error);
        return res.status(400).json({ error: "تعذر قراءة بيانات الرمز" });
      }

      // Add detailed debugging for child lookup issues
      console.log(`🔍 QR Scanner Debug - About to fetch profile:`);
      console.log(`   - Student ID: ${studentId} (type: ${typeof studentId})`);
      console.log(`   - Student Type: ${studentType} (type: ${typeof studentType})`);
      console.log(`   - School ID: ${schoolId} (type: ${typeof schoolId})`);
      console.log(`   - User School ID: ${req.session.user.schoolId} (type: ${typeof req.session.user.schoolId})`);
      console.log(`   - QR Data: ${qrData}`);
      
      // Convert to proper types if needed
      const numericStudentId = Number(studentId);
      const numericSchoolId = Number(schoolId);
      
      console.log(`🔍 After type conversion:`);
      console.log(`   - Student ID: ${numericStudentId} (type: ${typeof numericStudentId})`);
      console.log(`   - School ID: ${numericSchoolId} (type: ${typeof numericSchoolId})`);
      
      if (isNaN(numericStudentId) || isNaN(numericSchoolId)) {
        console.log(`❌ Invalid ID conversion - studentId: ${studentId} -> ${numericStudentId}, schoolId: ${schoolId} -> ${numericSchoolId}`);
        return res.status(400).json({ error: "بيانات معرف غير صحيحة" });
      }

      // Get complete student profile with attendance and payment data
      const studentProfile = await storage.getStudentCompleteProfile(
        numericStudentId,
        studentType,
        numericSchoolId,
      );

      console.log(`🔍 QR Scanner Debug - Profile returned:`);
      console.log(`   - Profile exists: ${studentProfile ? 'Yes' : 'No'}`);
      if (studentProfile) {
        console.log(`   - Student name: ${studentProfile.name}`);
        console.log(`   - Student type: ${studentProfile.type}`);
        console.log(`   - Verified status: ${studentProfile.verified}`);
        console.log(`   - Enrolled groups count: ${studentProfile.enrolledGroups?.length || 0}`);
        console.log(`   - Enrolled groups data: ${JSON.stringify(studentProfile.enrolledGroups)}`);
      } else {
        console.log(`❌ QR Scanner: Failed to get profile for ${studentType} ID ${studentId} in school ${schoolId}`);
        
        // Additional debugging for children specifically
        if (studentType === 'child') {
          console.log(`🔍 Additional child debugging - checking if child exists anywhere...`);
        }
      }

      if (!studentProfile) {
        return res.status(404).json({ error: `لم يتم العثور على ${studentType === 'child' ? 'الطفل' : 'الطالب'}` });
      }

      // For real QR codes (not test ones), verify the student is actually verified
      if (verificationPart !== "verified" && !studentProfile.verified) {
        return res
          .status(400)
          .json({ error: "الطالب غير محقق من قبل الإدارة" });
      }

      console.log("Student profile found:", {
        id: studentProfile.id,
        name: studentProfile.name,
        type: studentProfile.type,
        verified: studentProfile.verified,
      });

      res.json(studentProfile);
    } catch (error) {
      console.error("Error scanning student QR:", error);
      res.status(500).json({ error: "حدث خطأ في مسح الرمز" });
    }
  });

  // Mark attendance via desktop scanner
  app.post("/api/scan-student-qr/mark-attendance", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Only admins and teachers can mark attendance
      if (!["admin", "teacher"].includes(req.session.user.role)) {
        return res.status(403).json({ error: "غير مسموح لك بتسجيل الحضور" });
      }

      const { studentId, studentType, status = "present" } = req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId || !studentId || !studentType) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      // Record attendance for today
      const result = await storage.markStudentAttendanceToday(
        studentId,
        studentType as "student" | "child",
        status as "present" | "absent" | "late" | "excused",
        req.session.user.id,
        schoolId,
      );

      res.json({
        success: true,
        message: "تم تسجيل الحضور بنجاح",
        attendance: result,
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ error: "حدث خطأ في تسجيل الحضور" });
    }
  });

  // Record payment via desktop scanner
  app.post("/api/scan-student-qr/record-payment", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Only admins can record payments
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "غير مسموح لك بتسجيل الدفعات" });
      }

      const {
        studentId,
        studentType,
        amount,
        paymentMethod,
        notes,
        year,
        month,
      } = req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId || !studentId || !studentType || !amount) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      // Record payment
      const result = await storage.recordStudentPayment({
        studentId,
        studentType: studentType as "student" | "child",
        amount: parseFloat(amount),
        paymentMethod,
        notes,
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1,
        paidBy: req.session.user.id,
        schoolId,
      });

      res.json({
        success: true,
        message: "تم تسجيل الدفعة بنجاح",
        payment: result,
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ error: "حدث خطأ في تسجيل الدفعة" });
    }
  });

  // Get student's enrolled groups for ticket printer
  app.get("/api/students/:studentId/groups", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Only admins and teachers can access this
      if (!["admin", "teacher"].includes(req.session.user.role)) {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بالوصول لهذه البيانات" });
      }

      const { studentId } = req.params;
      const { type } = req.query;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة" });
      }

      // Get student's enrolled groups based on type
      const groups = await storage.getStudentEnrolledGroups(
        parseInt(studentId),
        schoolId,
      );

      res.json(groups);
    } catch (error) {
      console.error("Error fetching student groups:", error);
      res.status(500).json({ error: "حدث خطأ في جلب مجموعات الطالب" });
    }
  });

  // Create a test student with group assignments for debugging
  app.post("/api/debug/create-test-student", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة" });
      }

      // Create a test group first if none exist
      const existingGroups = await storage.getGroupsBySchool(schoolId);
      let testGroup;

      if (existingGroups.length === 0) {
        // Create a test group
        testGroup = await storage.createGroup({
          name: "مجموعة الرياضيات التجريبية",
          description: "مجموعة تجريبية للاختبار",
          category: "المتوسط",
          maxMembers: 30,
          schoolId: schoolId,
        });
        console.log("Created test group:", testGroup);
      } else {
        testGroup = existingGroups[0];
        console.log("Using existing group:", testGroup);
      }

      // Check if test student exists
      const existingUsers = await storage.searchUsers("طالب تجريبي");
      let testUserId = 1;

      if (existingUsers.length === 0) {
        // Create test user/student
        const testUser = await storage.createUser({
          email: "test@student.com",
          password: "password123",
          role: "user",
          name: "طالب تجريبي",
          phone: "0123456789",
          schoolId: schoolId,
          verified: true,
        });
        testUserId = testUser.id;
        console.log("Created test student:", testUser);
      } else {
        testUserId = existingUsers[0].id;
      }

      // Skip group assignment for now - would need to implement proper method
      // const assignment = await db.insert(groupStudents).values({
      //   groupId: testGroup.id,
      //   studentId: testUserId,
      //   studentType: 'student',
      //   schoolId: schoolId,
      //   enrolledAt: new Date()
      // }).returning();

      res.json({
        message: "تم إنشاء طالب تجريبي",
        testGroup,
        studentId: testUserId,
      });
    } catch (error) {
      console.error("Error creating test student:", error);
      res.status(500).json({ error: "فشل في إنشاء البيانات التجريبية" });
    }
  });

  // DEBUG: Get all payment records for debugging
  app.get("/api/debug/payments/:schoolId", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const payments = await storage.getAllPaymentsFromDatabase(schoolId);
      res.json(payments);
    } catch (error) {
      console.error("Error getting debug payments:", error);
      res.status(500).json({ error: "Failed to get payment records" });
    }
  });

  // Debug endpoint to check student group assignments
  app.get("/api/debug/student/:studentId/groups", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { studentId } = req.params;
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة" });
      }

      // Get detailed debug information
      const studentProfile = await storage.getStudentCompleteProfile(
        parseInt(studentId),
        "student",
        schoolId,
      );
      const enrolledGroups = await storage.getStudentEnrolledGroups(
        parseInt(studentId),
        schoolId,
      );

      res.json({
        studentId: parseInt(studentId),
        schoolId,
        studentProfile,
        enrolledGroups,
        totalGroups: enrolledGroups.length,
        profileHasGroups: studentProfile?.enrolledGroups?.length || 0,
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ error: "حدث خطأ في التحقق من المجموعات" });
    }
  });

  // Test endpoint to verify API is working
  // Test endpoint to get ALL payments from database
  app.get("/api/test-all-payments", async (req, res) => {
    try {
      console.log("🧪 Test all-payments endpoint called");
      console.log("🧪 Session data:", {
        schoolId: req.session.schoolId,
        userId: req.session.userId,
        user: req.session.user ? 'exists' : 'none'
      });
      
      const schoolId = req.session.schoolId;
      if (!schoolId) {
        console.log("❌ No school ID in session");
        return res.status(400).json({ 
          error: "School ID not found in session",
          session: {
            hasSchoolId: !!req.session.schoolId,
            hasUserId: !!req.session.userId,
            hasUser: !!req.session.user
          }
        });
      }

      console.log(`🔍 Fetching payments for schoolId: ${schoolId}`);
      const allPayments = await storage.getAllPaymentsFromDatabase(schoolId);
      
      res.json({
        success: true,
        count: allPayments.length,
        schoolId: schoolId,
        payments: allPayments,
        debug: {
          sessionSchoolId: req.session.schoolId,
          totalRecordsFound: allPayments.length
        }
      });

    } catch (error) {
      console.error("❌ Error in test-all-payments endpoint:", error);
      res.status(500).json({ 
        error: "Failed to fetch payments",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/test-payment", async (req, res) => {
    console.log("🧪 Test payment endpoint called");
    console.log("Session:", req.session?.user ? "Valid" : "None");
    res.json({
      success: true,
      message: "API is working",
      session: !!req.session?.user,
    });
  });

  // Financial reports endpoint for gains/losses calculation
  app.post("/api/financial-reports", async (req, res) => {
    console.log("💰 Financial reports request received");

    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "غير مسموح لك بعرض التقارير المالية" });
      }

      const { year, month } = req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId || !year) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      console.log("Generating financial report for:", {
        year,
        month,
        schoolId,
      });

      // Get financial data from storage
      const financialData = await storage.getFinancialReportData(
        schoolId,
        year,
        month,
      );

      console.log("✅ Financial report generated successfully");
      res.json(financialData);
    } catch (error) {
      console.error("❌ Error generating financial report:", error);
      res.status(500).json({ error: "حدث خطأ في إنشاء التقرير المالي" });
    }
  });

  // Financial Entries Routes (for manual gains and losses)
  app.post("/api/financial-entries", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لإضافة الإدخالات المالية" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const entryData = insertFinancialEntrySchema.parse({
        ...req.body,
        schoolId,
        recordedBy: req.session.user.id,
      });

      const entry = await storage.createFinancialEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("❌ Error creating financial entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error:
            "بيانات غير صحيحة: " +
            error.errors.map((e) => e.message).join(", "),
        });
      }
      res.status(500).json({ error: "فشل في إضافة الإدخال المالي" });
    }
  });

  app.get("/api/financial-entries", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لعرض الإدخالات المالية" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const { year, month } = req.query;
      const entries = await storage.getFinancialEntries(
        schoolId,
        year ? parseInt(year as string) : undefined,
        month ? parseInt(month as string) : undefined,
      );

      res.json(entries);
    } catch (error) {
      console.error("❌ Error fetching financial entries:", error);
      res.status(500).json({ error: "فشل في جلب الإدخالات المالية" });
    }
  });

  // Teacher Payment Status Routes
  app.get("/api/teacher-payment-status", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لعرض حالة دفع المعلمين" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const { teacherId, paymentMonth } = req.query;
      const statuses = await storage.getTeacherPaymentStatuses(
        schoolId,
        teacherId ? parseInt(teacherId as string) : undefined,
        paymentMonth as string | undefined
      );

      res.json(statuses);
    } catch (error) {
      console.error("❌ Error fetching teacher payment statuses:", error);
      res.status(500).json({ error: "فشل في جلب حالة دفع المعلمين" });
    }
  });

  app.post("/api/teacher-payment-status", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "صلاحيات المدير مطلوبة لتحديث حالة دفع المعلمين" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const { teacherId, paymentMonth, isPaid } = req.body;

      if (!teacherId || !paymentMonth || typeof isPaid !== 'boolean') {
        return res.status(400).json({ error: "بيانات ناقصة أو غير صحيحة" });
      }

      const status = await storage.updateTeacherPaymentStatus(
        schoolId,
        teacherId,
        paymentMonth,
        isPaid,
        req.session.user.id
      );

      res.json(status);
    } catch (error) {
      console.error("❌ Error updating teacher payment status:", error);
      res.status(500).json({ error: "فشل في تحديث حالة دفع المعلم" });
    }
  });

  // Gain/Loss Calculator Routes
  app.get("/api/gain-loss-entries", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const entries = await storage.getFinancialEntries(schoolId);
      res.json(entries);
    } catch (error) {
      console.error("❌ Error fetching gain/loss entries:", error);
      res.status(500).json({ error: "فشل في جلب البيانات" });
    }
  });

  app.post("/api/gain-loss-entries", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const entryData = insertFinancialEntrySchema.parse({
        ...req.body,
        schoolId,
        recordedBy: req.session.user.id,
      });

      const entry = await storage.createFinancialEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("❌ Error creating gain/loss entry:", error);
      console.error("❌ Error details:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error:
            "بيانات غير صحيحة: " +
            error.errors.map((e) => e.message).join(", "),
        });
      }
      // Include more detailed error information for debugging
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Database error details:", errorMessage);
      res.status(500).json({ error: "فشل في إضافة العملية" });
    }
  });

  app.post("/api/gain-loss-entries/reset", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const schoolId = req.session.user.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      await storage.resetFinancialEntries(schoolId);
      res.json({ success: true, message: "تم إعادة تعيين الرصيد بنجاح" });
    } catch (error) {
      console.error("❌ Error resetting balance:", error);
      res.status(500).json({ error: "فشل في إعادة تعيين الرصيد" });
    }
  });

  // Get payment history for a student in a specific group
  app.post("/api/scan-student-qr/get-payments", async (req, res) => {
    console.log("💰 Getting payment history");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { studentId, studentType, groupId, year } = req.body;
      const schoolId = req.session.user.schoolId;

      if (!schoolId || !studentId || !groupId || !year) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      console.log("Fetching payments for:", {
        studentId,
        studentType,
        groupId,
        year,
        schoolId,
      });

      // Get payment records for this student/group/year
      const payments = await storage.getStudentGroupPayments(
        studentId,
        groupId,
        year,
        schoolId,
      );
      console.log("Found payments:", payments.length);

      // Extract paid months from payment records
      const paidMonths = payments
        .map((payment) => payment.month)
        .sort((a, b) => a - b);

      console.log("✅ Paid months for student:", paidMonths);

      res.json({
        paidMonths,
        payments: payments.map((p) => ({
          month: p.month,
          year: p.year,
          amount: p.amount,
          paidDate: p.paidDate,
          notes: p.notes,
        })),
      });
    } catch (error) {
      console.error("❌ Error fetching payments:", error);
      res.status(500).json({ error: "حدث خطأ في جلب سجل المدفوعات" });
    }
  });

  // Create ticket-based payment with multiple groups and months
  app.post("/api/scan-student-qr/create-ticket-payment", async (req, res) => {
    console.log("🎫 Payment ticket creation request received");
    console.log(
      "Session user:",
      req.session?.user
        ? {
            id: req.session.user.id,
            role: req.session.user.role,
            schoolId: req.session.user.schoolId,
          }
        : "None",
    );
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
      if (!req.session?.user) {
        console.log("❌ No session user found");
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      // Only admins can create ticket payments
      if (req.session.user.role !== "admin") {
        console.log("❌ User role is not admin:", req.session.user.role);
        return res
          .status(403)
          .json({ error: "غير مسموح لك بإنشاء إيصال الدفع" });
      }

      const { transactions, totalAmount } = req.body;
      const schoolId = req.session.user.schoolId;

      console.log("Validating request data:", {
        schoolId,
        transactions: transactions ? transactions.length : "undefined",
        totalAmount,
      });

      if (
        !schoolId ||
        !transactions ||
        !Array.isArray(transactions) ||
        transactions.length === 0
      ) {
        console.log("❌ Validation failed - missing data");
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      // Generate unique receipt ID
      const receiptId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      console.log("📄 Generated receipt ID:", receiptId);

      // Process each transaction
      const createdTransactions = [];
      const failedTransactions = [];

      for (const transaction of transactions) {
        console.log("💰 Processing transaction:", transaction);

        try {
          // **FIX: Determine correct userId based on studentType**
          let userId: number;
          
          if (transaction.studentType === "student") {
            // For direct students, get the actual user ID from the student record
            const student = await storage.getStudentById(transaction.studentId);
            if (!student || !student.userId) {
              throw new Error(`Student with ID ${transaction.studentId} not found or has no userId`);
            }
            userId = student.userId; // Use the student's actual user ID
          } else if (transaction.studentType === "child") {
            // For children, get parent's userId
            const child = await storage.getChildById(transaction.studentId);
            if (!child || !child.parentId) {
              throw new Error(`Child with ID ${transaction.studentId} not found or has no parent`);
            }
            userId = child.parentId; // Parent's user ID
          } else {
            throw new Error(`Unknown student type: ${transaction.studentType}`);
          }

          console.log(`📝 Payment logic: studentId=${transaction.studentId}, studentType=${transaction.studentType}, determined userId=${userId}`);

          console.log(
            `📝 Creating payment record for studentId=${transaction.studentId}, userId=${userId}, groupId=${transaction.groupId}, month ${transaction.month}/${transaction.year}, amount: ${transaction.amount}`,
          );
          
          const paymentRecord = await storage.createStudentPayment(
            transaction.studentId, // Student or child ID
            userId, // User ID (parent for children, same as studentId for direct students)
            transaction.studentType as "student" | "child",
            transaction.year,
            transaction.month,
            transaction.amount,
            schoolId,
            transaction.groupId, // ✅ CRITICAL: Pass groupId for group-specific payments
            req.session.user.id,
            `${transaction.notes || ""} - إيصال: ${receiptId}`.trim(),
          );
          console.log("✅ Payment record created successfully:", {
            id: paymentRecord.id,
            userId: paymentRecord.userId,
            studentType: paymentRecord.studentType,
            month: paymentRecord.month,
            year: paymentRecord.year,
            isPaid: paymentRecord.isPaid,
            amount: paymentRecord.amount,
            schoolId: paymentRecord.schoolId,
          });

          // Immediate verification: Check if payment can be retrieved
          setTimeout(async () => {
            try {
              const verificationCheck = await storage.getStudentPaymentStatus(
                transaction.studentId, // Use studentId for verification check
                transaction.year,
                transaction.month,
                schoolId,
              );
              console.log("🔍 Payment verification check result:", {
                found: verificationCheck ? "YES" : "NO",
                isPaid: verificationCheck?.isPaid || false,
                amount: verificationCheck?.amount || "N/A",
                userId: verificationCheck?.userId,
                month: verificationCheck?.month,
                year: verificationCheck?.year,
              });

              // Also verify via group payment status API
              const groupResponse = await fetch(
                `http://localhost:5000/api/groups/${transaction.groupId}/payment-status/${transaction.year}/${transaction.month}`,
                {
                  headers: { Cookie: req.headers.cookie || "" },
                },
              );

              if (groupResponse.ok) {
                const groupPaymentData = await groupResponse.json();
                const groupStudentPayment = groupPaymentData.find(
                  (record: any) => record.studentId === transaction.studentId,
                );
                console.log("🔍 Group API verification check:", {
                  found: groupStudentPayment ? "YES" : "NO",
                  isPaid: groupStudentPayment?.isPaid || false,
                  totalRecords: groupPaymentData.length,
                });
              }
            } catch (verifyError) {
              console.error("❌ Verification check failed:", verifyError);
            }
          }, 200);

          // Determine student type for transaction
          let studentType: "student" | "child" = "student";

          // Check if it's a user (direct student)
          const userStudent = await storage.getUser(transaction.studentId);
          if (!userStudent || userStudent.schoolId !== schoolId) {
            // If not found in users, it must be a child
            studentType = "child";
          }

          // Create transaction record
          const transactionRecord = await storage.createTransaction({
            schoolId,
            groupId: transaction.groupId,
            studentId: transaction.studentId,

            transactionType: "payment",
            amount: transaction.amount, // Amount in DA (Dinars)
            currency: "DZD",
            description: `دفع شهر ${transaction.month}/${transaction.year}`,
            paidDate: new Date(),
            paymentMethod: "cash", // Always cash
            status: "paid",
            notes: `${transaction.notes || ""} - إيصال: ${receiptId}`.trim(),
            recordedBy: req.session.user.id,
          });
          console.log("✅ Transaction record created:", transactionRecord.id);

          createdTransactions.push({
            paymentRecord,
            transactionRecord,
          });
        } catch (transactionError: any) {
          console.error("❌ Error processing transaction:", transactionError);
          console.error("❌ Failed transaction details:", {
            studentId: transaction.studentId,
            studentType: transaction.studentType,
            groupId: transaction.groupId,
            month: transaction.month,
            year: transaction.year,
            amount: transaction.amount
          });
          
          // Log the failed transaction but continue processing others
          failedTransactions.push({
            transaction,
            error: transactionError?.message || transactionError
          });
          
          // Continue to next transaction instead of breaking the entire loop
          continue;
        }
      }

      // Log processing results
      console.log(`✅ Transaction processing completed: ${createdTransactions.length} successful, ${failedTransactions.length} failed`);
      
      if (failedTransactions.length > 0) {
        console.log("❌ Failed transactions:", failedTransactions);
      }
      
      const response = {
        success: createdTransactions.length > 0, // Success if at least one transaction succeeded
        message: failedTransactions.length === 0 
          ? "تم إنشاء إيصال الدفع بنجاح" 
          : `تم إنشاء إيصال الدفع جزئياً: ${createdTransactions.length} نجح، ${failedTransactions.length} فشل`,
        receiptId,
        totalAmount,
        successCount: createdTransactions.length,
        failedCount: failedTransactions.length,
        transactions: createdTransactions,
        failures: failedTransactions,
      };

      console.log("📤 Sending response:", response);
      res.json(response);
    } catch (error: any) {
      console.error("❌ Error creating ticket payment:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message);
      res.status(500).json({ error: "حدث خطأ في إنشاء إيصال الدفع" });
    }
  });

  console.log('✅ ROUTE REGISTRATION COMPLETED - All routes registered successfully!');
  console.log('🎯 Teacher creation endpoint should be available at: POST /api/users/create-teacher');
  return httpServer;
}
