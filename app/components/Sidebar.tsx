'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  FolderOpen,
  MessageSquare,
  PlusCircle,
  Inbox,
  Settings
} from 'lucide-react';

const menuItems = [
  { name: 'Directory', path: '/', icon: FolderOpen },
  { name: 'Introductions', path: '/introductions', icon: MessageSquare },
  { name: 'Add Context', path: '/add-context', icon: PlusCircle },
  { name: 'Inbox', path: '/inbox', icon: Inbox },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'h-screen bg-background border-r flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-accent"
        >
          <ChevronLeft
            className={cn(
              'h-6 w-6 transition-all',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                    'hover:bg-accent',
                    pathname === item.path && 'bg-accent',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
} 