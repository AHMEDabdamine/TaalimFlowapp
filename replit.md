# Progressive Web App (PWA) for Private Schools and Training Centers

## Overview
This Progressive Web App (PWA) is a React-based mobile portal for private schools and training centers, offering full Arabic support with RTL layout. It aims to streamline communication and management within educational institutions, providing features for announcements, blog posts, teacher communication, suggestions, and learning groups. The project's vision is to enhance digital engagement and administrative efficiency in the private education sector, empowering schools with tools for financial analysis, student management, and communication.

## User Preferences
Preferred communication style: Simple, everyday language in English. User prefers English communication over other languages.
Security preference: Code-based school access instead of public school directory for enhanced privacy and security.
Interface preference: Phone verification functionality removed from Profile page for simplified user experience.
Access control preference: School admins should create groups, super admins should only have read-only access to view groups across schools without creation capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom Arabic-optimized design system, utilizing Radix UI primitives and shadcn/ui components
- **State Management**: React Context for authentication, TanStack Query for server state
- **PWA Features**: Service Worker, Web App Manifest, and offline caching capabilities for a robust mobile experience.
- **UI/UX Decisions**: Responsive design optimized for Arabic RTL, mobile-first bottom navigation, and professional, clean interfaces with specific color-coding for educational levels. Gregorian dating is used throughout the application.

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for data persistence and consistency.
- **Authentication**: Firebase Authentication integrated with custom user roles and session-based security for multi-tenancy.
- **File Storage**: Firebase Storage for images and assets.

