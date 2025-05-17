
'use client';

import { useState, useEffect, FormEvent, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2, Loader2, Eraser, FileX } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const formatTimestamp = (date: Date | undefined | null, savingState?: string): string => {
  if (savingState) return savingState;
  if (!date) return "Not yet saved";
  return `Last saved: ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};


export default function NotebookEntryPage() {
  const rawParams = useParams();
  const params = { ...rawParams }; 
  const router = useRouter();
  const { toast } = useToast();
  const entryIdParams = params.entryId as string;

  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialTitle, setInitialTitle] = useState(''); // For autosave
  const [initialContent, setInitialContent] = useState(''); // For autosave
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // For manual save
  const [isAutosaving, setIsAutosaving] = useState(false); // For autosave indicator
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(entryIdParams === 'new' ? null : entryIdParams);
  const [lastSavedDisplay, setLastSavedDisplay] = useState<string>("Not yet saved");
  const [isClearConfirmationOpen, setIsClearConfirmationOpen] = useState(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (currentEntryId === null) { 
      setTitle('');
      setContent('');
      setInitialTitle('');
      setInitialContent('');
      setLastSavedDisplay("Start typing to autosave...");
      setIsLoading(false);
    } else {
      setIsLoading(true);
      const entryDocRef = doc(db, 'users', user.uid, 'notebookEntries', currentEntryId);
      getDoc(entryDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedTitle = data.title || '';
          const fetchedContent = data.content || '';
          setTitle(fetchedTitle);
          setContent(fetchedContent);
          setInitialTitle(fetchedTitle);
          setInitialContent(fetchedContent);
          setLastSavedDisplay(formatTimestamp(data.lastUpdatedAt?.toDate()));
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
  }, [currentEntryId, user, authLoading, router, toast]);

  const performSave = useCallback(async (isManualSave = false) => {
    if (!user) return;
    if (!title.trim() && !content.trim()) {
      if (isManualSave) { // Only toast for manual save of empty entry
         toast({ title: "Cannot Save Empty Entry", description: "Please add a title or some content.", variant: "destructive" });
      }
      return;
    }

    if (!isManualSave) setIsAutosaving(true); else setIsSaving(true);
    
    setLastSavedDisplay("Saving...");

    const entryData = {
      title: title.trim() || (currentEntryId ? 'Untitled Entry' : ''), // Keep untitled if existing & title cleared
      content: content,
      userId: user.uid,
      lastUpdatedAt: serverTimestamp(),
    };

    try {
      let entryIdToUpdate = currentEntryId;
      if (entryIdToUpdate === null) { 
        const newEntryRef = await addDoc(collection(db, 'users', user.uid, 'notebookEntries'), {
          ...entryData,
          createdAt: serverTimestamp(),
        });
        setCurrentEntryId(newEntryRef.id); 
        entryIdToUpdate = newEntryRef.id;
        if (entryIdParams === 'new') { // Only replace URL if we were on the 'new' page
            router.replace(`/notebook/${newEntryRef.id}`, { scroll: false });
        }
        if (isManualSave) toast({ title: "Entry Saved", description: "Your new notebook entry has been saved." });
      } else {
        const entryDocRef = doc(db, 'users', user.uid, 'notebookEntries', entryIdToUpdate);
        await updateDoc(entryDocRef, entryData);
        if (isManualSave) toast({ title: "Entry Updated", description: "Your notebook entry has been updated." });
      }
      setInitialTitle(entryData.title); // Update initial state after successful save
      setInitialContent(entryData.content);
      setLastSavedDisplay(`Last saved: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({ title: "Save Failed", description: "Could not save notebook entry.", variant: "destructive" });
      setLastSavedDisplay("Save failed");
    } finally {
      if (!isManualSave) setIsAutosaving(false); else setIsSaving(false);
    }
  }, [user, title, content, currentEntryId, router, toast, entryIdParams]);


  const handleManualSave = (e?: FormEvent) => {
    e?.preventDefault();
    performSave(true);
  }

  useEffect(() => {
    if (isLoading || authLoading || !user) return; // Don't autosave while loading or if not logged in

    // Only trigger autosave if content has actually changed from initial or if it's a new entry with content
    const hasChanged = title !== initialTitle || content !== initialContent;
    const isNewAndNotEmpty = currentEntryId === null && (title.trim() !== '' || content.trim() !== '');

    if (hasChanged || isNewAndNotEmpty) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (title.trim() === '' && content.trim() === '' && currentEntryId === null) {
         // Don't autosave if it's a new entry and still completely blank
      } else {
        setLastSavedDisplay("Unsaved changes...");
        debounceTimeoutRef.current = setTimeout(() => {
          performSave(false);
        }, 2500); // 2.5-second delay for autosave
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [title, content, isLoading, initialTitle, initialContent, currentEntryId, performSave, authLoading, user]);


  const handleDeleteEntry = async () => {
    if (!user || !currentEntryId) return; 
    setIsDeleting(true);
    try {
      const entryDocRef = doc(db, 'users', user.uid, 'notebookEntries', currentEntryId);
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

  const handleClearEntry = () => {
    setTitle('');
    setContent('');
    setIsClearConfirmationOpen(false);
    toast({ title: "Entry Cleared", description: "Content has been cleared. Changes will be autosaved."});
  };

  const wordCount = useMemo(() => content.trim() === '' ? 0 : content.trim().split(/\s+/).length, [content]);
  const charCount = useMemo(() => content.length, [content]);

  if (authLoading || (isLoading && entryIdParams !== 'new')) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.32))] md:h-[calc(100vh-theme(spacing.24))]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleManualSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 rounded-full">
                <Link href="/notebook">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                    <span className="sr-only">Back to Notebook</span>
                </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {currentEntryId === null ? 'New Notebook Entry' : 'Edit Notebook Entry'}
            </h1>
        </div>
        <div className="flex gap-2 self-end sm:self-center">
            {currentEntryId !== null && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 border-destructive/50 hover:border-destructive shadow-sm">
                      <Trash2 className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this entry. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteEntry} className={cn(buttonVariants({variant: "destructive"}))} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
             <AlertDialog open={isClearConfirmationOpen} onOpenChange={setIsClearConfirmationOpen}>
                <AlertDialogTrigger asChild>
                     <Button type="button" variant="outline" className="shadow-sm">
                        <Eraser className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Clear</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Clear Entry?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to clear the title and content of this entry? Changes will be autosaved.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearEntry}>Yes, Clear</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={isSaving || isAutosaving} className="shadow-md">
                {(isSaving || isAutosaving) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {(isSaving || isAutosaving) ? 'Saving...' : 'Save Entry'}
            </Button>
        </div>
      </div>

      <Card className="shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="entryTitle" className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <Input
              id="entryTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your entry title..."
              className="text-lg bg-muted/30"
            />
          </div>
          <div>
            <label htmlFor="entryContent" className="block text-sm font-medium text-foreground mb-1.5">Content</label>
            <Textarea
              id="entryContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your thoughts here..."
              className="min-h-[calc(100vh-28rem)] md:min-h-[calc(100vh-25rem)] text-lg leading-relaxed font-caveat bg-muted/30"
              rows={15}
            />
          </div>
        </CardContent>
        <CardFooter className="p-3 sm:p-4 bg-muted/30 border-t flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {isAutosaving && <Loader2 className="inline-block mr-1 h-3 w-3 animate-spin" />}
              {lastSavedDisplay}
            </span>
            <div className="space-x-3">
                <span>Words: {wordCount}</span>
                <span>Characters: {charCount}</span>
            </div>
        </CardFooter>
      </Card>
    </form>
  );
}
