
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Download, FileJson, Package } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ExportDataPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to export data.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    toast({ title: "Exporting Data...", description: "Please wait while we gather your information." });

    try {
      const userData: any = {
        profile: { ...user }, // User profile from auth context
        goals: [],
        journalSessions: [],
      };

      // Fetch Goals
      const goalsQuery = query(collection(db, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
      const goalsSnapshot = await getDocs(goalsQuery);
      goalsSnapshot.forEach(doc => {
        const goalData = doc.data();
        // Convert Firebase Timestamps to ISO strings for JSON compatibility
        if (goalData.createdAt?.toDate) {
          goalData.createdAt = goalData.createdAt.toDate().toISOString();
        }
        userData.goals.push({ id: doc.id, ...goalData });
      });

      // Fetch Journal Sessions and their Messages
      const sessionsQuery = query(collection(db, 'users', user.uid, 'journalSessions'), orderBy('createdAt', 'desc'));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionData = sessionDoc.data();
        if (sessionData.createdAt?.toDate) {
          sessionData.createdAt = sessionData.createdAt.toDate().toISOString();
        }
        if (sessionData.lastUpdatedAt?.toDate) {
          sessionData.lastUpdatedAt = sessionData.lastUpdatedAt.toDate().toISOString();
        }
        
        const messages: any[] = [];
        const messagesQuery = query(collection(db, 'users', user.uid, 'journalSessions', sessionDoc.id, 'messages'), orderBy('timestamp', 'asc'));
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(messageDoc => {
          const messageData = messageDoc.data();
          if (messageData.timestamp?.toDate) {
            messageData.timestamp = messageData.timestamp.toDate().toISOString();
          }
          messages.push({ id: messageDoc.id, ...messageData });
        });
        userData.journalSessions.push({ id: sessionDoc.id, ...sessionData, messages });
      }

      // Create a JSON file and trigger download
      const jsonString = JSON.stringify(userData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thoughtreflex_export_${user.uid}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Your data has been downloaded." });

    } catch (error: any) {
      console.error("Export error:", error);
      toast({ title: "Export Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-lg">
      <Card className="shadow-2xl rounded-2xl">
        <CardHeader className="text-center">
          <Package className="h-10 w-10 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl font-bold text-foreground">Export Your Data</CardTitle>
          <CardDescription className="text-md text-foreground/80">
            Download a copy of your personal data stored on ThoughtReflex.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-foreground/90 space-y-2">
            <p className="flex items-start"><FileJson className="h-5 w-5 mr-2 mt-0.5 shrink-0 text-primary"/>Your data will be exported in JSON format, including your profile information, goals, and all journal entries with messages.</p>
            <p>This process may take a few moments depending on the amount of data.</p>
          </div>
          
          <Button 
            onClick={handleExportData} 
            className="w-full shadow-md" 
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your privacy is important to us. Handle your exported data responsibly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

