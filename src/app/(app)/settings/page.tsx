
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { UserCircle, Bell, Palette, ShieldCheck, LogOut, Brain, Zap, Smile, Image as ImageIcon, UserSquare2, Trash2, Loader2, TestTube2, DownloadCloud, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes'; 
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader as ReauthDialogHeader, 
  DialogTitle as ReauthDialogTitle,
  DialogDescription as ReauthDialogDescription,
  DialogFooter as ReauthDialogFooter,
} from "@/components/ui/dialog";
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import InstallPWAButton from '@/components/app/install-pwa-button';


type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

const avatarOptions = [
  { id: 'avatar1', name: 'Azure', url: '/avatars/blue.png', hint: "abstract blue" },
  { id: 'avatar2', name: 'Explorer', url: '/avatars/explorer.png', hint: "adventurer person" },
  { id: 'avatar3', name: 'Lily', url: '/avatars/lily.png', hint: "woman nature" },
  { id: 'avatar4', name: 'Rex', url: '/avatars/rex.png', hint: "dinosaur green" },
  { id: 'avatar5', name: 'Violet', url: '/avatars/violet.png', hint: "purple nebula" },
  { id: 'no_avatar', name: 'No Avatar', url: '', hint: "user icon" }
];


export default function SettingsPage() {
  const { user, signOut: contextSignOut, updateUserProfile, loading: authLoading, deleteUserData: contextDeleteUserData, error: authError, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); 
  const [defaultTherapistMode, setDefaultTherapistMode] = useState<TherapistMode>(user?.defaultTherapistMode || 'Therapist');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(user?.photoURL || '');
  const [currentMbtiType, setCurrentMbtiType] = useState(user?.mbtiType || 'Not Set');
  const [userStrugglesInput, setUserStrugglesInput] = useState(user?.userStruggles?.join(', ') || ''); // For textarea
  const [isSaving, setIsSaving] = useState(false);
  
  const [darkModeVisual, setDarkModeVisual] = useState(false);

  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [passwordForDelete, setPasswordForDelete] = useState('');
  

  useEffect(() => {
    setDarkModeVisual(theme === 'dark');
  }, [theme]);


  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setDefaultTherapistMode(user.defaultTherapistMode || 'Therapist');
      setSelectedAvatarUrl(user.photoURL || '');
      setCurrentMbtiType(user.mbtiType || 'Not Set');
      setUserStrugglesInput(user.userStruggles?.join(', ') || '');
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
      const newPhotoURL = selectedAvatarUrl === '' ? null : selectedAvatarUrl;
      if (newPhotoURL !== (user.photoURL || null)) { 
          profileUpdates.photoURL = newPhotoURL;
      }
      
      const strugglesArray = userStrugglesInput.split(',').map(s => s.trim()).filter(s => s !== '');
      if (JSON.stringify(strugglesArray) !== JSON.stringify(user.userStruggles || [])) {
          profileUpdates.userStruggles = strugglesArray;
      }


      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(profileUpdates);
        if (refreshUserProfile) await refreshUserProfile(); // Refresh context after update
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

 const handleDeleteDataConfirmed = async () => {
    if (!user || !auth.currentUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    
    const isEmailProvider = auth.currentUser.providerData.some(
      (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
    );

    if (isEmailProvider) {
      setIsPasswordPromptOpen(true); 
    } else { 
      try {
        const provider = new GoogleAuthProvider(); 
        await reauthenticateWithPopup(auth.currentUser, provider);
        await handleFinalDelete(); 
      } catch (reauthError: any) {
        console.error("Re-authentication error:", reauthError);
        toast({
          title: "Re-authentication Failed",
          description: reauthError.message || "Could not re-authenticate. Please try again.",
          variant: "destructive",
        });
        setIsDeleteConfirmationOpen(false);
      }
    }
  };

  const handleFinalDelete = async (e?: FormEvent) => {
    e?.preventDefault(); 
    if (!user || !auth.currentUser) {
       toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
       return;
    }

    setIsDeletingData(true);
    setIsPasswordPromptOpen(false); 

    try {
      // Re-authentication for email users if password was provided
      if (auth.currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID) && passwordForDelete) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, passwordForDelete);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } // For Google/OAuth, re-auth should have happened before calling this via handleDeleteDataConfirmed

      await contextDeleteUserData(); // Call the function from context to delete data
      toast({
        title: "Data Deleted Successfully",
        description: "All your personal data has been removed. Your profile has been reset.",
      });
      
      if(refreshUserProfile) await refreshUserProfile();
      // Reset local form state after successful data deletion
      setDisplayName(auth.currentUser?.displayName || 'Valued User'); // Use current auth name
      setDefaultTherapistMode('Therapist');
      setSelectedAvatarUrl(auth.currentUser?.photoURL || ''); // Use current auth photo
      setCurrentMbtiType('Not Set');
      setUserStrugglesInput('');


    } catch (error: any) {
      console.error("Data deletion error:", error);
       let description = error.message || "Could not delete your data.";
       if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Incorrect password. Data deletion cancelled.";
        setIsPasswordPromptOpen(true); 
      } else if (error.code === 'auth/requires-recent-login' || error.code === 'auth/user-token-expired') {
        description = "Your session has expired. Please log out and log back in to perform this action.";
      }
      toast({
        title: "Data Deletion Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsDeletingData(false);
      setPasswordForDelete('');
      setIsDeleteConfirmationOpen(false); 
    }
  };


  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto p-4 sm:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your account, preferences, and app settings.
        </p>
      </div>

      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Profile Information</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-1">
            <Label htmlFor="displayName" className="text-sm">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="text-sm sm:text-base bg-muted/30"/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input id="email" value={email} disabled readOnly  className="text-sm sm:text-base bg-muted/30"/>
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><UserSquare2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Choose Your Avatar</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Select an avatar to represent you in the app.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 p-2 rounded-lg bg-muted/30">
            {avatarOptions.map(avatar => (
                <button
                key={avatar.id}
                onClick={() => setSelectedAvatarUrl(avatar.url)}
                className={cn(
                    "flex flex-col items-center p-1.5 sm:p-2 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
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
                        className="rounded-full object-cover w-12 h-12 sm:w-16 sm:h-16"
                        data-ai-hint={avatar.hint}
                    />
                ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary flex items-center justify-center">
                        <UserCircle className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-foreground" />
                    </div>
                )}
                <span className="text-[10px] sm:text-xs mt-1 text-center text-foreground/80 truncate w-full">{avatar.name}</span>
                </button>
            ))}
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> App Preferences</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Customize your ThoughtReflex experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
                <Label htmlFor="defaultTherapistMode" className="font-medium text-sm">Default Therapist Mode</Label>
                <p className="text-xs text-muted-foreground">Choose your preferred AI interaction style.</p>
            </div>
            <Select value={defaultTherapistMode} onValueChange={(value: TherapistMode) => setDefaultTherapistMode(value)}>
              <SelectTrigger className="w-[150px] sm:w-[180px] text-sm bg-muted/30">
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
                <Label htmlFor="notifications" className="font-medium text-sm">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive reminders and updates. (Feature in development)</p>
            </div>
            <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
             <div>
                <Label htmlFor="darkMode" className="font-medium text-sm">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Toggle dark theme.</p>
            </div>
            <Switch id="darkMode" checked={darkModeVisual} onCheckedChange={handleThemeChange} /> 
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> My Focus Areas & Struggles</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Help Mira understand what you'd like to focus on. List areas separated by commas (e.g., anxiety, work stress, self-esteem).</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <Textarea
                id="userStruggles"
                placeholder="e.g., managing daily anxiety, improving relationship communication, building self-confidence..."
                value={userStrugglesInput}
                onChange={(e) => setUserStrugglesInput(e.target.value)}
                rows={3}
                className="text-sm sm:text-base bg-muted/30"
            />
            <p className="text-xs text-muted-foreground mt-2">This information helps personalize your Daily Guided Topics.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><TestTube2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Personality Type (MBTI)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Record your personality type to help Mira understand you better.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <p className="text-sm text-foreground/90">
            Your current MBTI type: <span className="font-semibold text-primary">{currentMbtiType}</span>
          </p>
          <Button variant="outline" asChild className="w-full sm:w-auto justify-center shadow-sm">
            <Link href="/personality-test">
              {user?.mbtiType ? 'Change My MBTI Type' : 'Record My MBTI Type'}
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Knowing your MBTI type is optional but can enhance Mira's understanding. You can take a test online if you don't know yours.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><DownloadCloud className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> App Installation</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Install ThoughtReflex on your device for a more app-like experience.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <InstallPWAButton />
        </CardContent>
      </Card>


       <div className="flex justify-end pt-2">
         <Button onClick={handleSaveChanges} disabled={isSaving || authLoading} className="text-sm sm:text-base shadow-md">
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
       </div>


      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Account & Security</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage your account security and data.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6">
            <Button variant="outline" asChild className="w-full justify-center shadow-sm">
                <Link href="/settings/change-password">Change Password</Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-center shadow-sm">
                <Link href="/settings/export-data">Export My Data</Link>
            </Button>
            <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className={cn("w-full justify-center shadow-sm")} onClick={() => setIsDeleteConfirmationOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Your Personal Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all your personal data within ThoughtReflex, including journals, goals, recaps, mind shifts, and mood logs.
                    Your login account will remain active, allowing you to start fresh. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsDeleteConfirmationOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteDataConfirmed}
                    disabled={isDeletingData}
                    className={cn(buttonVariants({variant:"destructive"}))}
                  >
                    {isDeletingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Yes, Delete My Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={() => { contextSignOut().catch(err => toast({ title: "Sign Out Error", description: err.message, variant: "destructive"})); }} className="w-full justify-center shadow-sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>

            <Dialog open={isPasswordPromptOpen} onOpenChange={setIsPasswordPromptOpen}>
                <DialogContent>
                    <form onSubmit={handleFinalDelete}>
                        <ReauthDialogHeader>
                            <ReauthDialogTitle>Re-authenticate to Delete Data</ReauthDialogTitle>
                            <ReauthDialogDescription>
                                For your security, please enter your current password to confirm data deletion.
                            </ReauthDialogDescription>
                        </ReauthDialogHeader>
                        <div className="py-4">
                            <Label htmlFor="passwordForDelete">Current Password</Label>
                            <Input
                                id="passwordForDelete"
                                type="password"
                                value={passwordForDelete}
                                onChange={(e) => setPasswordForDelete(e.target.value)}
                                required
                                className="bg-muted/30"
                            />
                             {authError && (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') && <p className="text-sm text-destructive mt-1">Incorrect password.</p>}
                        </div>
                        <ReauthDialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsPasswordPromptOpen(false); setPasswordForDelete('');}}>Cancel</Button>
                            <Button type="submit" variant="destructive" disabled={isDeletingData}>
                                {isDeletingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm & Delete Data
                            </Button>
                        </ReauthDialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </CardContent>
      </Card>
    </div>
  );
}
    