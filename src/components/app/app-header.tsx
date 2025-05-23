
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { Brain, LayoutDashboard, LogOut, Settings, UserCircle, Menu, Star, Edit3, HelpCircle, Flame, DownloadCloud } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import InstallPWAButton from './install-pwa-button'; // Import the InstallPWAButton

export function AppHeader() {
  const { user, signOut, loading } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar(); 

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'TR';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const currentStreak = user?.currentStreak || 0;
  let flameColorClass = 'text-primary'; 
  let flameAnimationClass = '';

  if (currentStreak === 0) {
    flameColorClass = 'text-muted-foreground/60'; 
  } else if (currentStreak >= 1 && currentStreak <= 9) {
    flameColorClass = 'text-primary/80'; 
  } else if (currentStreak >= 10 && currentStreak <= 19) {
    flameColorClass = 'text-red-500 dark:text-red-400';
  } else if (currentStreak >= 20 && currentStreak <= 99) {
    flameColorClass = 'text-green-500 dark:text-green-400';
  } else if (currentStreak >= 100) {
    flameColorClass = 'text-orange-500 dark:text-orange-400';
    flameAnimationClass = 'animate-pulse';
  }


  return (
    <header className="sticky top-0 z-40 w-full flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 md:px-6 shadow-sm">
      <div className="flex items-center flex-shrink-0">
        {isMobile && (
           <Button variant="ghost" size="icon" className="mr-2 text-primary" onClick={toggleSidebar}>
             <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
             <span className="sr-only">Toggle navigation menu</span>
           </Button>
        )}
        <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 font-semibold group">
          <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform group-hover:rotate-12" />
          <span className="text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors max-w-[120px] sm:max-w-none truncate">ThoughtReflex</span>
        </Link>
      </div>
      
      <div className="flex flex-1 items-center gap-1.5 sm:gap-2 md:gap-3 justify-end">
         <Button variant="ghost" size="sm" className="hidden xs:inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary" asChild>
            <Link href="/journal/new">
              <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
              <span className="hidden sm:inline-block">New Session</span>
              <span className="sm:hidden">New</span>
            </Link>
        </Button>

        {user && !loading && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 sm:h-9 sm:w-9 relative", flameColorClass)}>
                  <Flame className={cn("h-[22px] w-[22px] sm:h-6 sm:w-6", flameAnimationClass)} />
                  {currentStreak > 0 && (
                    <span
                      className={cn(
                        "absolute top-1/2 left-2 -translate-x-1/2 -translate-y-[55%] text-[9px] sm:text-[10px] font-bold text-white",
                        "drop-shadow-[0_0.8px_0.8px_rgba(0,0,0,0.6)] dark:drop-shadow-[0_0.8px_0.8px_rgba(0,0,0,0.9)]"
                      )}
                    >
                      {currentStreak}
                    </span>
                  )}
                  <span className="sr-only">Journaling Streak</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg rounded-md">
                <p>Current Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* PWA Install Button in Header */}
        <div className="sm:flex"> {/* Hide on very small screens if it gets too cluttered */}
            <InstallPWAButton />
        </div>


        <ModeToggle />
        {user && !loading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0">
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 border-2 border-primary/30 hover:border-primary transition-colors">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs sm:text-sm">{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] sm:w-60 rounded-xl shadow-xl border-border/50 mt-2">
              <DropdownMenuLabel className="px-3 py-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground truncate">{user.displayName || 'Valued User'}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard" className="flex items-center"><LayoutDashboard className="mr-2 h-4 w-4 text-primary" /> Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings" className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-primary" /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings" className="flex items-center"><Settings className="mr-2 h-4 w-4 text-primary" /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/feedback" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" /> Share Feedback</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer" disabled>
                <span className="opacity-50 flex items-center w-full"><HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Help / FAQ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { signOut().catch(err => console.error("Sign out error:", err)); }} className="text-red-600 dark:text-red-400 focus:bg-red-500/10 focus:text-red-700 dark:focus:text-red-300 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : loading ? (
          <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-muted animate-pulse" />
        ) : (
           <Button asChild variant="outline" size="sm" className="h-8 sm:h-9 text-sm">
            <Link href="/login">Log In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
