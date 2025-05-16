
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, FormEvent } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (!user || !auth.currentUser) {
      setError('User not found. Please re-login.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-authenticate user
      if (auth.currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID)) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else {
         setError('Password change is only available for email/password accounts.');
         setIsSubmitting(false);
         return;
      }
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error("Password change error:", err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect current password.');
      } else if (err.code === 'auth/requires-recent-login') {
         setError('This operation is sensitive and requires recent authentication. Please log out and log back in before retrying.');
      }
      else {
        setError(err.message || 'Failed to update password.');
      }
      toast({
        title: "Error",
        description: err.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-lg">
      <Card className="shadow-2xl rounded-2xl">
        <CardHeader className="text-center">
          <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl font-bold text-foreground">Change Password</CardTitle>
          <CardDescription className="text-md text-foreground/80">
            Update your account password for enhanced security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input 
                id="confirmNewPassword" 
                type="password" 
                value={confirmNewPassword} 
                onChange={(e) => setConfirmNewPassword(e.target.value)} 
                required 
                className="bg-muted/30"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full shadow-md" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
              <KeyRound className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
