'use client';

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, writeBatch, deleteDoc as deleteFirestoreDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  defaultTherapistMode?: 'Therapist' | 'Coach' | 'Friend';
  currentStreak?: number;
  longestStreak?: number;
  lastJournalDate?: string; // Store as YYYY-MM-DD string
  mbtiType?: string | null; 
  latestMood?: {
    mood: 'positive' | 'neutral' | 'negative';
    date: string; // YYYY-MM-DD
  } | null;
  detectedIssues?: { // For Emotional Pattern Detection
    [key: string]: {
      occurrences: number;
      lastDetected: Timestamp;
    };
  } | null;
  lastDailyTopicCompletionDate?: string; // YYYY-MM-DD
  dailyTopicResponses?: { // To store detailed responses for each day
    [date: string]: { // YYYY-MM-DD
      topic: string;
      scores: number[];
      miraResponse: string;
      journalPrompt: string;
      userEntry?: string; // User's journal entry for the topic
      completedAt: Timestamp;
    }
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (details: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  deleteUserData: (currentPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const profileData = userDocSnap.data();
      setUser({
        ...profileData,
        uid: firebaseUser.uid, // Always ensure uid is from auth
        email: firebaseUser.email || profileData.email || null,
        displayName: firebaseUser.displayName || profileData.displayName || null,
        photoURL: firebaseUser.photoURL || profileData.photoURL || null,
        mbtiType: profileData.mbtiType || null,
        latestMood: profileData.latestMood || null,
        detectedIssues: profileData.detectedIssues || null,
        lastDailyTopicCompletionDate: profileData.lastDailyTopicCompletionDate || null,
        dailyTopicResponses: profileData.dailyTopicResponses || null,
      } as UserProfile);
    } else {
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: null,
        latestMood: null,
        detectedIssues: null,
        lastDailyTopicCompletionDate: null,
        dailyTopicResponses: null,
      };
      await setDoc(userDocRef, newUserProfile, { merge: true });
      setUser(newUserProfile);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await fetchAndSetUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      setLoading(true);
      await fetchAndSetUser(auth.currentUser);
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (firebaseUser: FirebaseUser, displayNameParam?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    let userProfileData: UserProfile;
    const initialDisplayName = displayNameParam || firebaseUser.displayName || null;
    const initialPhotoURL = firebaseUser.photoURL || null;

    if (userDocSnap.exists()) {
      const existingProfile = userDocSnap.data() as UserProfile;
      userProfileData = {
        ...existingProfile,
        uid: firebaseUser.uid, 
        email: firebaseUser.email || null,
        displayName: initialDisplayName || existingProfile.displayName || null,
        photoURL: initialPhotoURL || existingProfile.photoURL || null,
        defaultTherapistMode: existingProfile.defaultTherapistMode || 'Therapist',
        currentStreak: existingProfile.currentStreak || 0,
        longestStreak: existingProfile.longestStreak || 0,
        lastJournalDate: existingProfile.lastJournalDate || '',
        mbtiType: existingProfile.mbtiType || null,
        latestMood: existingProfile.latestMood || null,
        detectedIssues: existingProfile.detectedIssues || null,
        lastDailyTopicCompletionDate: existingProfile.lastDailyTopicCompletionDate || null,
        dailyTopicResponses: existingProfile.dailyTopicResponses || null,
      };
    } else {
      userProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: initialDisplayName,
        photoURL: initialPhotoURL,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: null,
        latestMood: null,
        detectedIssues: null,
        lastDailyTopicCompletionDate: null,
        dailyTopicResponses: null,
      };
    }
    
    const authProfileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
    if (userProfileData.displayName && (!auth.currentUser?.displayName || auth.currentUser.displayName !== userProfileData.displayName)) {
      authProfileUpdates.displayName = userProfileData.displayName;
    }
    if (userProfileData.photoURL !== undefined && (!auth.currentUser?.photoURL || auth.currentUser.photoURL !== userProfileData.photoURL)) {
       authProfileUpdates.photoURL = userProfileData.photoURL;
    }
    if (auth.currentUser && Object.keys(authProfileUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authProfileUpdates);
    }
    
    await setDoc(userDocRef, userProfileData, { merge: true });
    setUser(userProfileData);
    setError(null);
    router.push('/dashboard');
  };

  const handleAuthError = (err: AuthError) => {
    console.error("Auth Error:", err.code, err.message);
    setError(err);
    setUser(null); 
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (err) {
      handleAuthError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await handleAuthSuccess(result.user, displayName);
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; 
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await handleAuthSuccess(result.user);
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      router.push('/login'); 
    } catch (err) {
      handleAuthError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (details: Partial<UserProfile>) => {
    if (!user || !auth.currentUser) {
      const noUserError = { code: 'auth/no-current-user', message: 'No user is currently signed in.' } as AuthError
      setError(noUserError);
      throw noUserError;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const authProfileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      if (details.displayName !== undefined && details.displayName !== auth.currentUser.displayName) {
        authProfileUpdates.displayName = details.displayName;
      }
      if (details.photoURL !== undefined && details.photoURL !== auth.currentUser.photoURL) { 
         authProfileUpdates.photoURL = details.photoURL === '' ? null : details.photoURL;
      }
      if (Object.keys(authProfileUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authProfileUpdates);
      }
      
      const firestoreSafeDetails: Partial<UserProfile> = {};
      for (const key in details) {
        if (Object.prototype.hasOwnProperty.call(details, key)) {
          const k = key as keyof UserProfile;
          // Firestore cannot store 'undefined', so convert to 'null'
          firestoreSafeDetails[k] = details[k] === undefined ? null : details[k];
        }
      }
      // Ensure nested objects like detectedIssues are merged correctly
      if (details.detectedIssues) {
        firestoreSafeDetails.detectedIssues = {
          ...(user.detectedIssues || {}), // Spread existing issues
          ...details.detectedIssues, // Spread new/updated issues
        };
        // Now handle incrementing occurrences within the merged object
        for (const issueKey in details.detectedIssues) {
          if (user.detectedIssues && user.detectedIssues[issueKey] && details.detectedIssues[issueKey].occurrences === 1) {
            // If issue exists and we are adding an occurrence (passed as 1 for simplicity from client)
             firestoreSafeDetails.detectedIssues[issueKey].occurrences = (user.detectedIssues[issueKey].occurrences || 0) + 1;
          } else if (!user.detectedIssues || !user.detectedIssues[issueKey]) {
            // New issue
            firestoreSafeDetails.detectedIssues[issueKey].occurrences = 1;
          }
          // lastDetected is handled directly by the incoming details
        }
      }


      await updateDoc(userDocRef, firestoreSafeDetails);
      
      // Fetch the updated document to ensure the local state is perfectly in sync
      const updatedDocSnap = await getDoc(userDocRef);
      if (updatedDocSnap.exists()) {
        setUser(updatedDocSnap.data() as UserProfile);
      } else {
         // Fallback or error, though unlikely if updateDoc succeeded
        setUser(prevUser => prevUser ? { ...prevUser, ...firestoreSafeDetails } : null);
      }
      setError(null);
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  const deleteUserData = async (currentPassword?: string) => {
    if (!user || !auth.currentUser) {
      const noUserError = { code: 'auth/no-current-user', message: 'No user is currently signed in.' } as AuthError;
      setError(noUserError);
      throw noUserError;
    }
    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID)) {
        if (!currentPassword) {
          throw { code: 'auth/missing-password', message: 'Current password is required for re-authentication.' };
        }
        const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (currentUser.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID)) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        throw { code: 'auth/reauthentication-not-supported', message: 'Re-authentication method not supported for this user.' };
      }

      const batch = writeBatch(db);
      const collectionsToDelete = ['goals', 'journalSessions', 'notebookEntries', 'weeklyRecaps', 'mindShifts', 'dailyMoods'];

      for (const collName of collectionsToDelete) {
        const collRef = collection(db, 'users', user.uid, collName);
        const snapshot = await getDocs(collRef);
        for (const docSnap of snapshot.docs) {
          if (collName === 'journalSessions') {
            const messagesCollRef = collection(db, 'users', user.uid, 'journalSessions', docSnap.id, 'messages');
            const messagesSnapshot = await getDocs(messagesCollRef);
            messagesSnapshot.forEach(msgDoc => batch.delete(msgDoc.ref));
          }
          batch.delete(docSnap.ref);
        }
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      batch.delete(userDocRef); 
      await batch.commit(); 

      const freshUserProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || null,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: null,
        latestMood: null,
        detectedIssues: null,
        lastDailyTopicCompletionDate: null,
        dailyTopicResponses: null,
      };
      await setDoc(userDocRef, freshUserProfile); 
      setUser(freshUserProfile);
      
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        error, 
        signInWithGoogle, 
        signUpWithEmail, 
        signInWithEmail, 
        signOut, 
        updateUserProfile, 
        refreshUserProfile,
        deleteUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};