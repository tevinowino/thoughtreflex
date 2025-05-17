
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
  mbtiType?: string | null; // e.g., "INFJ", "ESTP", allow null
  latestMood?: {
    mood: 'positive' | 'neutral' | 'negative';
    date: string; // YYYY-MM-DD
    notes?: string;
  } | null; // Allow null
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
        // Ensure optional fields default to null if they are missing from Firestore
        mbtiType: profileData.mbtiType || null,
        latestMood: profileData.latestMood || null,
        photoURL: profileData.photoURL || null,
        displayName: profileData.displayName || null,
      } as UserProfile);
    } else {
      // This block might be hit if Firestore doc creation failed previously,
      // or for a very new user before handleAuthSuccess fully completes.
      // We'll primarily rely on handleAuthSuccess to create the initial doc.
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: firebaseUser.displayName || null,
        photoURL: firebaseUser.photoURL || null,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: null,
        latestMood: null,
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
      const existingProfile = userDocSnap.data() as UserProfile;
      userProfileData = {
        ...existingProfile,
        uid: firebaseUser.uid, // ensure uid is from auth user
        email: firebaseUser.email || null,
        displayName: displayNameParam || firebaseUser.displayName || existingProfile.displayName || null,
        photoURL: firebaseUser.photoURL || existingProfile.photoURL || null,
        defaultTherapistMode: existingProfile.defaultTherapistMode || 'Therapist',
        currentStreak: existingProfile.currentStreak || 0,
        longestStreak: existingProfile.longestStreak || 0,
        lastJournalDate: existingProfile.lastJournalDate || '',
        mbtiType: existingProfile.mbtiType || null,
        latestMood: existingProfile.latestMood || null,
      };
    } else {
      // New user profile
      userProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: displayNameParam || firebaseUser.displayName || null,
        photoURL: firebaseUser.photoURL || null,
        defaultTherapistMode: 'Therapist',
        currentStreak: 0,
        longestStreak: 0,
        lastJournalDate: '',
        mbtiType: null,
        latestMood: null,
      };
    }
    
    // Update Firebase Auth profile if necessary (displayName or photoURL might come from Google)
    const authProfileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
    if (userProfileData.displayName && auth.currentUser && auth.currentUser.displayName !== userProfileData.displayName) {
      authProfileUpdates.displayName = userProfileData.displayName;
    }
    if (userProfileData.photoURL !== undefined && auth.currentUser && auth.currentUser.photoURL !== userProfileData.photoURL) {
       authProfileUpdates.photoURL = userProfileData.photoURL;
    }
    if (auth.currentUser && Object.keys(authProfileUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authProfileUpdates);
    }
    

    await setDoc(userDocRef, userProfileData, { merge: true }); // merge: true is safer
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
      throw err; // Re-throw for form to catch
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
      throw err; // Re-throw for form to catch
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
      
      const authProfileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      if (details.displayName !== undefined && details.displayName !== auth.currentUser.displayName) {
        authProfileUpdates.displayName = details.displayName;
      }
      if (details.photoURL !== undefined && details.photoURL !== auth.currentUser.photoURL) { 
         authProfileUpdates.photoURL = details.photoURL;
      }
      if (Object.keys(authProfileUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authProfileUpdates);
      }
      
      // Ensure undefined values are converted to null for Firestore
      const firestoreSafeDetails: Partial<UserProfile> = {};
      for (const key in details) {
        if (Object.prototype.hasOwnProperty.call(details, key)) {
          const k = key as keyof UserProfile;
          firestoreSafeDetails[k] = details[k] === undefined ? null : details[k];
        }
      }

      await updateDoc(userDocRef, firestoreSafeDetails);
      setUser(prevUser => prevUser ? { ...prevUser, ...firestoreSafeDetails } : null);
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
      // Delete old profile then set a new one, or just set with overwrite?
      // For a "reset", it's cleaner to delete then set, but set with merge:false would also work if all fields are provided.
      // Given we are deleting subcollections, deleting the main doc then recreating ensures a truly fresh start.
      batch.delete(userDocRef); // Delete old profile doc
      await batch.commit(); // Commit deletions first

      // Re-initialize user profile in Firestore
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
