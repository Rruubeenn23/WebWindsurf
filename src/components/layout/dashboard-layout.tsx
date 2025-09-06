import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import { cn } from '@/lib/utils';

type DashboardLayoutProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  actions?: ReactNode;
};

export function DashboardLayout({
  children,
  className,
  header,
  actions,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r">
          <Sidebar />
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <TopNav />

        {/* Mobile header - Only shown on mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">FitFuel</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Mobile actions */}
            {actions}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page header - Hidden on mobile */}
              {header && (
                <div className="hidden md:flex md:items-center md:justify-between mb-6">
                  {header}
                  <div className="flex space-x-3">{actions}</div>
                </div>
              )}
              
              {/* Page content */}
              <div className={cn('py-4', className)}>{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
