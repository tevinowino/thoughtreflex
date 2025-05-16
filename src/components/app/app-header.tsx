
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { Brain, LayoutDashboard, LogOut, Settings, UserCircle, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/mode-toggle';

export function AppHeader() {
  const { user, signOut, loading } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar(); 

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'TR';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center">
        {isMobile && (
           <Button variant="outline" size="icon" className="shrink-0 md:hidden mr-2" onClick={toggleSidebar}>
             <Menu className="h-5 w-5" />
             <span className="sr-only">Toggle navigation menu</span>
           </Button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-primary" />
          <span className="hidden md:inline-block">ThoughtReflex</span>
        </Link>
      </div>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
        <ModeToggle />
        {user && !loading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'}  data-ai-hint="profile avatar" />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
              </DropdownMenuItem>
              {/* Link to /settings which handles profile info */}
              <DropdownMenuItem asChild>
                <Link href="/settings"><UserCircle className="mr-2 h-4 w-4" /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : loading ? (
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        ) : (
           <Button asChild variant="outline">
            <Link href="/login">Log In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
