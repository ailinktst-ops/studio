
"use client";

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
  candidates: string[]; // Nomes dos participantes no sorteio
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
  const { firestore } = useFirestore();
  
  const counterRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'counters', DEFAULT_ID);
  }, [firestore]);

  const { data, isLoading } = useDoc<CounterState>(counterRef);

  // Inicializa o documento se não existir
  if (!isLoading && !data && counterRef) {
    setDoc(counterRef, { ...DEFAULT_STATE, id: DEFAULT_ID }, { merge: true })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: counterRef.path,
          operation: 'create',
          requestResourceData: DEFAULT_STATE
        }));
      });
  }

  const updateTitle = (newTitle: string) => {
    if (!counterRef) return;
    updateDoc(counterRef, { 
      title: newTitle,
      updatedAt: Timestamp.now() 
    });
  };

  const addParticipant = (name: string, category: string) => {
    if (!counterRef || !data) return;
    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      count: 0,
      category: category || "Cerveja"
    };
    
    updateDoc(counterRef, {
      participants: [...(data.participants || []), newParticipant],
      updatedAt: Timestamp.now()
    });
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
    
    // Pega os 6 maiores
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

    // Limpa o estado do sorteio após 8 segundos (animação termina)
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
