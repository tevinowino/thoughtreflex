
// src/components/app/notification-manager.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { differenceInDays, parseISO, format } from 'date-fns';

const NOTIFICATION_PERMISSION_KEY = 'thoughtreflex_notification_permission';

function getTodayDateString() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getLocalStorageKey(type: string, dateSuffix: string = getTodayDateString()) {
  return `thoughtreflex_notif_${type}_${dateSuffix}`;
}

function hasNotificationBeenHandledToday(type: string, specificTimeKey?: string): boolean {
  if (typeof window === 'undefined') return true; // Don't run on server
  const key = specificTimeKey || getLocalStorageKey(type);
  return localStorage.getItem(key) === 'true';
}

function markNotificationAsHandledToday(type: string, specificTimeKey?: string) {
  if (typeof window === 'undefined') return;
  const key = specificTimeKey || getLocalStorageKey(type);
  localStorage.setItem(key, 'true');
}

// Centralized function to show notifications
export function showLocalNotification(title: string, options: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this environment.');
    return;
  }

  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker.controller) { // Check if SW is active
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options).catch(err => {
                console.error('Service Worker Notification Error:', err);
                // Fallback if SW notification fails
                new Notification(title, options);
            });
        });
    } else {
        // Fallback for environments where SW might not be active (e.g., some dev scenarios)
        new Notification(title, options);
    }
  } else {
    console.log('Notification permission not granted. Cannot show notification.');
  }
}


export default function NotificationManager() {
  const { user, updateUserProfile, refreshUserProfile } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const storedPermission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;
    if (storedPermission && (storedPermission === 'granted' || storedPermission === 'denied')) {
      setPermission(storedPermission);
      return;
    }

    if (Notification.permission === 'default') {
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, requestedPermission);
      if (requestedPermission === 'granted') {
        showLocalNotification('Notifications Enabled! 🔔', {
          body: 'ThoughtReflex will now send you helpful reminders and insights.',
          icon: '/icons/icon-192x192.png',
        });
      }
    } else {
      setPermission(Notification.permission);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Notification.permission);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Effect for scheduling fixed-time daily/weekly notifications
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const schedule = (id: string, hour: number, minute: number, title: string, body: string, tag: string, dayOfWeek?: number) => {
      const now = new Date();
      let targetTime = new Date(now);

      if (dayOfWeek !== undefined) { // Weekly
        const currentDay = now.getDay();
        let daysUntilTarget = dayOfWeek - currentDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute)))) {
          daysUntilTarget += 7;
        }
        targetTime.setDate(now.getDate() + daysUntilTarget);
      } else { // Daily
         if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute)) {
            targetTime.setDate(now.getDate() + 1); // Schedule for tomorrow if time has passed
        }
      }
      targetTime.setHours(hour, minute, 0, 0);

      const scheduledTimeKey = getLocalStorageKey(tag, format(targetTime, 'yyyy-MM-dd-HH-mm'));

      if (hasNotificationBeenHandledToday(tag, scheduledTimeKey)) {
        return; // Already scheduled or shown for this exact target time
      }
      
      const delay = targetTime.getTime() - now.getTime();
      if (delay < 0) return; // Should not happen with logic above but as a safeguard

      console.log(`Scheduling '${title}' for ${targetTime.toLocaleString()} (delay: ${delay}ms)`);
      const timeoutId = setTimeout(() => {
        showLocalNotification(title, { body, tag, icon: '/icons/icon-192x192.png', data: { url: '/dashboard' } });
        localStorage.removeItem(scheduledTimeKey); // Allow re-scheduling for the next cycle
        // Re-schedule for next occurrence (this part needs robust logic for persistence if app closes)
        // For now, it will only reschedule if the app is open when the notification fires.
        schedule(id, hour, minute, title, body, tag, dayOfWeek); 
      }, delay);
      
      markNotificationAsHandledToday(tag, scheduledTimeKey);
      return () => clearTimeout(timeoutId); // Cleanup
    };

    const timeouts: Array<() => void> = [];

    timeouts.push(schedule('dailyTopic', 20, 0, "Tonight’s Healing Topic 🌱", "Take a few minutes to explore today’s guided reflection with Mira.", 'dailyTopic'));
    timeouts.push(schedule('journalReminder', 21, 0, "Gentle Nudge from Mira 🌙", "Time to journal and reflect on your day.", 'journalReminder'));
    timeouts.push(schedule('weeklyRecap', 21, 0, "Weekly Recap 📖", "Let’s revisit your week and see how far you’ve come.", 'weeklyRecap', 0)); // 0 = Sunday
    timeouts.push(schedule('gratitudePrompt', 7, 0, "Gratitude Time ☀️", "What’s one thing you’re grateful for today? Let’s start the day with a full heart.", 'gratitudePrompt'));

    return () => {
      timeouts.forEach(clear => clear && clear());
    };
  }, [user, permission]);


  // Effect for conditional notifications (random, streak, compassion)
  useEffect(() => {
    if (!user || permission !== 'granted') return;
    const todayStr = getTodayDateString();

    // Random Support Message (Weekdays 12 PM - 5 PM)
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    if (day >= 1 && day <= 5 && hour >= 12 && hour < 17) { // Weekday, 12 PM to 4:59 PM
      if (!hasNotificationBeenHandledToday('randomSupport')) {
        if (Math.random() < 0.2) { // 20% chance to show if not shown today
          showLocalNotification("Mira’s Here 💜", {
            body: "You're not alone. I’m always here if you need to talk.",
            tag: 'randomSupport',
            icon: '/icons/icon-192x192.png',
          });
          markNotificationAsHandledToday('randomSupport');
        }
      }
    }

    // Streak Warning (after 8:45 PM if no journal today)
    if (hour >= 20 && now.getMinutes() >= 45) { // After 8:45 PM
      if (user.lastJournalDate !== todayStr && !hasNotificationBeenHandledToday('streakWarning')) {
        showLocalNotification("Streak Alert ⚠️", {
          body: "Looks like you haven’t journaled today. Let’s keep the streak going!",
          tag: 'streakWarning',
          icon: '/icons/icon-192x192.png',
          data: { url: '/journal/new' }
        });
        markNotificationAsHandledToday('streakWarning');
      }
    }

    // Compassion Check-In (if missed a day)
    if (user.lastJournalDate && user.lastJournalDate !== todayStr) {
      const lastJournal = parseISO(user.lastJournalDate);
      if (differenceInDays(now, lastJournal) > 1 && user.lastCompassionCheckInDate !== todayStr) {
        if (!hasNotificationBeenHandledToday('compassionCheckIn')) {
          showLocalNotification("It’s Okay to Rest 💛", {
            body: "You didn’t check in yesterday, and that’s totally okay. Mira is still here for you when you’re ready.",
            tag: 'compassionCheckIn',
            icon: '/icons/icon-192x192.png',
          });
          markNotificationAsHandledToday('compassionCheckIn');
          updateUserProfile({ lastCompassionCheckInDate: todayStr }).then(() => refreshUserProfile && refreshUserProfile());
        }
      }
    }
  }, [user, permission, updateUserProfile, refreshUserProfile]);

  return null; // This component does not render UI
}
