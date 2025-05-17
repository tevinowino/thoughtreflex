
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Loader2, Trash2, Lightbulb, Sparkles, CheckCircle, Brain, Zap, Smile } from 'lucide-react';
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
import type { ReframeThoughtOutput } from '@/ai/flows/reframe-thought-flow';

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
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const shiftsColRef = collection(db, 'users', user.uid, 'mindShifts');
    const q = query(shiftsColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedShifts = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
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
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'mindShifts', shiftToDelete));
      toast({ title: "Mind Shift Deleted", description: "The Mind Shift has been removed from your collection." });
      setShiftToDelete(null);
    } catch (error) {
      console.error("Error deleting mind shift:", error);
      toast({ title: "Error", description: "Could not delete the Mind Shift.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShiftToDelete(null); // Ensure dialog closes
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Your Saved Mind Shifts
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Review and reflect on the helpful thought reframes you've developed with Mira.
          </p>
        </div>
      </div>

      {mindShifts.length === 0 ? (
        <Card className="text-center py-12 sm:py-16 shadow-xl rounded-2xl border border-primary/10 bg-card/95">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-semibold">No Mind Shifts Saved Yet</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground/90">
              When Mira helps you reframe a thought in your journal, you can save it here!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {mindShifts.map(shift => (
            <Card key={shift.id} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out rounded-2xl flex flex-col bg-card border border-primary/10">
              <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-5 border-b border-primary/10">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-semibold text-primary">Mind Shift</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-muted-foreground/80">
                        Saved on: { (shift.createdAt instanceof Date ? shift.createdAt : new Date((shift.createdAt as Timestamp).seconds * 1000)).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) }
                        </CardDescription>
                    </div>
                    <AlertDialog open={shiftToDelete === shift.id} onOpenChange={(open) => !open && setShiftToDelete(null)}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setShiftToDelete(shift.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 h-8 w-8 sm:h-9 sm:w-9 rounded-md">
                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5"/>
                                <span className="sr-only">Delete Mind Shift</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this Mind Shift?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this saved Mind Shift from your collection.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setShiftToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteShift} className={cn(buttonVariants({variant: "destructive"}))} disabled={isDeleting}>
                                {isDeleting && shiftToDelete === shift.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6 flex-grow">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Original Thought:</p>
                  <p className="text-foreground/90 italic text-sm sm:text-base">"{shift.originalThought}"</p>
                </div>
                
                <div className="p-3 sm:p-4 bg-green-500/10 dark:bg-green-600/20 rounded-lg border border-green-500/30 dark:border-green-500/50">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Reframed Thought:</p>
                  <p className="text-foreground font-semibold text-sm sm:text-base">"{shift.reframedThought}"</p>
                </div>

                {shift.alternativePerspective && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Alternative Perspective:</p>
                    <p className="text-sm text-foreground/80 sm:text-base">{shift.alternativePerspective}</p>
                  </div>
                )}

                {shift.supportingEvidence && shift.supportingEvidence.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1.5">Supporting Points:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-foreground/80 pl-4">
                      {shift.supportingEvidence.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

