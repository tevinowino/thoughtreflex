
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
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
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
  mbtiType?: string; // e.g., "INFJ", "ESTP"
  latestMood?: {
    mood: 'positive' | 'neutral' | 'negative';
    date: string; // YYYY-MM-DD
    notes?: string;
  };
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
      setUser(userDocSnap.data() as UserProfile);
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
        mbtiType: undefined,
        latestMood: undefined,
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

    if (userDocSnap.exists()) {
      userProfileData = userDocSnap.data() as UserProfile;
      userProfileData = {
        ...userProfileData,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayNameParam || firebaseUser.displayName || userProfileData.displayName,
        photoURL: firebaseUser.photoURL || userProfileData.photoURL,
        currentStreak: userProfileData.currentStreak || 0,
        longestStreak: userProfileData.longestStreak || 0,
        lastJournalDate: userProfileData.lastJournalDate || '',
        defaultTherapistMode: userProfileData.defaultTherapistMode || 'Therapist',
        mbtiType: userProfileData.mbtiType || undefined,
        latestMood: userProfileData.latestMood || undefined,
      };
    } else {
      userProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayNameParam || firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: undefined,
        latestMood: undefined,
      };
    }
    
    if (displayNameParam && auth.currentUser && auth.currentUser.displayName !== displayNameParam) {
      await updateFirebaseProfile(auth.currentUser, { displayName: displayNameParam });
    }
     if (firebaseUser.photoURL && auth.currentUser && auth.currentUser.photoURL !== firebaseUser.photoURL) {
      await updateFirebaseProfile(auth.currentUser, { photoURL: firebaseUser.photoURL });
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
      setError({ code: 'auth/no-current-user', message: 'No user is currently signed in.' } as AuthError);
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      if (details.displayName && details.displayName !== auth.currentUser.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: details.displayName });
      }
      if (details.photoURL !== undefined && details.photoURL !== auth.currentUser.photoURL) { 
         await updateFirebaseProfile(auth.currentUser, { photoURL: details.photoURL });
      }

      await updateDoc(userDocRef, details);
      // Optimistically update local state, or re-fetch
      setUser(prevUser => prevUser ? { ...prevUser, ...details } : null);
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
      throw new Error('No user is currently signed in.');
    }
    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID)) {
        if (!currentPassword) {
          throw new Error('Current password is required for re-authentication.');
        }
        const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (currentUser.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID)) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        throw new Error('Re-authentication method not supported for this user.');
      }

      const batch = writeBatch(db);
      const collectionsToDelete = ['goals', 'journalSessions', 'notebookEntries', 'weeklyRecaps', 'mindShifts', 'dailyMoods'];

      for (const collName of collectionsToDelete) {
        const collRef = collection(db, 'users', user.uid, collName);
        const snapshot = await getDocs(collRef);
        snapshot.forEach(async (docSnap) => {
          if (collName === 'journalSessions') {
            const messagesCollRef = collection(db, 'users', user.uid, 'journalSessions', docSnap.id, 'messages');
            const messagesSnapshot = await getDocs(messagesCollRef);
            messagesSnapshot.forEach(msgDoc => batch.delete(msgDoc.ref));
          }
          batch.delete(docSnap.ref);
        });
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      const freshUserProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: undefined,
        latestMood: undefined,
      };
      batch.set(userDocRef, freshUserProfile); 

      await batch.commit(); 
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
