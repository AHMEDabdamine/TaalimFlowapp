import React from "react";
import { useLocation, Switch, Route } from "wouter";
import './utils/apiDebugger'; // Initialize API debugging
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Schedule from "@/pages/Schedule";
import Teachers from "@/pages/Teachers";
import Suggestions from "@/pages/Suggestions";
import Blog from "@/pages/Blog";
import Groups from "@/pages/Groups";
import Formations from "@/pages/Formations";
import Courses from "@/pages/Courses";
import AdminPanel from "@/pages/AdminPanel";
import AdminUsers from "@/pages/AdminUsers";
import AdminContent from "@/pages/AdminContent";
import AdminPanelTest from "@/pages/AdminPanelTest";
import AdminSuggestions from "@/pages/AdminSuggestions";
import AdminVerification from "@/pages/AdminVerification";
import AdminReports from "@/pages/AdminReports";
import AdminStudentManagement from "@/pages/AdminStudentManagement";
import Announcements from "@/pages/Announcements";
import SuperAdminSimple from "@/pages/SuperAdminSimple";
import SchoolSelection from "@/pages/SchoolSelection";
import SchoolCodeEntry from "@/pages/SchoolCodeEntry";
import PublicHome from "@/pages/PublicHome";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import TeacherSpecializations from "@/pages/TeacherSpecializations";
import StudentStatus from "@/pages/StudentStatus";
import DesktopQRScanner from "@/pages/DesktopQRScanner";
import FinancialReports from "@/pages/FinancialReports";
import GainLossCalculator from "@/pages/GainLossCalculator";
import TeacherSalaries from "@/pages/TeacherSalaries";
import { Notifications } from "@/pages/Notifications";
import AdminFormationRegistrations from "@/pages/AdminFormationRegistrations";
import SchoolSubscription from "@/pages/SchoolSubscription";
import SchoolInfo from "@/pages/SchoolInfo";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();
  
  React.useEffect(() => {
    // Clear school context when switching between schools or logging out
    if (location === '/') {
      localStorage.removeItem('selectedSchool');
      sessionStorage.removeItem('currentSchoolId');
      sessionStorage.removeItem('schoolCode');
    }
    
    // If user is authenticated and on a school selection route without a subpage,
    // redirect to the home page within that school
    if (user && location.match(/^\/school\/[^/]+$/)) {
      const schoolCode = location.split('/')[2];
      navigate(`/school/${schoolCode}/home`);
    }
  }, [user, location, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }
  
  return <>{children}</>;
}



function AppRoutes() {
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Responsive container - full width on all devices */}
      <div className="w-full bg-white dark:bg-gray-900 min-h-screen">
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={PublicHome} />
          <Route path="/school-access" component={SchoolCodeEntry} />
          
          {/* Hidden Super Admin Access Route */}
          <Route path="/system/super-admin-access" component={SuperAdminSimple} />
          
          {/* School-specific authenticated routes (must come before general school route) */}
          <Route path="/school/:code/home">
            <AuthWrapper><Layout><Home /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/schedule">
            <AuthWrapper><Layout><Schedule /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/teachers">
            <AuthWrapper><Layout><Teachers /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/messages">
            <AuthWrapper><Layout><Messages /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/suggestions">
            <AuthWrapper><Layout><Suggestions /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/blog">
            <AuthWrapper><Layout><Blog /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/groups">
            <AuthWrapper><Layout><Groups /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/formations">
            <AuthWrapper><Layout><Formations /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/courses">
            <AuthWrapper><Layout><Courses /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/announcements">
            <AuthWrapper><Layout><Announcements /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/profile">
            <AuthWrapper><Layout><Profile /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/notifications">
            <AuthWrapper><Layout><Notifications /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/student-status">
            {(params) => (
              <AuthWrapper>
                <Layout>
                  <StudentStatus />
                </Layout>
              </AuthWrapper>
            )}
          </Route>
          <Route path="/school/:code/teacher-specializations">
            <AuthWrapper><Layout><TeacherSpecializations /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin">
            <AuthWrapper><Layout><AdminPanelTest /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/users">
            <AuthWrapper><Layout><AdminUsers /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/content">
            <AuthWrapper><Layout><AdminContent /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/suggestions">
            <AuthWrapper><Layout><AdminSuggestions /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/verification">
            <AuthWrapper><Layout><AdminVerification /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/reports">
            <AuthWrapper><Layout><AdminReports /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/student-management">
            <AuthWrapper><Layout><AdminStudentManagement /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/admin/formation-registrations">
            <AuthWrapper><Layout><AdminFormationRegistrations /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/desktop-scanner">
            <AuthWrapper><Layout><DesktopQRScanner /></Layout></AuthWrapper>
          </Route>
          <Route path="/school/:code/financial-reports">
            <AuthWrapper><Layout><FinancialReports /></Layout></AuthWrapper>
          </Route>
          
          <Route path="/school/:code/gain-loss-calculator">
            <AuthWrapper><Layout><GainLossCalculator /></Layout></AuthWrapper>
          </Route>
          
          <Route path="/school/:code/teacher-salaries">
            <AuthWrapper><Layout><TeacherSalaries /></Layout></AuthWrapper>
          </Route>
          
          <Route path="/school/:code/school-subscription">
            <AuthWrapper><Layout><SchoolSubscription /></Layout></AuthWrapper>
          </Route>
          
          <Route path="/school/:code/school-info">
            <AuthWrapper><Layout><SchoolInfo /></Layout></AuthWrapper>
          </Route>
          
          {/* School Selection Route (must come after specific routes) */}
          <Route path="/school/:code">
            {(params) => <SchoolSelection schoolCode={params.code} />}
          </Route>
      
          {/* Fallback for unmatched routes */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}



function Router() {
  return <AppRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
