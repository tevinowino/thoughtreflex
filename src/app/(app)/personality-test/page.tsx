
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, TestTube2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  'Not Sure'
];

export default function PersonalityTestPage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedMbtiType, setSelectedMbtiType] = useState<string>(user?.mbtiType || 'Not Sure');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.mbtiType) {
      setSelectedMbtiType(user.mbtiType);
    }
  }, [user]);

  const handleSaveMbtiType = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (selectedMbtiType === 'Not Sure' && !user.mbtiType) { // User hasn't changed from default and had no type
        toast({ title: "No Change", description: "Please select your personality type." });
        return;
    }

    setIsSaving(true);
    try {
      const newType = selectedMbtiType === 'Not Sure' ? undefined : selectedMbtiType;
      await updateUserProfile({ mbtiType: newType });
      toast({ title: "MBTI Type Saved", description: `Your personality type has been set to ${newType || 'Not Set'}.` });
    } catch (error: any) {
      console.error("Error saving MBTI type:", error);
      toast({ title: "Save Failed", description: error.message || "Could not save your MBTI type.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 rounded-full">
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5 text-primary" />
            <span className="sr-only">Back to Settings</span>
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Record Your MBTI Type</h1>
      </div>
      <Card className="shadow-xl rounded-2xl">
        <CardHeader className="text-center p-6">
          <TestTube2 className="h-10 w-10 text-primary mx-auto mb-3" />
          <CardTitle className="text-xl sm:text-2xl font-bold">Myers-Briggs Type Indicator</CardTitle>
          <CardDescription className="text-sm text-foreground/80">
            Select your MBTI personality type. This can help Mira tailor interactions to your communication style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <label htmlFor="mbtiSelect" className="block text-sm font-medium text-foreground">Your MBTI Type</label>
            <Select value={selectedMbtiType} onValueChange={setSelectedMbtiType}>
              <SelectTrigger id="mbtiSelect" className="w-full bg-muted/30">
                <SelectValue placeholder="Select your type" />
              </SelectTrigger>
              <SelectContent>
                {mbtiTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              If you're unsure of your type, you can find many free tests online or select "Not Sure".
            </p>
          </div>
          <Button onClick={handleSaveMbtiType} className="w-full shadow-md" disabled={isSaving || authLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save MBTI Type'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
