
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
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
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
  refreshUserProfile: () => Promise<void>; // Added for manual refresh if needed
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
      // This case should ideally be handled during sign-up/sign-in
      // For Google Sign-in, it creates the profile on first login
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
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
      // Update with latest from FirebaseUser if necessary, especially for Google sign-ins
      userProfileData = {
        ...userProfileData, // Keep existing custom fields
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayNameParam || firebaseUser.displayName || userProfileData.displayName,
        photoURL: firebaseUser.photoURL || userProfileData.photoURL,
        // Ensure streak fields are initialized if they don't exist
        currentStreak: userProfileData.currentStreak || 0,
        longestStreak: userProfileData.longestStreak || 0,
        lastJournalDate: userProfileData.lastJournalDate || '',
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
      if (details.photoURL && details.photoURL !== auth.currentUser.photoURL) {
         await updateFirebaseProfile(auth.currentUser, { photoURL: details.photoURL });
      }

      await updateDoc(userDocRef, details);
      // Fetch the updated profile to ensure local state is consistent
      const updatedDocSnap = await getDoc(userDocRef);
      if (updatedDocSnap.exists()) {
        setUser(updatedDocSnap.data() as UserProfile);
      }
      setError(null);
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut, updateUserProfile, refreshUserProfile }}>
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
