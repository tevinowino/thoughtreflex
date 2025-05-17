// src/components/app/app-header.tsx
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
import { Brain, LayoutDashboard, LogOut, Settings, UserCircle, Menu, Star, Edit3, HelpCircle } from 'lucide-react'; // Added icons
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="flex items-center">
        {isMobile && (
           <Button variant="ghost" size="icon" className="shrink-0 md:hidden mr-2 text-primary" onClick={toggleSidebar}>
             <Menu className="h-5 w-5" />
             <span className="sr-only">Toggle navigation menu</span>
           </Button>
        )}
        {/* Hide full logo on mobile to save space if sidebar is prominent */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold group">
          <Brain className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
          <span className="hidden md:inline-block text-xl text-foreground group-hover:text-primary transition-colors">ThoughtReflex</span>
        </Link>
      </div>
      
      <div className="flex flex-1 items-center gap-2 md:gap-4 justify-end">
         <Button variant="ghost" size="sm" className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary" asChild>
            <Link href="/journal/new"><Edit3 className="h-4 w-4"/> New Session</Link>
        </Button>
        <ModeToggle />
        {user && !loading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-9 w-9 border-2 border-primary/30 hover:border-primary transition-colors">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}  data-ai-hint="profile avatar user" />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl shadow-xl border-border/50 mt-2">
              <DropdownMenuLabel className="px-3 py-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">{user.displayName || 'Valued User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4 text-primary" /> Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings"><UserCircle className="mr-2 h-4 w-4 text-primary" /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings"><Settings className="mr-2 h-4 w-4 text-primary" /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/feedback"><Star className="mr-2 h-4 w-4 text-primary" /> Share Feedback</Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild className="cursor-pointer" disabled>
                 {/* Placeholder for a future help/FAQ link */}
                <span className="opacity-50 flex items-center w-full"><HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Help / FAQ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400 focus:bg-red-500/10 focus:text-red-700 dark:focus:text-red-300 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : loading ? (
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        ) : (
           <Button asChild variant="outline" size="sm">
            <Link href="/login">Log In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
