'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'TR';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            ThoughtReflex
          </span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="p-0">
        <SidebarGroup>
          <MainNav />
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2">
        {user && (
          <div className="flex items-center p-2 gap-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} data-ai-hint="profile avatar small" />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user.displayName || 'User'}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
