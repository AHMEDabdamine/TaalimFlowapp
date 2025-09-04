import * as React from 'react';
import type { ReactNode } from 'react';
import { User } from '@shared/schema';
import { ensureFirebaseInitialized } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, children?: any[], role?: string, studentData?: { educationLevel: string, grade: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const { user } = await response.json();
          setUser(user);
          
          // If user has Firebase UID, try to restore Firebase authentication silently
          if (user.firebase_uid) {
            try {
              const { auth } = await ensureFirebaseInitialized();
              if (auth) {
                // Check if Firebase user is already authenticated
                const currentFirebaseUser = auth.currentUser;
                if (!currentFirebaseUser || currentFirebaseUser.uid !== user.firebase_uid) {
                  console.log('Firebase user needs re-authentication for email verification features');
                  // Note: For email verification to work, user needs to login again or 
                  // implement token-based Firebase re-authentication
                }
              }
            } catch (firebaseError) {
              console.log('Firebase check failed during session restore:', firebaseError);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // First try to login with our backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    const { user } = await response.json();
    
    // If user exists in database and Firebase is available, try Firebase login (optional)
    if (user.firebase_uid) {
      try {
        const { auth } = await ensureFirebaseInitialized();
        if (auth) {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (firebaseError) {
        // If Firebase login fails but database login worked, continue with database user
        console.log('Firebase login failed, but database login succeeded');
      }
    }
    
    setUser(user);
  };

  const register = async (email: string, password: string, name: string, phone: string, children: any[] = [], role: string = 'user', studentData?: { educationLevel: string, grade: string }) => {
    // First try to create user in our database
    const requestBody: any = { email, password, name, phone, role };
    
    if (role === 'student' && studentData) {
      requestBody.educationLevel = studentData.educationLevel;
      requestBody.grade = studentData.grade;
    } else if (role === 'user' && children) {
      requestBody.children = children;
    }
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطأ في إنشاء الحساب');
    }
    
    const { user } = await response.json();
    
    // Only create Firebase user after database registration succeeds (if Firebase is available)
    try {
      const { auth } = await ensureFirebaseInitialized();
      if (auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Save Firebase UID to database
        await fetch('/api/auth/update-firebase-uid', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ firebaseUid: firebaseUser.uid }),
        });
        
        console.log('Firebase account created and UID saved:', firebaseUser.uid);
      }
    } catch (firebaseError: any) {
      console.error('Firebase registration error details:', {
        code: firebaseError.code,
        message: firebaseError.message,
        email: email
      });
      
      // If Firebase user already exists, that's okay - we'll use it
      if (firebaseError.code !== 'auth/email-already-in-use') {
        console.warn('Firebase registration failed:', firebaseError);
        // Don't throw here - database registration succeeded
      }
    }
    
    setUser(user);
  };

  const logout = async () => {
    try {
      // Logout from Firebase (if available)
      try {
        const { auth } = await ensureFirebaseInitialized();
        if (auth) {
          await signOut(auth);
        }
      } catch (firebaseError) {
        console.log('Firebase logout failed:', firebaseError);
      }
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      
      // Clear all school context on logout
      localStorage.removeItem('selectedSchool');
      sessionStorage.removeItem('currentSchoolId');
      sessionStorage.removeItem('schoolCode');
      
      // Always redirect to public home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear user state and school context even if logout fails
      setUser(null);
      localStorage.removeItem('selectedSchool');
      sessionStorage.removeItem('currentSchoolId');
      sessionStorage.removeItem('schoolCode');
      
      // Always redirect to public home page
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}