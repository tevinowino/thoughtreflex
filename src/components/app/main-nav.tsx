
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookText,
  Target,
  Sparkles,
  Settings,
  CalendarCheck,
  NotebookPen, 
  Star,
  TestTube2,
  Lightbulb, // Added Lightbulb for Mind Shifts
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/journal', label: 'Journal (AI Chat)', icon: <BookText /> },
  { href: '/notebook', label: 'Notebook', icon: <NotebookPen /> }, 
  { href: '/goals', label: 'Goals', icon: <Target /> },
  { href: '/mind-shifts', label: 'Mind Shifts', icon: <Lightbulb /> }, // New Mind Shifts item
  { href: '/insights', label: 'Insights', icon: <Sparkles /> },
  { href: '/recaps', label: 'Weekly Recaps', icon: <CalendarCheck /> },
  { href: '/personality-test', label: 'Personality', icon: <TestTube2 /> },
  { href: '/feedback', label: 'Share Feedback', icon: <Star /> },
  { href: '/settings', label: 'Settings', icon: <Settings /> },
];

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-col gap-2 text-sm font-medium", className)}
      {...props}
    >
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, className: "bg-card text-card-foreground border-border shadow-lg" }}
                className="justify-start"
              >
                {item.icon}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
