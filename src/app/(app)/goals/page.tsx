'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Target, Edit2, Trash2 } from 'lucide-react';
import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from 'next/image';

interface Goal {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: Date;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', text: 'Overcome fear of rejection in social situations', isCompleted: false, createdAt: new Date(Date.now() - 86400000 * 5) },
    { id: '2', text: 'Practice mindfulness for 10 minutes daily', isCompleted: true, createdAt: new Date(Date.now() - 86400000 * 10) },
    { id: '3', text: 'Express my needs more openly in relationships', isCompleted: false, createdAt: new Date(Date.now() - 86400000 * 2) },
  ]);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: newGoalText,
      isCompleted: false,
      createdAt: new Date(),
    };
    setGoals(prev => [newGoal, ...prev]);
    setNewGoalText('');
    setIsDialogOpen(false);
  };
  
  const handleEditGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.text.trim()) return;
    setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, text: editingGoal.text } : g));
    setEditingGoal(null);
    setIsDialogOpen(false);
  };

  const toggleComplete = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g));
  };
  
  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal({...goal});
    setIsDialogOpen(true);
  }
  
  const openAddDialog = () => {
    setEditingGoal(null); // Clear editing state
    setNewGoalText(''); // Clear new goal text
    setIsDialogOpen(true);
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
                    onCheckedChange={() => toggleComplete(goal.id)}
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
                    Added: {goal.createdAt.toLocaleDateString()}
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
              src="https://placehold.co/400x350.png"
              alt="Person looking at a mountain peak"
              width={400}
              height={350}
              className="object-cover w-full h-full"
              data-ai-hint="mountain peak success"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
