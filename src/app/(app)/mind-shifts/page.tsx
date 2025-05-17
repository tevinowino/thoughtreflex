
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Loader2, Trash2, Lightbulb, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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
import { cn } from '@/lib/utils';
import type { ReframeThoughtOutput } from '@/ai/flows/reframe-thought-flow'; // Assuming this type is exported

interface SavedMindShift extends ReframeThoughtOutput {
  id: string;
  createdAt: Timestamp | Date;
  userId: string;
}

export default function MindShiftsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mindShifts, setMindShifts] = useState<SavedMindShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const shiftsColRef = collection(db, 'users', user.uid, 'mindShifts');
    const q = query(shiftsColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          originalThought: data.originalThought,
          reframedThought: data.reframedThought,
          alternativePerspective: data.alternativePerspective,
          supportingEvidence: data.supportingEvidence || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          userId: data.userId,
        } as SavedMindShift;
      });
      setMindShifts(fetchedShifts);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching mind shifts:", error);
      toast({ title: "Error", description: "Could not fetch your saved Mind Shifts.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleDeleteShift = async () => {
    if (!user || !shiftToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'mindShifts', shiftToDelete));
      toast({ title: "Mind Shift Deleted", description: "The Mind Shift has been removed from your collection." });
      setShiftToDelete(null);
    } catch (error) {
      console.error("Error deleting mind shift:", error);
      toast({ title: "Error", description: "Could not delete the Mind Shift.", variant: "destructive" });
      setShiftToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-primary" /> Your Saved Mind Shifts
          </h1>
          <p className="text-muted-foreground">
            Review and reflect on the helpful thought reframes you've developed with Mira.
          </p>
        </div>
      </div>

      {mindShifts.length === 0 ? (
        <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
            <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">No Mind Shifts Saved Yet</CardTitle>
            <CardDescription>When Mira helps you reframe a thought in your journal, you can save it here!</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {mindShifts.map(shift => (
            <Card key={shift.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl flex flex-col bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-primary">Mind Shift</CardTitle>
                <CardDescription className="text-xs">
                  Saved on: { (shift.createdAt instanceof Date ? shift.createdAt : new Date((shift.createdAt as Timestamp).seconds * 1000)).toLocaleDateString() }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Original Thought:</p>
                  <p className="text-foreground/90 italic">"{shift.originalThought}"</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Reframed Thought:</p>
                  <p className="text-foreground/90 font-semibold">"{shift.reframedThought}"</p>
                </div>
                {shift.alternativePerspective && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Alternative Perspective:</p>
                    <p className="text-sm text-foreground/80">{shift.alternativePerspective}</p>
                  </div>
                )}
                {shift.supportingEvidence && shift.supportingEvidence.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Supporting Points:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 pl-4">
                      {shift.supportingEvidence.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setShiftToDelete(shift.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 h-8 w-8">
                        <Trash2 className="h-4 w-4"/>
                        <span className="sr-only">Delete Mind Shift</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this Mind Shift.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShiftToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteShift} className={cn(buttonVariants({variant: "destructive"}))}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
