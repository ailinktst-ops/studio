
"use client";

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Participant {
  id: string;
  name: string;
  count: number;
  category: string;
}

export interface RaffleState {
  isRaffling: boolean;
  winnerId: string | null;
  candidates: string[];
  startTime: number | null;
}

export interface CounterState {
  id: string;
  title: string;
  brandName: string;
  brandIcon: string;
  participants: Participant[];
  categories: string[];
  customPhrases: string[];
  updatedAt: any;
  raffle?: RaffleState;
}

const DEFAULT_ID = "current";
const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "Resenha Épica",
  brandName: "RankUp Counter",
  brandIcon: "Beer",
  participants: [],
  categories: ["Cerveja", "Água", "Drink", "Shot", "Gelo"],
  customPhrases: ["A Elite da Resenha em Tempo Real", "Siga o líder!", "Quem não bebe, não conta história"],
  updatedAt: Timestamp.now(),
  raffle: {
    isRaffling: false,
    winnerId: null,
    candidates: [],
    startTime: null
  }
};

export function useCounter() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const counterRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'counters', DEFAULT_ID);
  }, [firestore]);

  const { data, isLoading: isDocLoading } = useDoc<CounterState>(counterRef);
  const isLoading = isDocLoading || isUserLoading;

  useEffect(() => {
    if (!isDocLoading && !data && counterRef && user && !isUserLoading) {
      setDoc(counterRef, { ...DEFAULT_STATE, id: DEFAULT_ID }, { merge: true })
        .catch((e) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: counterRef.path,
            operation: 'create',
            requestResourceData: DEFAULT_STATE
          }));
        });
    }
  }, [isDocLoading, data, counterRef, user, isUserLoading]);

  const updateDocField = (fields: Partial<CounterState>) => {
    if (!counterRef || !user || !data) return;
    updateDoc(counterRef, { 
      ...fields,
      updatedAt: Timestamp.now() 
    });
  };

  const addParticipant = (name: string, category: string) => {
    if (!counterRef || !user) return;
    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      count: 0,
      category: category || "Cerveja"
    };
    updateDoc(counterRef, {
      participants: [...(data?.participants || []), newParticipant],
      updatedAt: Timestamp.now()
    });
  };

  const incrementCount = (id: string) => {
    if (!counterRef || !data || !user) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, count: p.count + 1 } : p
    );
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const resetCounts = () => {
    if (!counterRef || !user) return;
    updateDoc(counterRef, {
      participants: [],
      updatedAt: Timestamp.now(),
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null }
    });
  };

  const removeParticipant = (id: string) => {
    if (!counterRef || !data || !user) return;
    const updatedParticipants = data.participants.filter(p => p.id !== id);
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const triggerRaffle = () => {
    if (!counterRef || !data || !user || data.participants.length < 2) return;
    const top6 = [...data.participants].sort((a, b) => b.count - a.count).slice(0, 6);
    const candidates = top6.map(p => p.name);
    const winner = top6[Math.floor(Math.random() * top6.length)];
    updateDoc(counterRef, {
      raffle: {
        isRaffling: true,
        winnerId: winner.id,
        candidates: candidates,
        startTime: Date.now()
      }
    });
    setTimeout(() => updateDoc(counterRef, { "raffle.isRaffling": false }), 8000);
  };

  return {
    data: data || { ...DEFAULT_STATE, id: DEFAULT_ID, participants: [] },
    loading: isLoading,
    isInitializing: isDocLoading && !data,
    updateTitle: (title: string) => updateDocField({ title }),
    updateBrand: (brandName: string, brandIcon: string) => updateDocField({ brandName, brandIcon }),
    updatePhrases: (customPhrases: string[]) => updateDocField({ customPhrases }),
    addParticipant,
    incrementCount,
    resetCounts,
    removeParticipant,
    triggerRaffle
  };
}
