
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Participant {
  id: string;
  name: string;
  count: number;
}

export interface CounterState {
  title: string;
  participants: Participant[];
  updatedAt: Timestamp | null;
}

const DEFAULT_STATE: CounterState = {
  title: "Quem Bebeu Mais",
  participants: [],
  updatedAt: null,
};

export function useCounter() {
  const [data, setData] = useState<CounterState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'counter', 'current');
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.data() as CounterState);
      } else {
        // Initialize if not exists
        setDoc(docRef, { ...DEFAULT_STATE, updatedAt: Timestamp.now() });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTitle = async (newTitle: string) => {
    const docRef = doc(db, 'counter', 'current');
    await updateDoc(docRef, { 
      title: newTitle,
      updatedAt: Timestamp.now() 
    });
  };

  const addParticipant = async (name: string) => {
    const docRef = doc(db, 'counter', 'current');
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      count: 0
    };
    await updateDoc(docRef, {
      participants: [...data.participants, newParticipant],
      updatedAt: Timestamp.now()
    });
  };

  const incrementCount = async (id: string) => {
    const docRef = doc(db, 'counter', 'current');
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, count: p.count + 1 } : p
    );
    await updateDoc(docRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const resetCounts = async () => {
    const docRef = doc(db, 'counter', 'current');
    const updatedParticipants = data.participants.map(p => ({ ...p, count: 0 }));
    await updateDoc(docRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const removeParticipant = async (id: string) => {
    const docRef = doc(db, 'counter', 'current');
    const updatedParticipants = data.participants.filter(p => p.id !== id);
    await updateDoc(docRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  return {
    data,
    loading,
    updateTitle,
    addParticipant,
    incrementCount,
    resetCounts,
    removeParticipant
  };
}
