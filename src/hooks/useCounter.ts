
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

export interface CounterState {
  id: string;
  title: string;
  participants: Participant[];
  categories: string[];
  updatedAt: any;
}

const DEFAULT_ID = "current";
const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "Quem Bebeu Mais",
  participants: [],
  categories: ["Cerveja", "Água", "Drink", "Shot"],
  updatedAt: Timestamp.now(),
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
    }).catch(e => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: counterRef.path,
          operation: 'update',
          requestResourceData: { title: newTitle }
        }));
    });
  };

  const addParticipant = (name: string, category: string) => {
    if (!counterRef || !data) return;
    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      count: 0,
      category: category || "Geral"
    };
    
    updateDoc(counterRef, {
      participants: [...(data.participants || []), newParticipant],
      updatedAt: Timestamp.now()
    }).catch(e => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: counterRef.path,
          operation: 'update',
          requestResourceData: { participants: 'arrayUnion' }
        }));
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
      updatedAt: Timestamp.now()
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

  return {
    data: data || { ...DEFAULT_STATE, id: DEFAULT_ID, participants: [] },
    loading: isLoading,
    updateTitle,
    addParticipant,
    incrementCount,
    resetCounts,
    removeParticipant
  };
}
