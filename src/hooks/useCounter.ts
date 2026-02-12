
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
  imageUrl?: string;
}

export interface ElegantMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface RaffleState {
  isRaffling: boolean;
  winnerId: string | null;
  candidates: string[];
  startTime: number | null;
  type?: 'raffle' | 'challenge';
}

export interface AnnouncementState {
  message: string;
  isActive: boolean;
  timestamp: number | null;
}

export interface CounterState {
  id: string;
  title: string;
  brandName: string;
  brandIcon: string;
  brandImageUrl?: string;
  participants: Participant[];
  messages: ElegantMessage[];
  categories: string[];
  customPhrases: string[];
  updatedAt: any;
  raffle?: RaffleState;
  announcement?: AnnouncementState;
}

const DEFAULT_ID = "current";
const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "RANKING DE CONSUMO",
  brandName: "RankUp Counter",
  brandIcon: "Beer",
  brandImageUrl: "",
  participants: [],
  messages: [],
  categories: ["Cerveja", "Água", "Drink", "Shot", "Gelo"],
  customPhrases: ["A ELITE DA RESENHA EM TEMPO REAL", "SIGA O LÍDER!", "QUEM NÃO BEBE, NÃO CONTA HISTÓRIA"],
  updatedAt: Timestamp.now(),
  raffle: {
    isRaffling: false,
    winnerId: null,
    candidates: [],
    startTime: null,
    type: 'raffle'
  },
  announcement: {
    message: "",
    isActive: false,
    timestamp: null
  }
};

export function useCounter() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const counterRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'counters', DEFAULT_ID);
  }, [firestore]);

  const { data: rawData, isLoading: isDocLoading } = useDoc<CounterState>(counterRef);
  const isLoading = isDocLoading || isUserLoading;

  const data: CounterState = {
    ...DEFAULT_STATE,
    id: DEFAULT_ID,
    ...(rawData || {}),
    participants: rawData?.participants || [],
    messages: rawData?.messages || [],
    customPhrases: rawData?.customPhrases || DEFAULT_STATE.customPhrases,
    raffle: {
      ...DEFAULT_STATE.raffle!,
      ...(rawData?.raffle || {})
    },
    announcement: {
      ...DEFAULT_STATE.announcement!,
      ...(rawData?.announcement || {})
    }
  };

  useEffect(() => {
    if (!isDocLoading && !rawData && counterRef && user && !isUserLoading) {
      setDoc(counterRef, { ...DEFAULT_STATE, id: DEFAULT_ID }, { merge: true })
        .catch((e) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: counterRef.path,
            operation: 'create',
            requestResourceData: DEFAULT_STATE
          }));
        });
    }
  }, [isDocLoading, rawData, counterRef, user, isUserLoading]);

  const updateDocField = (fields: Partial<CounterState>) => {
    if (!counterRef || !user || !data) return;
    updateDoc(counterRef, { 
      ...fields,
      updatedAt: Timestamp.now() 
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
    updateDoc(counterRef, {
      participants: [...(data?.participants || []), newParticipant],
      updatedAt: Timestamp.now()
    });
  };

  const updateParticipantImage = (id: string, imageUrl: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, imageUrl } : p
    );
    updateDoc(counterRef, {
      participants: updatedParticipants,
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

  const resetAll = () => {
    if (!counterRef) return;
    updateDoc(counterRef, {
      participants: [],
      messages: [],
      updatedAt: Timestamp.now(),
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null, type: 'raffle' },
      announcement: { message: "", isActive: false, timestamp: null }
    });
  };

  const resetOnlyPoints = () => {
    if (!counterRef || !data) return;
    const resetParticipants = data.participants.map(p => ({ ...p, count: 0 }));
    updateDoc(counterRef, {
      participants: resetParticipants,
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

  // Correio Elegante
  const sendElegantMessage = (from: string, to: string, content: string) => {
    if (!counterRef) return;
    const newMessage: ElegantMessage = {
      id: Math.random().toString(36).substring(2, 11),
      from,
      to,
      content,
      status: 'pending',
      timestamp: Date.now()
    };
    updateDoc(counterRef, {
      messages: [...(data?.messages || []), newMessage],
      updatedAt: Timestamp.now()
    });
  };

  const moderateMessage = (id: string, status: 'approved' | 'rejected') => {
    if (!counterRef || !data) return;
    const updatedMessages = data.messages.map(m => 
      m.id === id ? { ...m, status } : m
    );
    updateDoc(counterRef, {
      messages: updatedMessages,
      updatedAt: Timestamp.now()
    });
  };

  const clearElegantMessages = () => {
    if (!counterRef || !data) return;
    const updatedMessages = data.messages.map(m => 
      m.status === 'approved' ? { ...m, status: 'rejected' as const } : m
    );
    updateDoc(counterRef, {
      messages: updatedMessages,
      updatedAt: Timestamp.now()
    });
  };

  const triggerRaffle = () => {
    if (!counterRef || !data || data.participants.length < 2) return;
    const top6 = [...data.participants].sort((a, b) => b.count - a.count).slice(0, 6);
    const candidates = top6.map(p => p.name);
    const winner = top6[Math.floor(Math.random() * top6.length)];
    updateDoc(counterRef, {
      raffle: {
        isRaffling: true,
        winnerId: winner.id,
        candidates: candidates,
        startTime: Date.now(),
        type: 'raffle'
      }
    });
    setTimeout(() => updateDoc(counterRef, { "raffle.isRaffling": false }), 8000);
  };

  const triggerSurpriseChallenge = () => {
    if (!counterRef || !data || data.participants.length < 1) return;
    const candidates = data.participants.map(p => p.name);
    const winner = data.participants[Math.floor(Math.random() * data.participants.length)];
    updateDoc(counterRef, {
      raffle: {
        isRaffling: true,
        winnerId: winner.id,
        candidates: candidates,
        startTime: Date.now(),
        type: 'challenge'
      }
    });
    setTimeout(() => updateDoc(counterRef, { "raffle.isRaffling": false }), 15000);
  };

  const clearChallenge = () => {
    if (!counterRef) return;
    updateDoc(counterRef, {
      "raffle.winnerId": null,
      "raffle.type": 'raffle',
      updatedAt: Timestamp.now()
    });
  };

  const triggerAnnouncement = (message: string) => {
    if (!counterRef || !message.trim()) return;
    updateDoc(counterRef, {
      announcement: {
        message: message.trim(),
        isActive: true,
        timestamp: Date.now()
      }
    });
    setTimeout(() => updateDoc(counterRef, { "announcement.isActive": false }), 8000);
  };

  return {
    data,
    loading: isLoading,
    isInitializing: isDocLoading && !rawData,
    updateTitle: (title: string) => updateDocField({ title }),
    updateBrand: (brandName: string, brandIcon: string) => updateDocField({ brandName, brandIcon }),
    updateBrandImage: (brandImageUrl: string) => updateDocField({ brandImageUrl }),
    updatePhrases: (customPhrases: string[]) => updateDocField({ customPhrases }),
    addParticipant,
    updateParticipantImage,
    incrementCount,
    resetAll,
    resetOnlyPoints,
    removeParticipant,
    sendElegantMessage,
    moderateMessage,
    clearElegantMessages,
    triggerRaffle,
    triggerSurpriseChallenge,
    clearChallenge,
    triggerAnnouncement
  };
}
