// src/components/app/app-sidebar.tsx
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import Link from 'next/link';
import { Brain, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { toggleSidebar, state, isMobile } = useSidebar();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'TR';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <Sidebar 
      side="left" 
      variant="sidebar" 
      collapsible="icon" 
      className="border-r border-sidebar-border shadow-md"
    >
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold group">
          <Brain className="h-7 w-7 text-sidebar-primary transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            ThoughtReflex
          </span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden md:hidden"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </SidebarHeader>
      <SidebarSeparator className="mx-0 w-full bg-sidebar-border/50"/>
      <SidebarContent className="p-0 flex-1">
        <SidebarGroup className="py-2">
          <MainNav />
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0 w-full bg-sidebar-border/50"/>
      <SidebarFooter className="p-3">
        {user && (
          <div className="flex items-center p-1.5 gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
            <Avatar className="h-9 w-9 border-2 border-sidebar-accent">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="profile avatar small" />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user.displayName || 'Valued User'}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
         <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="hidden md:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:h-9 mt-1"
          aria-label="Toggle sidebar"
        >
          {state === 'expanded' ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
