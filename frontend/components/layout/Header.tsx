// frontend/components/layout/Header.tsx
'use client';
import { Bell, Menu, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/review': 'Code Review',
  '/dashboard/docs': 'Doc Generator',
  '/dashboard/bugs': 'Bug Tracker',
  '/dashboard/team': 'Team',
  '/dashboard/settings': 'Settings',
};

export default function Header() {
  const { toggleSidebar, unreadCount } = useAppStore();
  const pathname = usePathname();

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] || 'DevMind';

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm w-56">
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Search... (⌘K)</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
