
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
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  defaultTherapistMode?: 'Therapist' | 'Coach' | 'Friend';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
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
          };
          await setDoc(userDocRef, newUserProfile, { merge: true });
          setUser(newUserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = async (firebaseUser: FirebaseUser, displayName?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    let userProfileData: UserProfile;

    if (userDocSnap.exists()) {
      userProfileData = userDocSnap.data() as UserProfile;
      // Update with latest from FirebaseUser if necessary, especially for Google sign-ins
      userProfileData = {
        ...userProfileData, // Keep existing custom fields like defaultTherapistMode
        uid: firebaseUser.uid, // Ensure UID is from firebaseUser
        email: firebaseUser.email,
        displayName: displayName || firebaseUser.displayName || userProfileData.displayName,
        photoURL: firebaseUser.photoURL || userProfileData.photoURL,
      };
    } else {
      userProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        defaultTherapistMode: 'Therapist', // Default for new users
      };
    }
    
    // Update Firebase Auth profile if displayName is provided and different
    if (displayName && auth.currentUser && auth.currentUser.displayName !== displayName) {
      await updateFirebaseProfile(auth.currentUser, { displayName });
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
      if (displayName && result.user) {
        await updateFirebaseProfile(result.user, { displayName });
      }
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
      
      // If displayName is being updated, update Firebase Auth profile too
      if (details.displayName && details.displayName !== auth.currentUser.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: details.displayName });
      }
      // If photoURL is being updated (though not in settings page yet)
      if (details.photoURL && details.photoURL !== auth.currentUser.photoURL) {
         await updateFirebaseProfile(auth.currentUser, { photoURL: details.photoURL });
      }

      await updateDoc(userDocRef, details);
      setUser(prevUser => ({ ...prevUser, ...details } as UserProfile));
      setError(null);
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; // Re-throw for the component to handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut, updateUserProfile }}>
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
