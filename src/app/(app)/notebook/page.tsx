
'use client';

import { Button, buttonVariants } from '@/components/ui/button'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; 
import { PlusCircle, NotebookPen as NotebookIcon, Loader2, Edit3, ShieldCheck, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
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

interface NotebookEntry {
  id: string;
  title: string;
  content: string; 
  createdAt: Timestamp | Date;
  lastUpdatedAt: Timestamp | Date;
  contentPreview?: string;
  userId: string;
}

export default function NotebookPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const entriesColRef = collection(db, 'users', user.uid, 'notebookEntries');
    const q = query(entriesColRef, orderBy('lastUpdatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Entry',
          content: data.content || '', 
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate ? data.lastUpdatedAt.toDate() : new Date(),
          contentPreview: data.content ? data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '') : 'No preview available.',
          userId: data.userId,
        } as NotebookEntry
      });
      setEntries(fetchedEntries);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notebook entries:", error);
      toast({ title: "Error", description: "Could not fetch notebook entries.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleDeleteEntry = async () => {
    if (!user || !entryToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notebookEntries', entryToDelete));
      toast({ title: "Entry Deleted", description: "Your notebook entry has been removed." });
      setEntryToDelete(null);
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ title: "Error", description: "Could not delete entry.", variant: "destructive" });
      setEntryToDelete(null);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

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
          <h1 className="text-3xl font-bold text-foreground">Your Notebook</h1>
          <p className="text-muted-foreground">
            A private space for your thoughts and reflections, without AI.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md">
          <Link href="/notebook/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Entry
          </Link>
        </Button>
      </div>

      <Card className="bg-muted/50 border-primary/30 shadow-sm">
        <CardContent className="p-3 text-sm text-primary-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-foreground/80">Your notebook entries are private and for your eyes only.</span>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notebook entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-lg shadow-sm bg-card"
        />
      </div>

      {filteredEntries.length === 0 ? (
         <Card className="text-center py-12 shadow-lg rounded-2xl">
          <CardHeader>
            <div className="mx-auto bg-secondary p-3 rounded-full w-fit">
                <NotebookIcon className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4">{searchQuery ? "No Matching Entries" : "Your Notebook is Empty"}</CardTitle>
            <CardDescription>
              {searchQuery ? "Try a different search term or " : "Start a new entry to begin your personal reflections."}
              {!searchQuery && <Button variant="link" className="p-0 h-auto text-primary" asChild><Link href="/notebook/new">create your first entry</Link></Button>}
            </CardDescription>
          </CardHeader>
          {searchQuery && (
            <CardContent>
                <Button onClick={() => setSearchQuery('')} variant="outline">Clear Search</Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl flex flex-col bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-primary hover:underline">
                    <Link href={`/notebook/${entry.id}`}>{entry.title}</Link>
                </CardTitle>
                <CardDescription>
                  Last updated: { (entry.lastUpdatedAt instanceof Date ? entry.lastUpdatedAt : new Date((entry.lastUpdatedAt as Timestamp).seconds * 1000)).toLocaleDateString() }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <p className="text-sm text-foreground/80 line-clamp-3">{entry.contentPreview}</p>
              </CardContent>
              <CardFooter className="pt-4 flex justify-between items-center border-t mt-auto">
                <Button variant="outline" asChild className="flex-1 mr-2 shadow-sm hover:shadow-md">
                  <Link href={`/notebook/${entry.id}`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Open
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setEntryToDelete(entry.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 h-9 w-9">
                        <Trash2 className="h-4 w-4"/>
                        <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your notebook entry.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteEntry} className={cn(buttonVariants({variant: "destructive"}))}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       <Card className="mt-12 shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0 md:p-0 flex flex-col md:flex-row">
          <div className="p-6 md:p-8 flex-1 space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">The Power of Unfiltered Journaling</h3>
            <p className="text-foreground/80">
              Sometimes, you just need a space to write freely, without guidance or feedback. Your notebook is for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li>Brain-dumping thoughts and ideas.</li>
              <li>Drafting, outlining, or free-writing.</li>
              <li>Private reflections you're not ready to discuss.</li>
              <li>Simply capturing moments and memories.</li>
            </ul>
            <p className="text-foreground/80">
              This is your personal sanctuary for pure, unadulterated self-expression.
            </p>
          </div>
          <div className="md:w-1/3 flex-shrink-0">
             <Image 
              src="/notebook.png"
              alt="Person writing in a physical notebook, symbolizing private reflection"
              width={400}
              height={300}
              className="object-cover w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

