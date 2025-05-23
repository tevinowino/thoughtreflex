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
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, writeBatch, deleteDoc as deleteFirestoreDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { GenerateDailyTopicContentOutput } from '@/ai/core/daily-topic-content-schemas'; // For daily generated topics

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
  dailyGeneratedTopics?: { // Stores AI-generated topic content for each day
    [date: string]: GenerateDailyTopicContentOutput & { // YYYY-MM-DD
      completed?: boolean;
      userAnswers?: { // Store user's actual responses to this specific generated topic
        scores: number[];
        userEntry?: string;
        completedAt: Timestamp;
      };
    };
  } | null;
  lastDailyTopicCompletionDate?: string; // YYYY-MM-DD // Tracks if user completed any topic on this date
  // Old dailyTopicUserAnswers is effectively merged into dailyGeneratedTopics.userAnswers
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
        uid: firebaseUser.uid, // Always ensure uid is from auth
        email: firebaseUser.email || profileData.email || null,
        displayName: firebaseUser.displayName || profileData.displayName || null,
        photoURL: firebaseUser.photoURL || profileData.photoURL || null,
        defaultTherapistMode: profileData.defaultTherapistMode || 'Therapist',
        currentStreak: profileData.currentStreak || 0,
        longestStreak: profileData.longestStreak || 0,
        lastJournalDate: profileData.lastJournalDate || '',
        mbtiType: profileData.mbtiType || null,
        latestMood: profileData.latestMood || null,
        detectedIssues: profileData.detectedIssues || null,
        dailyGeneratedTopics: profileData.dailyGeneratedTopics || null,
        lastDailyTopicCompletionDate: profileData.lastDailyTopicCompletionDate || null,
      } as UserProfile);
    } else {
      // New user profile creation
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
        detectedIssues: null,
        dailyGeneratedTopics: null,
        lastDailyTopicCompletionDate: null,
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
        displayName: initialDisplayName === undefined ? existingProfile.displayName : initialDisplayName,
        photoURL: initialPhotoURL === undefined ? existingProfile.photoURL : initialPhotoURL,
        defaultTherapistMode: existingProfile.defaultTherapistMode || 'Therapist',
        currentStreak: existingProfile.currentStreak || 0,
        longestStreak: existingProfile.longestStreak || 0,
        lastJournalDate: existingProfile.lastJournalDate || '',
        mbtiType: existingProfile.mbtiType === undefined ? null : existingProfile.mbtiType,
        latestMood: existingProfile.latestMood === undefined ? null : existingProfile.latestMood,
        detectedIssues: existingProfile.detectedIssues === undefined ? null : existingProfile.detectedIssues,
        dailyGeneratedTopics: existingProfile.dailyGeneratedTopics === undefined ? null : existingProfile.dailyGeneratedTopics,
        lastDailyTopicCompletionDate: existingProfile.lastDailyTopicCompletionDate === undefined ? null : existingProfile.lastDailyTopicCompletionDate,
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
        dailyGeneratedTopics: null,
        lastDailyTopicCompletionDate: null,
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
    
    // Ensure all undefined top-level fields are converted to null for Firestore
    const firestoreSafeUserProfileData = Object.fromEntries(
      Object.entries(userProfileData).map(([key, value]) => [key, value === undefined ? null : value])
    );

    await setDoc(userDocRef, firestoreSafeUserProfileData, { merge: true });
    setUser(userProfileData); // Use the original potentially undefined values for local state
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
      
      const firestoreUpdateData: Partial<UserProfile> = { ...details };
      
      // Convert undefined to null for Firestore compatibility
      Object.keys(firestoreUpdateData).forEach(key => {
        const k = key as keyof UserProfile;
        if (firestoreUpdateData[k] === undefined) {
          delete firestoreUpdateData[k]; // Or set to null explicitly if field should exist with null
        }
      });
      
      // Deep merge for dailyGeneratedTopics and detectedIssues
      if (details.dailyGeneratedTopics) {
        const currentTopics = user.dailyGeneratedTopics || {};
        firestoreUpdateData.dailyGeneratedTopics = { ...currentTopics, ...details.dailyGeneratedTopics };
        Object.keys(firestoreUpdateData.dailyGeneratedTopics!).forEach(dateKey => {
            if (details.dailyGeneratedTopics![dateKey]?.userAnswers) {
                 firestoreUpdateData.dailyGeneratedTopics![dateKey].userAnswers = {
                    ...(currentTopics[dateKey]?.userAnswers || {}),
                    ...details.dailyGeneratedTopics![dateKey].userAnswers,
                };
            }
        });
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

      await updateDoc(userDocRef, firestoreUpdateData);
      
      const updatedDocSnap = await getDoc(userDocRef);
      if (updatedDocSnap.exists()) {
        setUser(updatedDocSnap.data() as UserProfile);
      } else {
        setUser(prevUser => prevUser ? { ...prevUser, ...firestoreUpdateData } : null);
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
       // Instead of deleting the user profile doc, reset it.
      const freshUserProfileData: UserProfile = {
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
        dailyGeneratedTopics: null,
        lastDailyTopicCompletionDate: null,
      };
      batch.set(userDocRef, freshUserProfileData); // Set overwrites the document with new data
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