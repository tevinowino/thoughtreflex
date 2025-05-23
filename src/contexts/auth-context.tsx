
// src/contexts/auth-context.tsx
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
  // deleteUser, // Not used if we only delete data
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, writeBatch, deleteDoc as deleteFirestoreDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { GenerateDailyTopicContentOutput, DailyTopicUserAnswers } from '@/ai/core/daily-topic-content-schemas';

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
  detectedIssues?: {
    [key: string]: {
      occurrences: number;
      lastDetected: Timestamp;
    };
  } | null;
  dailyGeneratedTopics?: {
    [date: string]: GenerateDailyTopicContentOutput & {
      completed?: boolean;
      userAnswers?: DailyTopicUserAnswers; // Using the more specific type
    };
  } | null;
  lastDailyTopicCompletionDate?: string | null; // YYYY-MM-DD
  milestonesAchieved?: number[]; // e.g., [3, 7, 14, 30] for streaks
  lastCompassionCheckInDate?: string | null; // YYYY-MM-DD
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

  const defaultUserProfileValues: Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL'> = {
    defaultTherapistMode: 'Therapist',
    currentStreak: 0,
    longestStreak: 0,
    lastJournalDate: '',
    mbtiType: null,
    latestMood: null,
    detectedIssues: null,
    dailyGeneratedTopics: null,
    lastDailyTopicCompletionDate: null,
    milestonesAchieved: [],
    lastCompassionCheckInDate: null,
  };

  const fetchAndSetUser = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const profileData = userDocSnap.data();
      setUser({
        ...defaultUserProfileValues, // Ensure all fields have defaults
        ...profileData, // Spread existing data first
        uid: firebaseUser.uid,
        email: firebaseUser.email || profileData.email || null,
        displayName: firebaseUser.displayName || profileData.displayName || null,
        photoURL: firebaseUser.photoURL || profileData.photoURL || null,
        // Ensure nested objects are properly defaulted if missing
        detectedIssues: profileData.detectedIssues || null,
        dailyGeneratedTopics: profileData.dailyGeneratedTopics || null,
        latestMood: profileData.latestMood || null,
        milestonesAchieved: profileData.milestonesAchieved || [],
      } as UserProfile);
    } else {
      // New user profile creation
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: firebaseUser.displayName || 'Valued User', // Default display name
        photoURL: firebaseUser.photoURL || null, // Default photoURL
        ...defaultUserProfileValues,
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
      try {
        await fetchAndSetUser(auth.currentUser);
      } catch(err) {
        console.error("Error refreshing user profile:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAuthSuccess = async (firebaseUser: FirebaseUser, displayNameParam?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    let userProfileData: UserProfile;

    const initialDisplayName = displayNameParam || firebaseUser.displayName || 'Valued User';
    const initialPhotoURL = firebaseUser.photoURL || null;

    if (userDocSnap.exists()) {
      const existingProfile = userDocSnap.data() as UserProfile;
      userProfileData = {
        ...defaultUserProfileValues,
        ...existingProfile,
        uid: firebaseUser.uid, 
        email: firebaseUser.email || null,
        displayName: initialDisplayName,
        photoURL: initialPhotoURL,
        milestonesAchieved: existingProfile.milestonesAchieved || [],
      };
    } else {
      userProfileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: initialDisplayName,
        photoURL: initialPhotoURL,
        ...defaultUserProfileValues,
      };
    }
    
    const authProfileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
    if (userProfileData.displayName !== undefined && (auth.currentUser?.displayName !== userProfileData.displayName)) {
      authProfileUpdates.displayName = userProfileData.displayName;
    }
    if (userProfileData.photoURL !== undefined && (auth.currentUser?.photoURL !== userProfileData.photoURL)) {
       authProfileUpdates.photoURL = userProfileData.photoURL;
    }

    if (auth.currentUser && Object.keys(authProfileUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authProfileUpdates);
    }
    
    const firestoreSafeUserProfileData = Object.fromEntries(
      Object.entries(userProfileData).map(([key, value]) => [key, value === undefined ? null : value])
    );

    await setDoc(userDocRef, firestoreSafeUserProfileData, { merge: true });
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
    setError(null);
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
    setError(null);
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
    setError(null);
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
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
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
    setError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const authProfileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
      if (details.displayName !== undefined && details.displayName !== auth.currentUser.displayName) {
        authProfileUpdates.displayName = details.displayName;
      }
      if (details.photoURL !== undefined) { 
         authProfileUpdates.photoURL = details.photoURL === '' ? null : details.photoURL;
      }


      if (Object.keys(authProfileUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authProfileUpdates);
      }
      
      const firestoreUpdateData: any = { ...details };
      
      Object.keys(firestoreUpdateData).forEach(key => {
        if (firestoreUpdateData[key] === undefined) {
          firestoreUpdateData[key] = null; 
        }
      });
      
      if (details.dailyGeneratedTopics) {
        const currentTopics = user.dailyGeneratedTopics || {};
        firestoreUpdateData.dailyGeneratedTopics = { ...currentTopics, ...details.dailyGeneratedTopics };
      }
      
      if (details.detectedIssues) {
        const currentIssues = user.detectedIssues || {};
        firestoreUpdateData.detectedIssues = { ...currentIssues };
        for (const issueKey in details.detectedIssues) {
          firestoreUpdateData.detectedIssues[issueKey] = {
            occurrences: ((currentIssues[issueKey]?.occurrences || 0) + (details.detectedIssues[issueKey].occurrences || 0)),
            lastDetected: details.detectedIssues[issueKey].lastDetected,
          };
        }
      }
      if (details.milestonesAchieved) {
         firestoreUpdateData.milestonesAchieved = Array.from(new Set([...(user.milestonesAchieved || []), ...details.milestonesAchieved]));
      }


      await updateDoc(userDocRef, firestoreUpdateData);
      
      const updatedUser = { ...user, ...firestoreUpdateData };
      // Ensure nested objects are merged correctly, not just replaced
      if (details.dailyGeneratedTopics) updatedUser.dailyGeneratedTopics = firestoreUpdateData.dailyGeneratedTopics;
      if (details.detectedIssues) updatedUser.detectedIssues = firestoreUpdateData.detectedIssues;
      if (details.milestonesAchieved) updatedUser.milestonesAchieved = firestoreUpdateData.milestonesAchieved;


      setUser(updatedUser);
    } catch (err) {
      handleAuthError(err as AuthError);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  const deleteUserData = async (currentPassword?: string) => {
    if (!user || !auth.currentUser) {
      const noUserError = { code: 'auth/no-current-user', message: 'User not authenticated.' } as AuthError;
      setError(noUserError);
      throw noUserError;
    }
    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID)) {
        if (!currentPassword) {
          throw { code: 'auth/missing-password', message: 'Current password is required for re-authentication.' } as AuthError;
        }
        const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (currentUser.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID)) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        throw { code: 'auth/reauthentication-not-supported', message: 'Re-authentication method not supported for this user.' } as AuthError;
      }

      const batch = writeBatch(db);
      const collectionsToDelete = ['goals', 'journalSessions', 'notebookEntries', 'weeklyRecaps', 'mindShifts', 'dailyMoods', 'dailyTopicUserAnswers']; // dailyTopicUserAnswers to be deleted

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
      const freshUserProfileData: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || null,
        displayName: currentUser.displayName || 'Valued User',
        photoURL: currentUser.photoURL || null,
        ...defaultUserProfileValues, // Apply all defaults
      };
      batch.set(userDocRef, freshUserProfileData); 
      await batch.commit(); 
      
      setUser(freshUserProfileData);
      
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