### Key Features and Implementations
- **Authentication System**: Firebase Authentication, role-based access control (admin, teacher, user), and session-based security for multi-tenancy.
- **QR Code System**: Unique QR code generation for verified students and children with role-based access control, generated post-admin verification.
- **Multi-Tenancy**: Complete data isolation per school via `schoolId` across all database tables. Super admin manages school creation and access keys. Users access schools via secure school codes.
- **Core Features**: Home dashboard, blog system, teacher communication, suggestions/feedback, learning groups/formations management, and a comprehensive admin panel for content and user management.
- **PWA Functionality**: Installable app with manifest, service worker for offline use, and push notifications.
- **Data Flow**: TanStack Query for client-side caching, Express routes with Drizzle ORM for server-side data, Firebase Storage for files.
- **User Management**: Role-based access for students, parents, teachers, and admins. Includes student and child registration, user verification (document-based), and user banning functionality.
- **Communication & Content**: Announcement and blog systems, messaging between users, and a comprehensive notification system.
- **Group & Formation Management**: Creation and management of learning groups and training courses, including student assignment, attendance tracking, and financial management per group. Supports mixed assignment of direct students and children. Implements intelligent year-based filtering and standardized teaching module grade format. **Role-based access control**: School admins create and manage groups, super admins have read-only access across schools.
- **Scheduling System**: Comprehensive schedule management with independent grids per classroom, 30-minute intervals, precise time control, and color-coded displays.
- **Reporting**: Admin interface for managing user reports and banning users.
- **Subject Management**: Complete standardized Algerian education curriculum with proper Arabic subject names organized by education level, covering all standard subjects and specializations. All schools now share the same comprehensive curriculum foundation with 260+ standardized subjects.
- **Desktop QR Scanner**: Real-time student profile lookup system for admins and teachers using webcam or USB scanner. Features student information display, quick attendance marking, and payment recording.
- **Payment Ticket Printer System**: Comprehensive receipt generation system integrated with desktop QR scanner, allowing admins to select multiple enrolled groups, choose payment months, enter amounts, and generate professional printed receipts. Includes real-time payment tracking.
- **Financial Reports & Analytics**: Complete gains/losses calculation system for school financial analysis, including revenue tracking, expense estimation, profit margins, monthly breakdowns, and group performance analytics. Provides detailed insights and supports manual financial entries.
- **Simple Gain/Loss Calculator**: Standalone financial calculator for basic income and expense tracking with real-time balance calculation, transaction history, and admin-only access.
- **Unified Payment Status System**: Ensures synchronized payment status display across all interfaces by using identical API endpoints for attendance tables and payment forms.
- **Curriculum Standardization (August 2025)**: Implemented exact standardized Algerian curriculum across all schools with precisely defined subject list: Primary (3 subjects: العربية والرياضيات, اللغة الإنجليزية, اللغة الفرنسية), Middle (7 subjects: اللغة العربية, اللغة الإنجليزية, اللغة الفرنسية, التاريخ والجغرافيا, الرياضيات, العلوم الطبيعية, الفيزياء), Secondary (19 subjects: اللغة العربية وآدابها, اللغة الإنجليزية, اللغة الفرنسية, اللغة الألمانية, اللغة الإسبانية, اللغة الأمازيغية, الرياضيات, العلوم الطبيعية والحياة, العلوم الفيزيائية, التاريخ والجغرافيا, الفلسفة, التربية الإسلامية, الإعلام الآلي, الاقتصاد والمناجمنت, القانون, المحاسبة, الهندسة الكهربائية, الهندسة المدنية, الهندسة الميكانيكية). All schools share 137 standardized global subject entries with frontend deduplication ensuring clean interface display.
- **DesktopQRScanner Data Retrieval Fix (August 2025)**: Debugged and resolved DesktopQRScanner issue where enrolled groups weren't displaying for scanned students. Root cause: Backend was incorrectly using user IDs instead of student IDs when creating group assignments. Fixed getAvailableStudentsByLevelAndSubject function to return student.id instead of user.id for direct students. Updated updateGroupAssignments and getGroupAssignments functions to properly handle student ID mapping. Successfully tested complete frontend-backend flow confirms assignments now correctly use student IDs, enabling proper group display in QR scanner and student lookup.
- **Enhanced Group Assignment System with Dual ID Storage (August 2025)**: Added userId column to groupMixedAssignments table to store both student ID and user ID for each assignment. This enables efficient session-based queries using user IDs while maintaining consistent UI display and assignment logic using student IDs. Updated updateGroupAssignments to populate both fields when creating assignments and getGroupAssignments to retrieve both IDs. This optimization reduces the need for JOIN queries when accessing user-related data from assignments.
- **Attendance Tracking Cost Optimization (August 2025)**: Enhanced attendance system to use user IDs for cost reduction. Added userId column to groupAttendance table, updated markAttendance and getGroupAttendanceHistory methods to leverage userId for faster lookups, reducing expensive JOIN operations. Implemented automatic userId population from groupMixedAssignments when marking attendance. Backfilled all existing attendance records with proper user IDs for full optimization. System now uses userId for efficient queries while maintaining studentId for UI consistency.
- **Complete User Role Filtering Security (August 2025)**: Applied comprehensive safety filters across all student/children lookup functions to prevent parent users from appearing in student-only contexts. Fixed both `searchStudentsAndChildren` and `getAvailableStudentsByLevelAndSubject` functions with `ne(users.role, "parent")` filters to ensure proper user role separation in Desktop QR Scanner and Groups page student selection interfaces.

## External Dependencies

- **Firebase**: Authentication, File Storage (Firebase Storage).
- **PostgreSQL**: Primary relational database, deployed with Neon.
- **Drizzle ORM**: Object-relational mapping with PostgreSQL, including Zod for validation.
- **React**: Frontend framework.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first CSS framework.
- **Radix UI**: Unstyled component primitives.
- **shadcn/ui**: Component library built on Radix UI.
- **TanStack Query**: Server state management and caching.
- **Express.js**: Backend server framework.
- **Google Fonts**: Noto Sans Arabic.
- **Vite**: Frontend build tool.
- **ESBuild**: Server-side bundling.
- **PostCSS**: CSS post-processor.