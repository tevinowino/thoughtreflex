'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { UserCircle, Bell, Palette, ShieldCheck, LogOut, Brain, Zap, Smile } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

type TherapistMode = 'Therapist' | 'Coach' | 'Friend';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  // Mock state for settings - in a real app, this would come from user profile in Firestore
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultTherapistMode, setDefaultTherapistMode] = useState<TherapistMode>(user?.therapistMode || 'Therapist');
  const [darkMode, setDarkMode] = useState(false); // Example, actual dark mode handled by ThemeProvider

  const handleSaveChanges = () => {
    // Placeholder for saving changes to user profile
    console.log('Saving changes:', { displayName, notificationsEnabled, defaultTherapistMode, darkMode });
    // Update user profile in Firestore
  };

  const modeIcons = {
    Therapist: <Brain className="mr-2 h-4 w-4" />,
    Coach: <Zap className="mr-2 h-4 w-4" />,
    Friend: <Smile className="mr-2 h-4 w-4" />,
  };

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
          <Button onClick={handleSaveChanges}>Save Profile Changes</Button>
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
                <p className="text-xs text-muted-foreground">Receive reminders and updates.</p>
            </div>
            <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
             <div>
                <Label htmlFor="darkMode" className="font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Toggle dark theme. (Theme handled globally)</p>
            </div>
            <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} disabled/> 
            {/* Actual dark mode is handled by ThemeProvider, this is illustrative */}
          </div>
           <Button onClick={handleSaveChanges} className="mt-4">Save Preferences</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> Account & Security</CardTitle>
          <CardDescription>Manage your account security and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
             <Button variant="destructive" outline className="w-full md:w-auto">
                Delete Account
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
