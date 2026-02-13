
"use client";

import { useEffect } from 'react';
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

export interface MusicRequest {
  id: string;
  artist: string;
  song: string;
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
  audioUrl?: string;
  imageUrl?: string;
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
  musicRequests: MusicRequest[];
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
}

const DEFAULT_ID = "current";
const VALID_CATEGORIES = ["Gole", "Passa ou Repassa"];

const DEFAULT_STATE: Omit<CounterState, 'id'> = {
  title: "RANKING DE CONSUMO",
  brandName: "RankUp Counter",
  brandIcon: "Beer",
  brandImageUrl: "",
  admins: [],
  socialLinks: [],
  participants: [],
  messages: [],
  musicRequests: [],
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
    audioUrl: "",
    imageUrl: "",
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
    const sanitize = (cat: string) => {
      return VALID_CATEGORIES.includes(cat) ? cat : "Gole";
    };
    
    return {
      ...DEFAULT_STATE,
      id: DEFAULT_ID,
      ...state,
      categories: VALID_CATEGORIES,
      admins: state.admins || [],
      socialLinks: state.socialLinks || [],
      participants: (state.participants || []).map(p => ({
        ...p,
        category: sanitize(p.category)
      })),
      messages: state.messages || [],
      musicRequests: state.musicRequests || [],
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

  const addAdmin = (admin: AdminUser) => {
    if (!counterRef || !data) return;
    const exists = data.admins.some(a => a.username === admin.username);
    if (exists) return false;
    
    updateDoc(counterRef, {
      admins: [...data.admins, admin],
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { admins: [...data.admins, admin] }
      }));
    });
    return true;
  };

  const updateAdmin = (oldUsername: string, updatedAdmin: AdminUser) => {
    if (!counterRef || !data) return false;
    const updatedAdmins = data.admins.map(a => a.username === oldUsername ? updatedAdmin : a);
    updateDoc(counterRef, {
      admins: updatedAdmins,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { admins: updatedAdmins }
      }));
    });
    return true;
  };

  const removeAdmin = (username: string) => {
    if (!counterRef || !data) return;
    const updatedAdmins = data.admins.filter(a => a.username !== username);
    updateDoc(counterRef, {
      admins: updatedAdmins,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { admins: updatedAdmins }
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

  const submitJoke = (audioUrl: string, imageUrl?: string) => {
    if (!counterRef || !data) return;
    const newJoke: Joke = {
      id: Math.random().toString(36).substring(2, 11),
      audioUrl,
      imageUrl,
      timestamp: Date.now()
    };
    updateDoc(counterRef, {
      jokes: [...(data.jokes || []), newJoke],
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { jokes: [...(data.jokes || []), newJoke] }
      }));
    });
  };

  const removeJoke = (id: string) => {
    if (!counterRef || !data) return;
    const updatedJokes = data.jokes.filter(j => j.id !== id);
    updateDoc(counterRef, {
      jokes: updatedJokes,
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { jokes: updatedJokes }
      }));
    });
  };

  const triggerPiadinha = (joke: Joke) => {
    if (!counterRef || !joke.audioUrl) return;
    updateDoc(counterRef, {
      piadinha: {
        audioUrl: joke.audioUrl,
        imageUrl: joke.imageUrl || "",
        isActive: true,
        timestamp: Date.now()
      }
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { piadinha: { audioUrl: joke.audioUrl, imageUrl: joke.imageUrl || "", isActive: true, timestamp: Date.now() } }
      }));
    });
    setTimeout(() => updateDoc(counterRef, { "piadinha.isActive": false }), 30000);
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
      jokes: [],
      updatedAt: Timestamp.now(),
      raffle: { isRaffling: false, winnerId: null, candidates: [], startTime: null, winnersHistory: [] },
      challenge: { isRaffling: false, winnerId: null, candidates: [], startTime: null, winnersHistory: [] },
      activeMessageId: null,
      announcement: { message: "", isActive: false, timestamp: null },
      socialAnnouncement: { type: null, url: "", isActive: false, timestamp: null },
      piadinha: { audioUrl: "", imageUrl: "", isActive: false, timestamp: null }
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
    const updatePayload: any = {
      messages: updatedMessages,
      updatedAt: Timestamp.now()
    };
    if (status === 'approved') {
      updatePayload.activeMessageId = id;
    }
    updateDoc(counterRef, updatePayload).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: updatePayload
      }));
    });
  };

  const clearActiveMessage = () => {
    if (!counterRef) return;
    updateDoc(counterRef, { activeMessageId: null }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { activeMessageId: null }
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
    
    const updatedRequests = data.musicRequests.map(m => 
      m.id === id ? { ...m, status } : m
    );

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

    updateDoc(counterRef, {
      raffle: {
        isRaffling: true,
        winnerId: winner.id,
        candidates: candidates,
        startTime: Date.now(),
        winnersHistory: newHistory
      }
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { raffle: { isRaffling: true, winnerId: winner.id, candidates, startTime: Date.now(), winnersHistory: newHistory } }
      }));
    });
    
    setTimeout(() => {
      updateDoc(counterRef, { "raffle.isRaffling": false });
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

    updateDoc(counterRef, {
      challenge: {
        isRaffling: true,
        winnerId: winner.id,
        candidates: candidates,
        startTime: Date.now(),
        winnersHistory: newHistory
      }
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { challenge: { isRaffling: true, winnerId: winner.id, candidates, startTime: Date.now(), winnersHistory: newHistory } }
      }));
    });

    setTimeout(() => {
      updateDoc(counterRef, { "challenge.isRaffling": false });
    }, 5500);
  };

  const clearRaffle = () => {
    if (!counterRef) return;
    updateDoc(counterRef, { "raffle.winnerId": null }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { "raffle.winnerId": null }
      }));
    });
  };

  const clearChallenge = () => {
    if (!counterRef) return;
    updateDoc(counterRef, { "challenge.winnerId": null }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { "challenge.winnerId": null }
      }));
    });
  };

  const resetRaffleHistory = () => {
    if (!counterRef) return;
    updateDoc(counterRef, {
      "raffle.winnersHistory": [],
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { "raffle.winnersHistory": [] }
      }));
    });
  };

  const resetChallengeHistory = () => {
    if (!counterRef) return;
    updateDoc(counterRef, {
      "challenge.winnersHistory": [],
      updatedAt: Timestamp.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { "challenge.winnersHistory": [] }
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

  const triggerSocialAnnouncement = (type: 'instagram' | 'youtube', url: string) => {
    if (!counterRef || !url) return;
    updateDoc(counterRef, {
      socialAnnouncement: {
        type,
        url,
        isActive: true,
        timestamp: Date.now()
      }
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: counterRef.path,
        operation: 'update',
        requestResourceData: { socialAnnouncement: { type, url, isActive: true, timestamp: Date.now() } }
      }));
    });
    setTimeout(() => updateDoc(counterRef, { "socialAnnouncement.isActive": false }), 10000);
  };

  const updateSocialLinks = (socialLinks: SocialLink[]) => {
    updateDocField({ socialLinks });
  };

  const clearPiadinha = () => {
    updateDocField({ "piadinha.isActive": false });
  };

  return {
    data,
    loading: isLoading,
    isInitializing: isDocLoading && !rawData,
    updateTitle: (title: string) => updateDocField({ title }),
    updateBrand: (brandName: string, brandIcon: string) => updateDocField({ brandName, brandIcon }),
    updateBrandImage: (brandImageUrl: string) => updateDocField({ brandImageUrl }),
    updatePhrases: (customPhrases: string[]) => updateDocField({ customPhrases }),
    updateSocialLinks,
    addAdmin,
    updateAdmin,
    removeAdmin,
    addParticipant,
    moderateParticipant,
    updateParticipantCategory,
    updateParticipantImage,
    incrementCount,
    resetAll,
    resetOnlyPoints,
    removeParticipant,
    sendElegantMessage,
    moderateMessage,
    clearActiveMessage,
    sendMusicRequest,
    moderateMusic,
    removeMusicRequest,
    triggerRaffle,
    triggerSurpriseChallenge,
    clearRaffle,
    clearChallenge,
    resetRaffleHistory,
    resetChallengeHistory,
    triggerAnnouncement,
    triggerSocialAnnouncement,
    submitJoke,
    removeJoke,
    triggerPiadinha,
    clearPiadinha
  };
}
