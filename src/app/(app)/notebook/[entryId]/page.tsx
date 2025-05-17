
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NotebookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const entryId = params.entryId as string;

  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewEntry, setIsNewEntry] = useState(entryId === 'new');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (entryId === 'new') {
      setIsNewEntry(true);
      setTitle('');
      setContent('');
      setIsLoading(false);
    } else {
      setIsNewEntry(false);
      setIsLoading(true);
      const entryDocRef = doc(db, 'users', user.uid, 'notebookEntries', entryId);
      getDoc(entryDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setContent(data.content || '');
        } else {
          toast({ title: "Error", description: "Notebook entry not found.", variant: "destructive" });
          router.push('/notebook');
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Error fetching entry:", error);
        toast({ title: "Error", description: "Could not load notebook entry.", variant: "destructive" });
        setIsLoading(false);
        router.push('/notebook');
      });
    }
  }, [entryId, user, authLoading, router, toast]);

  const handleSaveEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() && !content.trim()) {
        toast({ title: "Cannot Save Empty Entry", description: "Please add a title or some content.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const entryData = {
      title: title.trim() || 'Untitled Entry',
      content: content,
      userId: user.uid,
      lastUpdatedAt: serverTimestamp(),
    };

    try {
      if (isNewEntry) {
        const newEntryRef = await addDoc(collection(db, 'users', user.uid, 'notebookEntries'), {
          ...entryData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Entry Saved", description: "Your new notebook entry has been saved." });
        router.replace(`/notebook/${newEntryRef.id}`); // Update URL to new entry ID
        setIsNewEntry(false); // No longer a new entry
      } else {
        const entryDocRef = doc(db, 'users', user.uid, 'notebookEntries', entryId);
        await updateDoc(entryDocRef, entryData);
        toast({ title: "Entry Updated", description: "Your notebook entry has been updated." });
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({ title: "Error", description: "Could not save notebook entry.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!user || isNewEntry) return;
    setIsDeleting(true);
    try {
      const entryDocRef = doc(db, 'users', user.uid, 'notebookEntries', entryId);
      await deleteDoc(entryDocRef);
      toast({ title: "Entry Deleted", description: "Your notebook entry has been removed." });
      router.push('/notebook');
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ title: "Error", description: "Could not delete entry.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.32))] md:h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveEntry} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/notebook">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to Notebook</span>
                </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
            {isNewEntry ? 'New Notebook Entry' : 'Edit Notebook Entry'}
            </h1>
        </div>
        <div className="flex gap-2">
            {!isNewEntry && (
                <Button type="button" variant="destructive" outline onClick={handleDeleteEntry} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
                </Button>
            )}
            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Entry'}
            </Button>
        </div>
      </div>
      
      <Card className="shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div>
            <label htmlFor="entryTitle" className="block text-sm font-medium text-foreground mb-1">Title</label>
            <Input
              id="entryTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your entry title..."
              className="text-lg"
            />
          </div>
          <div>
            <label htmlFor="entryContent" className="block text-sm font-medium text-foreground mb-1">Content</label>
            <Textarea
              id="entryContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your thoughts here..."
              className="min-h-[calc(100vh-25rem)] md:min-h-[calc(100vh-22rem)] text-base"
              rows={15}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
