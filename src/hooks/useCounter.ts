
"use client";

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Participant {
  id: string;
  name: string;
  count: number;
  category: string;
  imageUrl?: string;
  status: 'pending' | 'approved';
}

export interface ElegantMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface MusicRequest {
  id: string;
  artist: string;
  song: string;
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
  musicRequests: MusicRequest[];
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
  musicRequests: [],
  categories: ["Cerveja", "Água", "Drink", "Shot", "Passa ou repassa"],
  customPhrases: [
    "A ELITE DA RESENHA EM TEMPO REAL", 
    "SIGA O LÍDER!", 
    "QUEM NÃO BEBE, NÃO CONTA HISTÓRIA"
  ],
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

  const sanitizeCategories = (cats: string[]) => cats.map(c => c === "Gelo" ? "Passa ou repassa" : c);

  const data: CounterState = {
    ...DEFAULT_STATE,
    id: DEFAULT_ID,
    ...(rawData || {}),
    participants: (rawData?.participants || []).map(p => ({
      ...p,
      category: p.category === "Gelo" ? "Passa ou repassa" : p.category
    })),
    messages: rawData?.messages || [],
    musicRequests: rawData?.musicRequests || [],
    categories: sanitizeCategories(rawData?.categories || DEFAULT_STATE.categories),
    customPhrases: (rawData?.customPhrases && rawData.customPhrases.length > 0) 
      ? rawData.customPhrases 
      : DEFAULT_STATE.customPhrases,
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
    async function initDoc() {
      if (!isDocLoading && !rawData && counterRef && user && !isUserLoading) {
        const snap = await getDoc(counterRef);
        if (!snap.exists()) {
          setDoc(counterRef, { ...DEFAULT_STATE, id: DEFAULT_ID }, { merge: true })
            .catch((e) => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: counterRef.path,
                operation: 'create',
                requestResourceData: DEFAULT_STATE
              }));
            });
        }
      }
    }
    initDoc();
  }, [isDocLoading, rawData, counterRef, user, isUserLoading]);

  const updateDocField = (fields: Partial<CounterState>) => {
    if (!counterRef || !user || !data) return;
    updateDoc(counterRef, { 
      ...fields,
      updatedAt: Timestamp.now() 
    });
  };

  const addParticipant = (name: string, category: string, imageUrl?: string, autoApprove = false): boolean => {
    if (!counterRef || !data) return false;
    const normalizedName = name.trim().toLowerCase();
    const nameExists = data.participants.some(p => p.name.toLowerCase() === normalizedName);
    if (nameExists) return false;

    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      count: 0,
      category: category === "Gelo" ? "Passa ou repassa" : (category || "Cerveja"),
      imageUrl,
      status: autoApprove ? 'approved' : 'pending'
    };
    updateDoc(counterRef, {
      participants: [...(data?.participants || []), newParticipant],
      updatedAt: Timestamp.now()
    });
    return true;
  };

  const moderateParticipant = (id: string, status: 'approved' | 'rejected', category?: string) => {
    if (!counterRef || !data) return;
    let updatedParticipants;
    if (status === 'rejected') {
      updatedParticipants = data.participants.filter(p => p.id !== id);
    } else {
      updatedParticipants = data.participants.map(p => 
        p.id === id ? { ...p, status: 'approved' as const, category: (category === "Gelo" ? "Passa ou repassa" : category) || p.category } : p
      );
    }
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const updateParticipantCategory = (id: string, category: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, category: category === "Gelo" ? "Passa ou repassa" : category } : p
    );
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    });
  };

  const updateAllParticipantsCategory = (category: string, resetPoints: boolean) => {
    if (!counterRef || !data) return;
    const finalCategory = category === "Gelo" ? "Passa ou repassa" : category;
    const updatedParticipants = data.participants.map(p => ({
      ...p,
      category: finalCategory,
      count: resetPoints ? 0 : p.count
    }));
    updateDoc(counterRef, {
      participants: updatedParticipants,
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
      musicRequests: [],
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

  const sendMusicRequest = (artist: string, song: string) => {
    if (!counterRef) return;
    const newRequest: MusicRequest = {
      id: Math.random().toString(36).substring(2, 11),
      artist,
      song,
      status: 'pending',
      timestamp: Date.now()
    };
    updateDoc(counterRef, {
      musicRequests: [...(data?.musicRequests || []), newRequest],
      updatedAt: Timestamp.now()
    });
  };

  const moderateMusic = (id: string, status: 'approved' | 'rejected') => {
    if (!counterRef || !data) return;
    const updatedRequests = data.musicRequests.map(m => 
      m.id === id ? { ...m, status } : m
    );
    updateDoc(counterRef, {
      musicRequests: updatedRequests,
      updatedAt: Timestamp.now()
    });
  };

  const triggerRaffle = () => {
    if (!counterRef || !data) return;
    const approvedParticipants = data.participants.filter(p => p.status === 'approved');
    if (approvedParticipants.length < 2) return;
    const top6 = [...approvedParticipants].sort((a, b) => b.count - a.count).slice(0, 6);
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
    if (!counterRef || !data) return;
    const approvedParticipants = data.participants.filter(p => p.status === 'approved');
    if (approvedParticipants.length < 1) return;
    const candidates = approvedParticipants.map(p => p.name);
    const winner = approvedParticipants[Math.floor(Math.random() * approvedParticipants.length)];
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
    moderateParticipant,
    updateParticipantCategory,
    updateAllParticipantsCategory,
    updateParticipantImage,
    incrementCount,
    resetAll,
    resetOnlyPoints,
    removeParticipant,
    sendElegantMessage,
    moderateMessage,
    clearElegantMessages,
    sendMusicRequest,
    moderateMusic,
    triggerRaffle,
    triggerSurpriseChallenge,
    clearChallenge,
    triggerAnnouncement
  };
}
