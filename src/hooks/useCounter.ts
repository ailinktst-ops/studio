
"use client";

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
  participants: Participant[];
  categories: string[];
  updatedAt: any;
  raffle?: RaffleState;
}

const DEFAULT_ID = "current";
const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "Quem Bebeu Mais",
  participants: [],
  categories: ["Cerveja", "Água", "Drink", "Shot", "Gelo"],
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
  
  const counterRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'counters', DEFAULT_ID);
  }, [firestore]);

  const { data, isLoading } = useDoc<CounterState>(counterRef);

  // Inicialização segura do documento
  useEffect(() => {
    if (!isLoading && !data && counterRef) {
      setDoc(counterRef, { ...DEFAULT_STATE, id: DEFAULT_ID }, { merge: true })
        .catch((e) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: counterRef.path,
            operation: 'create',
            requestResourceData: DEFAULT_STATE
          }));
        });
    }
  }, [isLoading, data, counterRef]);

  const updateTitle = (newTitle: string) => {
    if (!counterRef) return;
    updateDoc(counterRef, { 
      title: newTitle,
      updatedAt: Timestamp.now() 
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { title: newTitle }
      }));
    });
  };

  const addParticipant = (name: string, category: string) => {
    if (!counterRef) return;
    
    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      count: 0,
      category: category || "Cerveja"
    };

    // Se o documento não existe ainda, usamos setDoc para criar
    if (!data) {
      setDoc(counterRef, {
        ...DEFAULT_STATE,
        id: DEFAULT_ID,
        participants: [newParticipant],
        updatedAt: Timestamp.now()
      });
    } else {
      updateDoc(counterRef, {
        participants: [...(data.participants || []), newParticipant],
        updatedAt: Timestamp.now()
      });
    }
  };

  const incrementCount = (id: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, count: p.count + 1 } : p
    );
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const resetCounts = () => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => ({ ...p, count: 0 }));
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now(),
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null }
    });
  };

  const removeParticipant = (id: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.filter(p => p.id !== id);
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const triggerRaffle = () => {
    if (!counterRef || !data || data.participants.length < 2) return;
    
    const top6 = [...data.participants]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    
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

    setTimeout(() => {
      updateDoc(counterRef, {
        "raffle.isRaffling": false
      });
    }, 8000);
  };

  const clearRaffle = () => {
    if (!counterRef) return;
    updateDoc(counterRef, {
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null }
    });
  };

  return {
    data: data || { ...DEFAULT_STATE, id: DEFAULT_ID, participants: [] },
    loading: isLoading,
    updateTitle,
    addParticipant,
    incrementCount,
    resetCounts,
    removeParticipant,
    triggerRaffle,
    clearRaffle
  };
}
