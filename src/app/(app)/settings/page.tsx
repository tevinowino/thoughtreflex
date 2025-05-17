
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { UserCircle, Bell, Palette, ShieldCheck, LogOut, Brain, Zap, Smile, Image as ImageIcon, UserSquare2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes'; 
import { cn } from '@/lib/utils';

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

const avatarOptions = [
  { id: 'avatar1', name: 'Character 1', url: 'https://placehold.co/100x100.png?text=Ava1', hint: 'character playful' },
  { id: 'avatar2', name: 'Character 2', url: 'https://placehold.co/100x100.png?text=Ava2', hint: 'character serious' },
  { id: 'avatar3', name: 'Character 3', url: 'https://placehold.co/100x100.png?text=Ava3', hint: 'character calm' },
  { id: 'avatar4', name: 'Character 4', url: 'https://placehold.co/100x100.png?text=Ava4', hint: 'character joyful' },
  { id: 'no_avatar', name: 'No Avatar', url: '', hint: 'abstract user'}
];


export default function SettingsPage() {
  const { user, signOut, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Mocked
  const [defaultTherapistMode, setDefaultTherapistMode] = useState<TherapistMode>(user?.defaultTherapistMode || 'Therapist');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [darkModeVisual, setDarkModeVisual] = useState(false);
  useEffect(() => {
    setDarkModeVisual(theme === 'dark');
  }, [theme]);


  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setDefaultTherapistMode(user.defaultTherapistMode || 'Therapist');
      setSelectedAvatarUrl(user.photoURL || '');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const profileUpdates: Partial<UserProfile> = {};
      if (displayName !== user.displayName) {
        profileUpdates.displayName = displayName;
      }
      if (defaultTherapistMode !== user.defaultTherapistMode) {
        profileUpdates.defaultTherapistMode = defaultTherapistMode;
      }
      if (selectedAvatarUrl !== (user.photoURL || '')) {
        profileUpdates.photoURL = selectedAvatarUrl === '' ? null : selectedAvatarUrl; // Store null if "No Avatar"
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(profileUpdates);
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
    setDarkModeVisual(checked);
  };


  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and app settings.
        </p>
      </div>

      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-6 w-6 text-primary" /> Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserSquare2 className="h-6 w-6 text-primary" /> Choose Your Avatar</CardTitle>
            <CardDescription>Select an avatar to represent you in the app.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-2 rounded-lg bg-muted/30">
            {avatarOptions.map(avatar => (
                <button
                key={avatar.id}
                onClick={() => setSelectedAvatarUrl(avatar.url)}
                className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                    selectedAvatarUrl === avatar.url ? "ring-2 ring-primary bg-primary/10" : "hover:bg-primary/5"
                )}
                aria-label={`Select avatar ${avatar.name}`}
                >
                {avatar.url ? (
                     <Image 
                        src={avatar.url} 
                        alt={avatar.name} 
                        width={64} 
                        height={64} 
                        className="rounded-full object-cover w-16 h-16"
                        data-ai-hint={avatar.hint}
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-secondary-foreground" />
                    </div>
                )}
                <span className="text-xs mt-1 text-center text-foreground/80 truncate w-full">{avatar.name}</span>
                </button>
            ))}
            </div>
        </CardContent>
      </Card>


      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /> App Preferences</CardTitle>
          <CardDescription>Customize your ThoughtReflex experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="defaultTherapistMode" className="font-medium">Default Therapist Mode</Label>
                <p className="text-xs text-muted-foreground">Choose your preferred AI interaction style.</p>
            </div>
            <Select value={defaultTherapistMode} onValueChange={(value: TherapistMode) => setDefaultTherapistMode(value)}>
              <SelectTrigger className="w-[180px]">
                 <div className="flex items-center">
                    {modeIcons[defaultTherapistMode]}
                    <SelectValue placeholder="Select Mode" />
                 </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Therapist"><div className="flex items-center"><Brain className="mr-2 h-4 w-4" /> Therapist</div></SelectItem>
                <SelectItem value="Coach"><div className="flex items-center"><Zap className="mr-2 h-4 w-4" /> Coach</div></SelectItem>
                <SelectItem value="Friend"><div className="flex items-center"><Smile className="mr-2 h-4 w-4" /> Friend</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />

          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive reminders and updates. (Mocked)</p>
            </div>
            <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
             <div>
                <Label htmlFor="darkMode" className="font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Toggle dark theme.</p>
            </div>
            <Switch id="darkMode" checked={darkModeVisual} onCheckedChange={handleThemeChange} /> 
          </div>
        </CardContent>
      </Card>
       <div className="flex justify-end">
         <Button onClick={handleSaveChanges} disabled={isSaving || authLoading}>
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
       </div>


      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> Account & Security</CardTitle>
          <CardDescription>Manage your account security and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-3">
            <Button variant="outline" asChild>
                <Link href="/settings/change-password">Change Password</Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/settings/export-data">Export My Data</Link>
            </Button>
             <Button variant="destructive" onClick={signOut} className="w-full md:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>
             <Button variant="destructive" outline onClick={() => toast({title: "Action Not Implemented", description:"Account deletion is not yet available.", variant: "destructive"})}>
                Delete Account
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
