
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Target, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: Timestamp | Date; // Store as Timestamp, display as Date
  userId: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const goalsColRef = collection(db, 'users', user.uid, 'goals');
    const q = query(goalsColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGoals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure createdAt is a Date object for display, Firestore timestamp for storage
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(), 
      } as Goal));
      setGoals(fetchedGoals);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching goals:", error);
      toast({ title: "Error", description: "Could not fetch goals.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleAddGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim() || !user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        text: newGoalText,
        isCompleted: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      setNewGoalText('');
      setIsDialogOpen(false);
      toast({ title: "Goal Added", description: "Your new goal has been saved." });
    } catch (error) {
      console.error("Error adding goal:", error);
      toast({ title: "Error", description: "Could not add goal.", variant: "destructive" });
    }
  };
  
  const handleEditGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.text.trim() || !user) return;
    try {
      const goalRef = doc(db, 'users', user.uid, 'goals', editingGoal.id);
      await updateDoc(goalRef, { text: editingGoal.text });
      setEditingGoal(null);
      setIsDialogOpen(false);
      toast({ title: "Goal Updated", description: "Your goal has been updated." });
    } catch (error) {
      console.error("Error editing goal:", error);
      toast({ title: "Error", description: "Could not update goal.", variant: "destructive" });
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const goalRef = doc(db, 'users', user.uid, 'goals', id);
      await updateDoc(goalRef, { isCompleted: !currentStatus });
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      toast({ title: "Error", description: "Could not update goal status.", variant: "destructive" });
    }
  };
  
  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const goalRef = doc(db, 'users', user.uid, 'goals', id);
      await deleteDoc(goalRef);
      toast({ title: "Goal Deleted", description: "Your goal has been removed." });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({ title: "Error", description: "Could not delete goal.", variant: "destructive" });
    }
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal({...goal});
    setIsDialogOpen(true);
  }
  
  const openAddDialog = () => {
    setEditingGoal(null);
    setNewGoalText('');
    setIsDialogOpen(true);
  }

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
          <h1 className="text-3xl font-bold text-foreground">Your Healing Goals</h1>
          <p className="text-muted-foreground">
            Define, track, and achieve your personal growth milestones.
          </p>
        </div>
        <Button size="lg" onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Goal
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={editingGoal ? handleEditGoal : handleAddGoal}>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? "Make changes to your existing goal." : "Define a new goal you want to work towards."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                id="goalText"
                value={editingGoal ? editingGoal.text : newGoalText}
                onChange={(e) => editingGoal ? setEditingGoal({...editingGoal, text: e.target.value}) : setNewGoalText(e.target.value)}
                placeholder="e.g., Be more present in conversations"
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingGoal ? 'Save Changes' : 'Add Goal'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {goals.length === 0 ? (
         <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
             <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <Target className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">No Goals Set Yet</CardTitle>
            <CardDescription>Setting goals is the first step towards achieving them. What do you want to work on?</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openAddDialog}>
              Set Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <Card key={goal.id} className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox 
                    id={`goal-${goal.id}`} 
                    checked={goal.isCompleted} 
                    onCheckedChange={() => toggleComplete(goal.id, goal.isCompleted)}
                    className="h-5 w-5"
                  />
                  <label 
                    htmlFor={`goal-${goal.id}`}
                    className={`flex-1 text-sm ${goal.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  >
                    {goal.text}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                   <p className="text-xs text-muted-foreground hidden sm:block">
                    Added: {goal.createdAt instanceof Date ? goal.createdAt.toLocaleDateString() : new Date((goal.createdAt as Timestamp).seconds * 1000).toLocaleDateString()}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(goal)} className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit Goal</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)} className="text-destructive hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Goal</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-12 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0 md:p-0 flex flex-col md:flex-row">
          <div className="p-6 md:p-8 flex-1 space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">The Power of Goal Setting</h3>
            <p className="text-foreground/80">
              Setting clear, achievable goals is a cornerstone of personal development and therapeutic progress. 
              Well-defined goals can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li>Provide direction and focus for your efforts.</li>
              <li>Increase motivation and commitment.</li>
              <li>Allow you to measure progress and celebrate achievements.</li>
              <li>Break down overwhelming challenges into manageable steps.</li>
            </ul>
            <p className="text-foreground/80">
              ThoughtReflex will gently check in on your goals during your journaling sessions, 
              helping you stay on track.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0">
             <Image 
              src="/goal.png"
              alt="Person looking at a mountain peak, symbolizing goal achievement"
              width={400}
              height={350}
              className="object-cover w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

