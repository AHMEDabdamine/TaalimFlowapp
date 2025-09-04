import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { DesktopSidebar } from '@/components/DesktopSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <DesktopSidebar />
        <div className="mr-80">
          <Header />
          <main className="pt-20 p-8 w-full bg-white dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Header />
        <main className="max-w-md mx-auto pt-20 pb-20 px-4 bg-white dark:bg-gray-900">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
