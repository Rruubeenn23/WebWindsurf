import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icons } from '../icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Icons.home },
  { name: 'Nutrition', href: '/nutrition', icon: Icons.utensils },
  { name: 'Workouts', href: '/workouts', icon: Icons.dumbbell },
  { name: 'Hydration', href: '/hydration', icon: Icons.water },
  { name: 'Analytics', href: '/analytics', icon: Icons.barChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <Icons.logo className="w-8 h-8 text-primary" />
        <span className="ml-2 text-xl font-semibold">FitFuel</span>
      </div>
      <div className="flex flex-col flex-grow mt-5">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <Icons.user className="h-9 w-9 rounded-full text-muted-foreground" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">User Name</p>
              <Link
                href="/profile"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
