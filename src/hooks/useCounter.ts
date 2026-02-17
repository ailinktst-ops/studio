
"use client";

import { useEffect, useCallback, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export interface Participant {
  id: string;
  name: string;
  count: number;
  category: string;
  imageUrl?: string;
  status: 'pending' | 'approved';
}

export interface AdminUser {
  username: string;
  password: string;
}

export interface ElegantMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface PointRequest {
  id: string;
  participantId: string;
  participantName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface SocialLink {
  id: string;
  type: 'instagram' | 'youtube';
  url: string;
}

export interface Joke {
  id: string;
  name: string;
  audioUrl: string;
  imageUrl?: string;
  timestamp: number;
}

export interface RaffleState {
  isRaffling: boolean;
  winnerId: string | null;
  candidates: string[];
  startTime: number | null;
  winnersHistory: string[];
}

export interface PiadinhaState {
  activeJokeId?: string | null; 
  isActive: boolean;
  timestamp: number | null;
}

export interface AnnouncementState {
  message: string;
  isActive: boolean;
  timestamp: number | null;
}

export interface SocialAnnouncementState {
  type: 'instagram' | 'youtube' | null;
  url: string;
  isActive: boolean;
  timestamp: number | null;
}

export interface LastWinnerState {
  name: string;
  count: number;
  imageUrl?: string;
}

export interface RankingItem {
  name: string;
  count: number;
  imageUrl?: string;
}

export interface CounterState {
  id: string;
  title: string;
  brandName: string;
  brandIcon: string;
  brandImageUrl?: string;
  admins: AdminUser[];
  socialLinks: SocialLink[];
  participants: Participant[];
  messages: ElegantMessage[];
  pointRequests: PointRequest[];
  jokes: Joke[];
  categories: string[];
  customPhrases: string[];
  updatedAt: any;
  raffle?: RaffleState;
  challenge?: RaffleState;
  activeMessageId?: string | null;
  piadinha?: PiadinhaState;
  announcement?: AnnouncementState;
  socialAnnouncement?: SocialAnnouncementState;
  lastWinner?: LastWinnerState | null;
  previousRanking?: RankingItem[];
}

const DEFAULT_ID = "current";
const VALID_CATEGORIES = ["Gole", "Passa ou Repassa"];

const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "RANKING DE CONSUMO",
  brandName: "RankUp Counter",
  brandIcon: "Beer",
  brandImageUrl: "",
  admins: [
    { username: "Cupula", password: "b1250" }
  ],
  socialLinks: [],
  participants: [],
  messages: [],
  pointRequests: [],
  jokes: [],
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
    winnersHistory: []
  },
  challenge: {
    isRaffling: false,
    winnerId: null,
    candidates: [],
    startTime: null,
    winnersHistory: []
  },
  activeMessageId: null,
  piadinha: {
    isActive: false,
    timestamp: null
  },
  announcement: {
    message: "",
    isActive: false,
    timestamp: null
  },
  socialAnnouncement: {
    type: null,
    url: "",
    isActive: false,
    timestamp: null
  },
  lastWinner: null,
  previousRanking: []
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
    const sanitize = (cat: string) => {
      return VALID_CATEGORIES.includes(cat) ? cat : "Gole";
    };
    
    return {
      ...DEFAULT_STATE,
      id: DEFAULT_ID,
      ...state,
      categories: VALID_CATEGORIES,
      admins: (state.admins && state.admins.length > 0) ? state.admins : DEFAULT_STATE.admins,
      socialLinks: state.socialLinks || [],
      participants: (state.participants || []).map(p => ({
        ...p,
        category: sanitize(p.category)
      })),
      messages: state.messages || [],
      pointRequests: state.pointRequests || [],
      jokes: state.jokes || [],
      customPhrases: (state.customPhrases && state.customPhrases.length > 0) 
        ? state.customPhrases 
        : DEFAULT_STATE.customPhrases,
      raffle: {
        ...DEFAULT_STATE.raffle!,
        ...(state.raffle || {}),
        winnersHistory: state.raffle?.winnersHistory || []
      },
      challenge: {
        ...DEFAULT_STATE.challenge!,
        ...(state.challenge || {}),
        winnersHistory: state.challenge?.winnersHistory || []
      },
      activeMessageId: state.activeMessageId || null,
      piadinha: {
        ...DEFAULT_STATE.piadinha!,
        ...(state.piadinha || {})
      },
      announcement: {
        ...DEFAULT_STATE.announcement!,
        ...(state.announcement || {})
      },
      socialAnnouncement: {
        ...DEFAULT_STATE.socialAnnouncement!,
        ...(state.socialAnnouncement || {})
      },
      lastWinner: state.lastWinner || null,
      previousRanking: state.previousRanking || []
    } as CounterState;
  };

  const data = cleanData(rawData || {});
  const jokes = useMemo(() => data.jokes || [], [data.jokes]);

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

  const updateDocField = useCallback((fields: Partial<CounterState>) => {
    if (!counterRef || !user || isUserLoading) {
      return;
    }
    
    setDoc(counterRef, { 
      ...fields,
      updatedAt: Timestamp.now() 
    }, { merge: true }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: fields
      } satisfies SecurityRuleContext));
    });
  }, [counterRef, user, isUserLoading]);

  const updateTitle = useCallback((title: string) => updateDocField({ title }), [updateDocField]);
  const updateBrand = useCallback((brandName: string, brandIcon: string) => updateDocField({ brandName, brandIcon }), [updateDocField]);
  const updateBrandImage = useCallback((brandImageUrl: string) => updateDocField({ brandImageUrl }), [updateDocField]);
  const updatePhrases = useCallback((customPhrases: string[]) => updateDocField({ customPhrases }), [updateDocField]);
  const updateSocialLinks = useCallback((socialLinks: SocialLink[]) => updateDocField({ socialLinks }), [updateDocField]);
  
  const clearPiadinha = useCallback(() => {
    updateDocField({ 
      piadinha: { 
        isActive: false, 
        timestamp: Timestamp.now().toMillis(),
        activeJokeId: null
      } 
    });
  }, [updateDocField]);

  const addAdmin = (admin: AdminUser) => {
    if (!counterRef || !data) return;
    const exists = data.admins.some(a => a.username === admin.username);
    if (exists) return false;
    
    updateDocField({
      admins: [...data.admins, admin]
    });
    return true;
  };

  const updateAdmin = (oldUsername: string, updatedAdmin: AdminUser) => {
    if (!counterRef || !data) return false;
    const updatedAdmins = data.admins.map(a => a.username === oldUsername ? updatedAdmin : a);
    updateDocField({
      admins: updatedAdmins
    });
    return true;
  };

  const removeAdmin = (username: string) => {
    if (!counterRef || !data) return;
    const updatedAdmins = data.admins.filter(a => a.username !== username);
    updateDocField({
      admins: updatedAdmins
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
    
    updateDocField({
      participants: [...(data?.participants || []), newParticipant]
    });
    return true;
  };

  const submitJoke = (audioUrl: string, name: string, imageUrl?: string) => {
    const newJoke: Joke = {
      id: Math.random().toString(36).substring(2, 11),
      name: name || `Meme ${Date.now().toString().slice(-4)}`,
      audioUrl,
      imageUrl: imageUrl || "",
      timestamp: Timestamp.now().toMillis()
    };
    // LIMITE EXTREMO: Reduzido para 3 memes para estabilidade máxima do documento de 1MB
    const updatedJokes = [...data.jokes, newJoke].slice(-3);
    updateDocField({
      jokes: updatedJokes
    });
  };

  const updateJokeName = (id: string, name: string) => {
    const updatedJokes = data.jokes.map(j => j.id === id ? { ...j, name } : j);
    updateDocField({
      jokes: updatedJokes
    });
  };

  const removeJoke = (id: string) => {
    const updatedJokes = data.jokes.filter(j => j.id !== id);
    updateDocField({
      jokes: updatedJokes
    });
  };

  const triggerPiadinha = useCallback((joke: Joke) => {
    updateDocField({
      piadinha: {
        activeJokeId: joke.id,
        isActive: true,
        timestamp: Timestamp.now().toMillis()
      }
    });

    setTimeout(() => {
      clearPiadinha();
    }, 30000);
  }, [updateDocField, clearPiadinha]);

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
    updateDocField({
      participants: updatedParticipants
    });
  };

  const updateParticipantCategory = (id: string, category: string) => {
    if (!counterRef || !data) return;
    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "Gole";
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, category: finalCategory } : p
    );
    updateDocField({
      participants: updatedParticipants
    });
  };

  const updateParticipantImage = (id: string, imageUrl: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, imageUrl } : p
    );
    updateDocField({
      participants: updatedParticipants
    });
  };

  const incrementCount = (id: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, count: p.count + 1 } : p
    );
    updateDocField({
      participants: updatedParticipants
    });
  };

  const decrementCount = (id: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, count: Math.max(0, p.count - 1) } : p
    );
    updateDocField({
      participants: updatedParticipants
    });
  };

  const updateParticipantCount = (id: string, count: number) => {
    if (!counterRef || !data) return;
    const finalCount = Math.max(0, count);
    const updatedParticipants = data.participants.map(p => 
      p.id === id ? { ...p, count: finalCount } : p
    );
    updateDocField({
      participants: updatedParticipants
    });
  };

  const resetAll = () => {
    if (!counterRef) return;
    const resetData = {
      participants: [],
      messages: [],
      pointRequests: [],
      jokes: [],
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null, winnersHistory: [] },
      challenge: { isRaffling: false, winnerId: null, candidates: [], startTime: null, winnersHistory: [] },
      activeMessageId: null,
      announcement: { message: "", isActive: false, timestamp: null },
      socialAnnouncement: { type: null, url: "", isActive: false, timestamp: null },
      piadinha: { imageUrl: "", isActive: false, timestamp: null, activeJokeId: null },
      lastWinner: null,
      previousRanking: []
    };
    updateDocField(resetData);
  };

  const resetOnlyPoints = () => {
    if (!counterRef || !data) return;
    
    const approvedParticipants = data.participants.filter(p => p.status === 'approved');
    const sorted = [...approvedParticipants].sort((a, b) => b.count - a.count);
    const leader = sorted[0] && sorted[0].count > 0 ? sorted[0] : null;

    const previousRanking = sorted
      .filter(p => p.count > 0)
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        count: p.count,
        imageUrl: p.imageUrl || ""
      }));

    const resetParticipants = data.participants.map(p => ({ ...p, count: 0 }));
    
    updateDocField({
      participants: resetParticipants,
      lastWinner: leader ? {
        name: leader.name,
        count: leader.count,
        imageUrl: leader.imageUrl || ""
      } : null,
      previousRanking: previousRanking
    });
  };

  const clearLastWinner = () => {
    updateDocField({ lastWinner: null, previousRanking: [] });
  };

  const removeParticipant = (id: string) => {
    if (!counterRef || !data) return;
    const updatedParticipants = data.participants.filter(p => p.id !== id);
    updateDocField({
      participants: updatedParticipants
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
      timestamp: Timestamp.now().toMillis()
    };
    // Espaço otimizado: O correio agora mantém apenas a mensagem mais recente
    updateDocField({
      messages: [newMessage],
      activeMessageId: null
    });
  };

  const moderateMessage = (id: string, status: 'approved' | 'rejected') => {
    if (!counterRef || !data) return;
    const updatedMessages = data.messages.map(m => 
      m.id === id ? { ...m, status } : m
    );
    const updatePayload: any = {
      messages: updatedMessages
    };
    if (status === 'approved') {
      updatePayload.activeMessageId = id;
    } else {
      updatePayload.activeMessageId = null;
    }
    updateDocField(updatePayload);
  };

  const clearActiveMessage = () => {
    if (!counterRef) return;
    updateDocField({ activeMessageId: null });
  };

  const sendPointRequest = (participantId: string, participantName: string) => {
    if (!counterRef) return;
    const newRequest: PointRequest = {
      id: Math.random().toString(36).substring(2, 11),
      participantId,
      participantName,
      status: 'pending',
      timestamp: Timestamp.now().toMillis()
    };
    // Espaço aumentado para pedidos de pontos (fila de até 15 itens)
    const updatedRequests = [...(data?.pointRequests || []), newRequest].slice(-15);
    updateDocField({
      pointRequests: updatedRequests
    });
  };

  const moderatePointRequest = (id: string, status: 'approved' | 'rejected') => {
    if (!counterRef || !data) return;
    
    const request = data.pointRequests.find(r => r.id === id);
    if (!request) return;

    const updatedRequests = data.pointRequests.filter(r => r.id !== id);
    
    if (status === 'approved') {
      const updatedParticipants = data.participants.map(p => 
        p.id === request.participantId ? { ...p, count: p.count + 1 } : p
      );
      updateDocField({
        pointRequests: updatedRequests,
        participants: updatedParticipants
      });
    } else {
      updateDocField({
        pointRequests: updatedRequests
      });
    }
  };

  const triggerRaffle = () => {
    if (!counterRef || !data) return;
    const approvedParticipants = data.participants.filter(p => p.status === 'approved');
    if (approvedParticipants.length < 1) return;

    let winnersHistory = data.raffle?.winnersHistory || [];
    let pool = approvedParticipants.filter(p => !winnersHistory.includes(p.id));

    if (pool.length === 0) {
      winnersHistory = [];
      pool = approvedParticipants;
    }

    const winner = pool[Math.floor(Math.random() * pool.length)];
    const newHistory = [...winnersHistory, winner.id];
    
    let animPool: string[] = [];
    for(let j = 0; j < 10; j++) {
      animPool = [...animPool, ...approvedParticipants.map(p => p.name)];
    }
    const candidates = animPool.sort(() => Math.random() - 0.5);

    const newRaffleState = {
      isRaffling: true,
      winnerId: winner.id,
      candidates: candidates,
      startTime: Timestamp.now().toMillis(),
      winnersHistory: newHistory
    };

    updateDocField({ raffle: newRaffleState });
    
    setTimeout(() => {
      setDoc(counterRef, { 
        raffle: { ...newRaffleState, isRaffling: false },
        updatedAt: Timestamp.now() 
      }, { merge: true });
    }, 5500);
  };

  const triggerSurpriseChallenge = () => {
    if (!counterRef || !data) return;
    const approvedParticipants = data.participants.filter(p => p.status === 'approved');
    if (approvedParticipants.length < 1) return;

    let winnersHistory = data.challenge?.winnersHistory || [];
    let pool = approvedParticipants.filter(p => !winnersHistory.includes(p.id));

    if (pool.length === 0) {
      winnersHistory = [];
      pool = approvedParticipants;
    }

    const winner = pool[Math.floor(Math.random() * pool.length)];
    const newHistory = [...winnersHistory, winner.id];
    
    let animPool: string[] = [];
    for(let j = 0; j < 10; j++) {
      animPool = [...animPool, ...approvedParticipants.map(p => p.name)];
    }
    const candidates = animPool.sort(() => Math.random() - 0.5);

    const newChallengeState = {
      isRaffling: true,
      winnerId: winner.id,
      candidates: candidates,
      startTime: Timestamp.now().toMillis(),
      winnersHistory: newHistory
    };

    updateDocField({ challenge: newChallengeState });

    setTimeout(() => {
      setDoc(counterRef, { 
        challenge: { ...newChallengeState, isRaffling: false },
        updatedAt: Timestamp.now() 
      }, { merge: true });
    }, 5500);
  };

  const clearRaffle = () => {
    if (!counterRef || !data.raffle) return;
    updateDocField({ raffle: { ...data.raffle, winnerId: null } });
  };

  const clearChallenge = () => {
    if (!counterRef || !data.challenge) return;
    updateDocField({ challenge: { ...data.challenge, winnerId: null } });
  };

  const resetRaffleHistory = () => {
    if (!counterRef || !data.raffle) return;
    updateDocField({ raffle: { ...data.raffle, winnersHistory: [] } });
  };

  const resetChallengeHistory = () => {
    if (!counterRef || !data.challenge) return;
    updateDocField({ challenge: { ...data.challenge, winnersHistory: [] } });
  };

  const triggerAnnouncement = (message: string) => {
    if (!counterRef || !message.trim()) return;
    updateDocField({
      announcement: {
        message: message.trim(),
        isActive: true,
        timestamp: Timestamp.now().toMillis()
      }
    });
    setTimeout(() => updateDocField({ announcement: { ...data.announcement!, isActive: false } }), 8000);
  };

  const triggerSocialAnnouncement = (type: 'instagram' | 'youtube', url: string) => {
    if (!counterRef || !url) return;
    updateDocField({
      socialAnnouncement: {
        type,
        url,
        isActive: true,
        timestamp: Timestamp.now().toMillis()
      }
    });
    setTimeout(() => updateDocField({ socialAnnouncement: { ...data.socialAnnouncement!, isActive: false } }), 10000);
  };

  return {
    data,
    jokes,
    loading: isLoading,
    isInitializing: isDocLoading && !rawData,
    updateTitle,
    updateBrand,
    updateBrandImage,
    updatePhrases,
    updateSocialLinks,
    addAdmin,
    updateAdmin,
    removeAdmin,
    addParticipant,
    moderateParticipant,
    updateParticipantCategory,
    updateParticipantImage,
    incrementCount,
    decrementCount,
    updateParticipantCount,
    resetAll,
    resetOnlyPoints,
    clearLastWinner,
    removeParticipant,
    sendElegantMessage,
    moderateMessage,
    clearActiveMessage,
    sendPointRequest,
    moderatePointRequest,
    triggerRaffle,
    triggerSurpriseChallenge,
    clearRaffle,
    clearChallenge,
    resetRaffleHistory,
    resetChallengeHistory,
    triggerAnnouncement,
    triggerSocialAnnouncement,
    submitJoke,
    updateJokeName,
    removeJoke,
    triggerPiadinha,
    clearPiadinha
  };
}
