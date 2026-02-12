
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
const VALID_CATEGORIES = ["Gole", "Passa ou Repassa"];

const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "RANKING DE CONSUMO",
  brandName: "RankUp Counter",
  brandIcon: "Beer",
  brandImageUrl: "",
  participants: [],
  messages: [],
  musicRequests: [],
  categories: VALID_CATEGORIES,
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

  const cleanData = (state: Partial<CounterState>): CounterState => {
    const sanitize = (cat: string) => VALID_CATEGORIES.includes(cat) ? cat : "Gole";
    
    return {
      ...DEFAULT_STATE,
      id: DEFAULT_ID,
      ...state,
      categories: VALID_CATEGORIES,
      participants: (state.participants || []).map(p => ({
        ...p,
        category: sanitize(p.category)
      })),
      messages: state.messages || [],
      musicRequests: state.musicRequests || [],
      customPhrases: (state.customPhrases && state.customPhrases.length > 0) 
        ? state.customPhrases 
        : DEFAULT_STATE.customPhrases,
      raffle: {
        ...DEFAULT_STATE.raffle!,
        ...(state.raffle || {})
      },
      announcement: {
        ...DEFAULT_STATE.announcement!,
        ...(state.announcement || {})
      }
    } as CounterState;
  };

  const data = cleanData(rawData || {});

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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: fields
      }));
    });
  };

  const addParticipant = (name: string, category: string, imageUrl?: string, autoApprove = false): boolean => {
    if (!counterRef || !data) return false;
    const normalizedName = name.trim().toLowerCase();
    const nameExists = data.participants.some(p => p.name.toLowerCase() === normalizedName);
    if (nameExists) return false;

    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "Gole";

    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      count: 0,
      category: finalCategory,
      imageUrl,
      status: autoApprove ? 'approved' : 'pending'
    };
    
    updateDoc(counterRef, {
      participants: [...(data?.participants || []), newParticipant],
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: [...(data?.participants || []), newParticipant] }
      }));
    });
    return true;
  };

  const moderateParticipant = (id: string, status: 'approved' | 'rejected', category?: string) => {
    if (!counterRef || !data) return;
    let updatedParticipants;
    if (status === 'rejected') {
      updatedParticipants = data.participants.filter(p => p.id !== id);
    } else {
      const finalCategory = category && VALID_CATEGORIES.includes(category) ? category : undefined;
      updatedParticipants = data.participants.map(p => 
        p.id === id ? { 
          ...p, 
          status: 'approved' as const, 
          category: finalCategory || p.category 
        } : p
      );
    }
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: updatedParticipants }
      }));
    });
  };

  const updateParticipantCategory = (id: string, category: string) => {
    if (!counterRef || !data) return;
    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "Gole";
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, category: finalCategory } : p
    );
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: updatedParticipants }
      }));
    });
  };

  const updateAllParticipantsCategory = (category: string, resetPoints: boolean) => {
    if (!counterRef || !data) return;
    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "Gole";
    const updatedParticipants = data.participants.map(p => ({
      ...p,
      category: finalCategory,
      count: resetPoints ? 0 : p.count
    }));
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: updatedParticipants }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: updatedParticipants }
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: updatedParticipants }
      }));
    });
  };

  const resetAll = () => {
    if (!counterRef) return;
    const resetData = {
      participants: [],
      messages: [],
      musicRequests: [],
      updatedAt: Timestamp.now(),
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null, type: 'raffle' },
      announcement: { message: "", isActive: false, timestamp: null }
    };
    updateDoc(counterRef, resetData).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: resetData
      }));
    });
  };

  const resetOnlyPoints = () => {
    if (!counterRef || !data) return;
    const resetParticipants = data.participants.map(p => ({ ...p, count: 0 }));
    updateDoc(counterRef, {
      participants: resetParticipants,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: resetParticipants }
      }));
    });
  };

  const removeParticipant = (id: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.filter(p => p.id !== id);
    updateDoc(counterRef, {
      participants: updatedParticipants,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { participants: updatedParticipants }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { messages: [...(data?.messages || []), newMessage] }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { messages: updatedMessages }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { messages: updatedMessages }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { musicRequests: [...(data?.musicRequests || []), newRequest] }
      }));
    });
  };

  const moderateMusic = (id: string, status: 'approved' | 'rejected') => {
    if (!counterRef || !data) return;
    
    let updatedRequests = data.musicRequests.map(m => 
      m.id === id ? { ...m, status } : m
    );

    // Regra FIFO: Apenas 10 músicas aprovadas. Se aprovar a 11ª, remove a mais antiga aprovada.
    if (status === 'approved') {
      const approvedOnes = updatedRequests.filter(m => m.status === 'approved').sort((a,b) => a.timestamp - b.timestamp);
      if (approvedOnes.length > 10) {
        const oldestId = approvedOnes[0].id;
        updatedRequests = updatedRequests.filter(m => m.id !== oldestId);
      }
    }

    updateDoc(counterRef, {
      musicRequests: updatedRequests,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { musicRequests: updatedRequests }
      }));
    });
  };

  const removeMusicRequest = (id: string) => {
    if (!counterRef || !data) return;
    const updatedRequests = data.musicRequests.filter(m => m.id !== id);
    updateDoc(counterRef, {
      musicRequests: updatedRequests,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { musicRequests: updatedRequests }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { raffle: { isRaffling: true, winnerId: winner.id, candidates, startTime: Date.now(), type: 'raffle' } }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { raffle: { isRaffling: true, winnerId: winner.id, candidates, startTime: Date.now(), type: 'challenge' } }
      }));
    });
    setTimeout(() => updateDoc(counterRef, { "raffle.isRaffling": false }), 15000);
  };

  const clearChallenge = () => {
    if (!counterRef) return;
    updateDoc(counterRef, {
      "raffle.winnerId": null,
      "raffle.type": 'raffle',
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { "raffle.winnerId": null, "raffle.type": 'raffle' }
      }));
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
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { announcement: { message: message.trim(), isActive: true, timestamp: Date.now() } }
      }));
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
    removeMusicRequest,
    triggerRaffle,
    triggerSurpriseChallenge,
    clearChallenge,
    triggerAnnouncement
  };
}
