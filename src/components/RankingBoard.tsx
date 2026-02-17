"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useCounter, Participant } from '@/hooks/useCounter';
import { 
  Trophy, Loader2, 
  Beer, Wine, CupSoda, GlassWater, Music, Pizza, Zap,
  Heart, Disc, Instagram, Youtube, Mic, ListOrdered, AlertCircle,
  Megaphone
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Beer, Wine, CupSoda, GlassWater, Trophy, Music, Pizza
};

const SOUND_URLS = {
  point: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  leader: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  challenge: 'https://assets.mixkit.co/active_storage/sfx/950/950-preview.mp3',
  announcement: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  heart: 'https://assets.mixkit.co/active_storage/sfx/1360/1360-preview.mp3',
  social: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};

export function RankingBoard({ overlay = false }: { overlay?: boolean }) {
  const { data, isInitializing, clearPiadinha } = useCounter();
  const [currentRaffleName, setCurrentRaffleName] = useState("");
  const [currentChallengeName, setCurrentChallengeName] = useState("");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [sideListOffset, setSideListOffset] = useState(0);
  const [qrCorreioUrl, setQrCorreioUrl] = useState("");
  const [qrCadastroUrl, setQrCadastroUrl] = useState("");
  const [qrPontoUrl, setQrPontoUrl] = useState("");
  
  const [viewMode, setViewMode] = useState<'PODIUM' | 'INDIVIDUAL'>('PODIUM');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isAudioStarted, setIsAudioStarted] = useState(true);
  
  const [rafflePhase, setRafflePhase] = useState<'hidden' | 'center' | 'docked'>('hidden');
  const [challengePhase, setChallengePhase] = useState<'hidden' | 'center' | 'docked'>('hidden');
  const [correioPhase, setCorreioPhase] = useState<'hidden' | 'center' | 'docked'>('hidden');

  const [notification, setNotification] = useState<{ 
    userName: string; 
    count: number; 
    type: 'point' | 'leader' | 'lantern';
    title?: string;
    imageUrl?: string;
  } | null>(null);

  const [prevRankingIndex, setPrevRankingIndex] = useState(0);
  
  const lastParticipantsRef = useRef<Participant[]>([]);
  const lastLeaderIdRef = useRef<string | null>(null);
  const lastLanternIdRef = useRef<string | null>(null);
  const lastSocialAnnouncementRef = useRef<number | null>(null);
  const lastPiadinhaTimestampRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastRaffleIdRef = useRef<string | null>(null);
  const lastChallengeIdRef = useRef<string | null>(null);
  const lastAnnouncementTimestampRef = useRef<number | null>(null);
  
  const challengeAudioRef = useRef<HTMLAudioElement | null>(null);
  const piadinhaAudioRef = useRef<HTMLAudioElement | null>(null);

  const raffleAnimationIndexRef = useRef(0);
  const challengeAnimationIndexRef = useRef(0);
  const isRafflingPersistedRef = useRef(false);
  const isChallengingPersistedRef = useRef(false);

  const CustomIcon = ICON_MAP[data.brandIcon] || Beer;
  const brandImageUrl = data.brandImageUrl || "";

  const getParticipantAvatar = (p: Participant | any) => {
    if (p?.imageUrl) return p.imageUrl;
    const seed = p?.id || p?.name || "guest";
    return `https://picsum.photos/seed/${seed}-character-human-face-portrait-anime-movie/250/250`;
  };

  const playSound = (type: keyof typeof SOUND_URLS) => {
    if (!isAudioStarted) return;
    const audio = new Audio(SOUND_URLS[type]);
    if (type === 'challenge') {
      audio.loop = true;
      challengeAudioRef.current = audio;
    }
    audio.play().catch(() => {});
  };

  const stopChallengeSound = () => {
    if (challengeAudioRef.current) {
      challengeAudioRef.current.pause();
      challengeAudioRef.current = null;
    }
  };

  const formatUrlWithCorrectPort = (path: string) => {
    if (typeof window === 'undefined') return path;
    let origin = window.location.origin;
    if (origin.includes("cloudworkstations.dev")) {
      origin = origin.replace(/https?:\/\/(\d+)-/, (match, port) => match.replace(port, '9000'));
    } else if (origin.includes("localhost")) {
      origin = "http://localhost:9000";
    }
    return `${origin}${path}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = formatUrlWithCorrectPort('');
      setQrCorreioUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/correio')}`);
      setQrCadastroUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/cadastro')}`);
      setQrPontoUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/pedir-ponto')}`);
    }
  }, []);

  const approvedParticipants = useMemo(() => 
    (data.participants || []).filter(p => p.status === 'approved'), 
    [data.participants]
  );

  const hasPoints = useMemo(() => approvedParticipants.some(p => p.count > 0), [approvedParticipants]);

  const sortedParticipants = useMemo(() => {
    return [...approvedParticipants].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const indexA = data.participants.findIndex(p => p.id === a.id);
      const indexB = data.participants.findIndex(p => p.id === b.id);
      return indexA - indexB;
    });
  }, [approvedParticipants, data.participants]);

  const currentLantern = useMemo(() => {
    const activeParticipants = sortedParticipants.filter(p => p.count > 0);
    if (activeParticipants.length >= 4) {
      return activeParticipants[activeParticipants.length - 1];
    }
    return null;
  }, [sortedParticipants]);

  useEffect(() => {
    if (!overlay || !hasPoints) {
      setViewMode('PODIUM');
      setHighlightIndex(-1);
      return;
    }

    if (viewMode === 'PODIUM') {
      const timer = setTimeout(() => {
        setViewMode('INDIVIDUAL');
        setHighlightIndex(0);
      }, 25000); 
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (highlightIndex < sortedParticipants.length - 1) {
          setHighlightIndex(prev => prev + 1);
        } else {
          setViewMode('PODIUM');
          setHighlightIndex(-1);
        }
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [overlay, hasPoints, viewMode, highlightIndex, sortedParticipants.length]);

  useEffect(() => {
    if (!overlay || approvedParticipants.length === 0 || hasPoints) return;
    const interval = setInterval(() => {
      setRotatingIndex(prev => (prev + 1) % approvedParticipants.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [overlay, approvedParticipants.length, hasPoints]);

  useEffect(() => {
    if (!overlay || approvedParticipants.length === 0) return;
    const currentLeader = sortedParticipants[0];
    if (lastParticipantsRef.current.length === 0) {
      lastParticipantsRef.current = approvedParticipants;
      lastLeaderIdRef.current = currentLeader?.id || null;
      lastLanternIdRef.current = currentLantern?.id || null;
      return;
    }
    const prev = lastParticipantsRef.current;
    const current = approvedParticipants;
    const updatedUser = current.find(p => {
      const prevP = prev.find(pp => pp.id === p.id);
      return prevP && p.count > prevP.count;
    });
    
    if (currentLeader && lastLeaderIdRef.current && currentLeader.id !== lastLeaderIdRef.current && currentLeader.count > 0) {
      playSound('leader');
      setNotification({ 
        userName: currentLeader.name, 
        count: currentLeader.count, 
        type: 'leader', 
        title: "NOVO LÍDER!",
        imageUrl: getParticipantAvatar(currentLeader)
      });
      lastLeaderIdRef.current = currentLeader.id;
      setTimeout(() => setNotification(null), 5000);
    } 
    else if (currentLantern && lastLanternIdRef.current && currentLantern.id !== lastLanternIdRef.current) {
      playSound('announcement');
      setNotification({ 
        userName: currentLantern.name, 
        count: currentLantern.count, 
        type: 'lantern', 
        title: "NOVO LANTERNINHA! 🤡",
        imageUrl: getParticipantAvatar(currentLantern)
      });
      lastLanternIdRef.current = currentLantern.id;
      setTimeout(() => setNotification(null), 5000);
    }
    else if (updatedUser) {
      playSound('point');
      setNotification({ 
        userName: updatedUser.name, 
        count: updatedUser.count, 
        type: 'point', 
        title: "",
        imageUrl: getParticipantAvatar(updatedUser)
      });
      setTimeout(() => setNotification(null), 4000);
    }
    lastParticipantsRef.current = current;
  }, [approvedParticipants, overlay, sortedParticipants, currentLantern, isAudioStarted]);

  useEffect(() => {
    if (overlay && data.activeMessageId && data.activeMessageId !== lastMessageIdRef.current) {
      playSound('heart');
      setCorreioPhase('center');
      lastMessageIdRef.current = data.activeMessageId;
      setTimeout(() => setCorreioPhase('docked'), 6000);
    } else if (!data.activeMessageId) {
      setCorreioPhase('hidden');
    }
  }, [data.activeMessageId, overlay, isAudioStarted]);

  useEffect(() => {
    if (overlay && data.raffle?.winnerId && data.raffle.winnerId !== lastRaffleIdRef.current) {
      setRafflePhase('center');
      lastRaffleIdRef.current = data.raffle.winnerId;
      setTimeout(() => setRafflePhase('docked'), 6000);
    } else if (!data.raffle?.winnerId) {
      setRafflePhase('hidden');
    }
  }, [data.raffle?.winnerId, overlay]);

  useEffect(() => {
    if (overlay && data.challenge?.winnerId && data.challenge.winnerId !== lastChallengeIdRef.current) {
      setChallengePhase('center');
      lastChallengeIdRef.current = data.challenge.winnerId;
      setTimeout(() => setChallengePhase('docked'), 6000);
    } else if (!data.challenge?.winnerId) {
      setChallengePhase('hidden');
    }
  }, [data.challenge?.winnerId, overlay]);

  useEffect(() => {
    if (overlay && data.socialAnnouncement?.isActive && data.socialAnnouncement.timestamp !== lastSocialAnnouncementRef.current) {
      playSound('social');
      lastSocialAnnouncementRef.current = data.socialAnnouncement.timestamp;
    }
  }, [data.socialAnnouncement, overlay, isAudioStarted]);

  useEffect(() => {
    if (overlay && data.announcement?.isActive && data.announcement.timestamp !== lastAnnouncementTimestampRef.current) {
      playSound('announcement');
      lastAnnouncementTimestampRef.current = data.announcement.timestamp;
    }
  }, [data.announcement, overlay, isAudioStarted]);

  useEffect(() => {
    if (overlay && isAudioStarted && data.piadinha?.isActive && data.piadinha.timestamp !== lastPiadinhaTimestampRef.current && data.piadinha.audioUrl) {
      if (piadinhaAudioRef.current) {
        piadinhaAudioRef.current.pause();
        piadinhaAudioRef.current = null;
      }
      
      const audio = new Audio(data.piadinha.audioUrl);
      piadinhaAudioRef.current = audio;
      lastPiadinhaTimestampRef.current = data.piadinha.timestamp;

      audio.play().catch(() => {
        setTimeout(() => clearPiadinha(), 5000);
      });

      audio.onended = () => {
        clearPiadinha();
        piadinhaAudioRef.current = null;
      };
    }
  }, [data.piadinha, overlay, clearPiadinha, isAudioStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (data.raffle?.isRaffling) {
      if (!isRafflingPersistedRef.current) {
        isRafflingPersistedRef.current = true;
        raffleAnimationIndexRef.current = 0;
      }
      const candidates = data.raffle.candidates || [];
      if (candidates.length > 0) {
        interval = setInterval(() => {
          raffleAnimationIndexRef.current++;
          setCurrentRaffleName(candidates[raffleAnimationIndexRef.current % candidates.length]);
        }, 100);
      }
    } else {
      isRafflingPersistedRef.current = false;
      const winner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);
      if (winner) setCurrentRaffleName(winner.name);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [data.raffle?.isRaffling, data.raffle?.candidates, approvedParticipants, data.raffle?.winnerId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (data.challenge?.isRaffling) {
      if (!isChallengingPersistedRef.current) {
        isChallengingPersistedRef.current = true;
        challengeAnimationIndexRef.current = 0;
        playSound('challenge');
      }
      const candidates = data.challenge.candidates || [];
      if (candidates.length > 0) {
        interval = setInterval(() => {
          challengeAnimationIndexRef.current++;
          setCurrentChallengeName(candidates[challengeAnimationIndexRef.current % candidates.length]);
        }, 100);
      }
    } else {
      isChallengingPersistedRef.current = false;
      stopChallengeSound();
      const winner = approvedParticipants.find(p => p.id === data.challenge?.winnerId);
      if (winner) setCurrentChallengeName(winner.name);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [data.challenge?.isRaffling, data.challenge?.candidates, approvedParticipants, data.challenge?.winnerId, isAudioStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (overlay) {
      const totalPhrases = (data.customPhrases?.length || 0) + 1;
      interval = setInterval(() => {
        setTickerIndex((prev) => (prev + 1) % totalPhrases);
      }, 6000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [overlay, data.customPhrases]);

  const sideList = useMemo(() => {
    if (!hasPoints) return approvedParticipants;
    return sortedParticipants.slice(3);
  }, [sortedParticipants, approvedParticipants, hasPoints]);
  
  const ITEMS_PER_WINDOW = 30; 
  useEffect(() => {
    if (!overlay || sideList.length <= ITEMS_PER_WINDOW) {
      setSideListOffset(0);
      return;
    }
    const interval = setInterval(() => {
      setSideListOffset(prev => {
        const next = prev + ITEMS_PER_WINDOW;
        return next >= sideList.length ? 0 : next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [overlay, sideList.length]);

  const visibleSideList = useMemo(() => {
    if (!overlay) return sideList;
    return sideList.slice(sideListOffset, sideListOffset + ITEMS_PER_WINDOW);
  }, [overlay, sideList, sideListOffset]);

  const previousRanking = data.previousRanking || [];
  useEffect(() => {
    if (overlay && previousRanking.length > 0) {
      const interval = setInterval(() => {
        setPrevRankingIndex(prev => (prev + 1) % previousRanking.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [overlay, previousRanking.length]);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader2 className="h-20 w-20 text-primary animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest">Sincronizando...</p>
      </div>
    );
  }

  const top3 = sortedParticipants.slice(0, 3);
  const leader = sortedParticipants[0];
  const activeMessage = data.messages.find(m => m.id === data.activeMessageId);
  const raffleWinner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);
  const challengeWinner = approvedParticipants.find(p => p.id === data.challenge?.winnerId);

  const socialHandleText = data.socialAnnouncement?.isActive ? (
    data.socialAnnouncement.url.includes('instagram.com') 
      ? `@${data.socialAnnouncement.url.split('instagram.com/')[1]?.split('/')[0] || 'Social'}`
      : data.socialAnnouncement.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]
  ) : '';

  const currentPrevItem = previousRanking[prevRankingIndex];

  return (
    <div className={cn("flex flex-col items-center w-full relative", overlay ? "bg-transparent min-h-screen p-8 overflow-hidden" : "p-8 max-w-6xl mx-auto space-y-12")}>
      
      {overlay && brandImageUrl && (
        <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
          <img src={brandImageUrl} alt="Watermark" className="w-[80vw] h-[80vh] object-contain grayscale blur-[2px] scale-125 rotate-[-15deg]" />
        </div>
      )}

      {overlay && data.announcement?.isActive && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-10 bg-red-600/90 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="flex flex-col items-center gap-12 text-center animate-bounce">
              <Megaphone className="w-32 h-32 text-white" />
              <h2 className="text-8xl font-black italic uppercase text-white tracking-tighter drop-shadow-2xl">
                {data.announcement.message}
              </h2>
           </div>
        </div>
      )}

      {overlay && data.socialAnnouncement?.isActive && (
        <div className="fixed right-8 top-[30%] z-[110] animate-in slide-in-from-right-full duration-700">
          <div className={cn(
            "p-5 rounded-[2.5rem] shadow-2xl border-4 border-white/40 flex flex-col items-center gap-4 text-white w-[180px]",
            data.socialAnnouncement.type === 'instagram' ? "bg-gradient-to-tr from-[#ffdc80] via-[#f56040] via-[#e1306c] to-[#405de6]" : "bg-[#ff0000]"
          )}>
            <div className="bg-white/20 p-2.5 rounded-2xl shadow-lg animate-bounce border-2 border-white/60">
              {data.socialAnnouncement.type === 'instagram' ? <Instagram className="w-8 h-8 text-white" /> : <Youtube className="w-8 h-8 text-white" />}
            </div>
            <div className="text-center w-full px-2">
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1">SIGA NO {data.socialAnnouncement.type?.toUpperCase()}</p>
              <p className="font-black italic uppercase tracking-tighter mb-4 drop-shadow-sm break-all text-xs">
                {socialHandleText}
              </p>
              <div className="p-2.5 bg-white rounded-2xl border border-black/5 shadow-inner">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.socialAnnouncement.url)}`} alt="QR" className="w-full aspect-square" />
              </div>
            </div>
          </div>
        </div>
      )}

      {overlay && data.piadinha?.isActive && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-10 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
           <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
              <div className="relative bg-white/10 p-4 rounded-full border-4 border-orange-500/50 shadow-[0_0_80px_rgba(249,115,22,0.6)]">
                <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-orange-500 bg-black flex items-center justify-center">
                  {data.piadinha.imageUrl ? <img src={data.piadinha.imageUrl} className="w-full h-full object-cover" alt="Meme" /> : <Mic className="w-32 h-32 text-orange-500" />}
                </div>
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-2 rounded-full font-black uppercase italic shadow-lg animate-pulse whitespace-nowrap">
                MEMES AO VIVO!
              </div>
           </div>
        </div>
      )}

      {overlay && activeMessage && correioPhase !== 'hidden' && (
        <div className={cn(
          "transition-all duration-1000 ease-in-out",
          correioPhase === 'center' ? "fixed inset-0 z-[160] flex items-center justify-center" : "fixed left-8 bottom-32 z-[80] max-w-sm"
        )}>
          <div className={cn(
            "bg-correio backdrop-blur-2xl border-2 border-white/20 p-8 rounded-[2rem] shadow-correio-lg transition-all duration-1000",
            correioPhase === 'center' ? "scale-150 rotate-0" : "scale-100 rotate-[-1deg]"
          )}>
            <div className="flex items-center gap-3 mb-4">
               <div className="bg-white/20 p-2 rounded-xl"><Heart className="w-6 h-6 text-white animate-pulse" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Correio Elegante</p>
                  <p className="text-xs font-black text-white italic uppercase">De: {activeMessage.from} ➔ Para: {activeMessage.to}</p>
               </div>
            </div>
            <p className="text-2xl font-black italic text-white uppercase tracking-tighter leading-tight drop-shadow-md">
              &ldquo;{activeMessage.content}&rdquo;
            </p>
          </div>
        </div>
      )}

      {overlay && (data.raffle?.isRaffling || raffleWinner) && rafflePhase !== 'hidden' && (
        <div className={cn(
          "transition-all duration-1000 ease-in-out",
          rafflePhase === 'center' ? "fixed inset-0 z-[160] flex items-center justify-center" : "fixed left-8 top-1/2 -translate-y-1/2 z-[100]"
        )}>
          <div className={cn(
            "px-8 py-6 rounded-[2.5rem] border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4 transition-all duration-1000",
            rafflePhase === 'center' ? "bg-yellow-400 border-white scale-150" : "bg-yellow-500/95 border-yellow-300 text-black rotate-1 scale-100"
          )}>
            <p className="text-xs font-black uppercase tracking-widest opacity-70">Sorteio Geral</p>
            <Avatar className="w-32 h-32 border-4 border-black/20 shadow-xl my-2">
              <AvatarImage src={getParticipantAvatar(data.raffle?.isRaffling ? approvedParticipants.find(p => p.name === currentRaffleName) : raffleWinner)} className="object-cover" />
              <AvatarFallback className="bg-black/10 font-bold">{(data.raffle?.isRaffling ? currentRaffleName : raffleWinner?.name)?.[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-black/10 px-6 py-4 rounded-2xl w-full text-center border-2 border-black/5">
              <span className="text-4xl font-black italic uppercase tracking-tighter">
                {data.raffle?.isRaffling ? currentRaffleName : raffleWinner?.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {overlay && (data.challenge?.isRaffling || challengeWinner) && challengePhase !== 'hidden' && (
        <div className={cn(
          "transition-all duration-1000 ease-in-out",
          challengePhase === 'center' ? "fixed inset-0 z-[160] flex items-center justify-center" : "fixed right-8 top-1/2 -translate-y-1/2 z-[100]"
        )}>
          <div className={cn(
            "px-8 py-6 rounded-[2.5rem] border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4 transition-all duration-1000",
            challengePhase === 'center' ? "bg-purple-500 border-white scale-150" : "bg-purple-600/95 border-purple-300 text-white -rotate-1 scale-100"
          )}>
            <p className="text-xs font-black uppercase tracking-widest opacity-70">Desafio Surpresa!</p>
            <Avatar className="w-32 h-32 border-4 border-white/20 shadow-xl my-2">
              <AvatarImage src={getParticipantAvatar(data.challenge?.isRaffling ? approvedParticipants.find(p => p.name === currentChallengeName) : challengeWinner)} className="object-cover" />
              <AvatarFallback className="bg-white/10 font-bold">{(data.challenge?.isRaffling ? currentChallengeName : challengeWinner?.name)?.[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-black/10 px-6 py-4 rounded-2xl w-full text-center border-2 border-black/5">
              <span className="text-4xl font-black italic uppercase tracking-tighter">
                {data.challenge?.isRaffling ? currentChallengeName : challengeWinner?.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {overlay && (
        <div className="fixed right-8 bottom-32 z-[80] flex flex-col items-end gap-3 animate-in slide-in-from-right-10 duration-700">
          <div className="flex flex-row gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Cadastro</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-secondary/20"><img src={qrCadastroUrl} alt="QR" className="w-24 h-24" /></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Correio</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-correio/20"><img src={qrCorreioUrl} alt="QR" className="w-24 h-24" /></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Pedir Ponto</span>
              <div className="p-2 bg-white rounded-2xl shadow-2xl border-4 border-orange-500/20"><img src={qrPontoUrl} alt="QR" className="w-24 h-24" /></div>
            </div>
          </div>
        </div>
      )}

      {overlay && sideList.length > 0 && (
        <div className="fixed left-8 top-8 z-[70] w-72 space-y-1 animate-in slide-in-from-left-20 duration-1000">
          <h3 className="text-white/40 font-black italic uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2"><ListOrdered className="w-3 h-3" /> Classificação</h3>
          <div className="space-y-0.5 max-h-[90vh] overflow-hidden pr-2">
            {visibleSideList.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-1 px-3 border-l-2 border-white/5 hover:border-primary animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-black text-white/20 w-8">{sortedParticipants.indexOf(p) + 1}º</span>
                  <Avatar className="w-6 h-6 border border-white/10">
                    <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                    <AvatarFallback className="bg-white/5 font-bold uppercase">{p.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-bold text-white/80 uppercase truncate">{p.name}</span>
                </div>
                <span className="text-xs font-black text-primary/60">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {overlay && previousRanking.length > 0 && (
        <div className="fixed right-8 top-8 z-[70] w-64 animate-in slide-in-from-right-20 duration-1000">
          <h3 className="text-white/40 font-black italic uppercase text-[10px] tracking-[0.3em] mb-4 text-right">Rodada Anterior</h3>
          {currentPrevItem && (
            <div key={currentPrevItem.name} className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 animate-in zoom-in fade-in duration-500">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-yellow-500/50">
                  <AvatarImage src={currentPrevItem.imageUrl || `https://picsum.photos/seed/${currentPrevItem.name}/200/200`} className="object-cover" />
                  <AvatarFallback className="font-bold">{currentPrevItem.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {prevRankingIndex + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black italic uppercase text-xs truncate">{currentPrevItem.name}</p>
                <p className="text-yellow-500 font-black text-lg leading-none">{currentPrevItem.count}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {overlay && (
        <div className="flex flex-col items-center gap-4 mt-[-10px] mb-2 animate-in fade-in slide-in-from-top-10 duration-1000">
          {brandImageUrl ? (
            <img src={brandImageUrl} className="w-24 h-24 object-cover rounded-3xl border-4 border-white/10 shadow-2xl rotate-3" alt="Logo" />
          ) : (
            <div className="bg-primary p-4 rounded-3xl shadow-2xl rotate-3">
              <CustomIcon className="w-12 h-12 text-white" />
            </div>
          )}
          <h2 className="text-2xl font-black italic uppercase tracking-[0.3em] text-secondary drop-shadow-md">
            {data.brandName}
          </h2>
        </div>
      )}

      <div className={cn("text-center space-y-4", overlay ? "mb-4 mt-0" : "mb-6")}>
        <h1 className={cn("font-black italic text-white uppercase tracking-tighter drop-shadow-lg", overlay ? "text-5xl" : "text-5xl md:text-6xl")}>{data.title}</h1>
      </div>

      {!hasPoints ? (
        <div className="flex justify-center items-center w-full max-w-6xl mt-8 min-h-[350px]">
          {approvedParticipants.length > 0 ? (
            <div key={approvedParticipants[rotatingIndex]?.id} className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
               <Avatar className="w-80 h-80 border-[12px] border-primary shadow-[0_0_50px_rgba(168,85,247,0.5)] mb-8">
                <AvatarImage src={getParticipantAvatar(approvedParticipants[rotatingIndex])} className="object-cover" />
                <AvatarFallback className="bg-white/10 text-8xl font-black text-white/20">{approvedParticipants[rotatingIndex]?.name[0]}</AvatarFallback>
               </Avatar>
               <h2 className="text-6xl font-black italic text-white uppercase tracking-tighter mb-4 text-center">{approvedParticipants[rotatingIndex]?.name}</h2>
               <p className="text-primary font-black uppercase tracking-[0.3em] text-2xl animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">AGUARDANDO RODADA...</p>
            </div>
          ) : (
            <div className="text-center space-y-4"><Loader2 className="w-12 h-12 text-white/10 animate-spin mx-auto" /></div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-6xl flex justify-center items-center min-h-[400px] mt-8">
          {viewMode === 'PODIUM' ? (
            <div className="flex flex-row justify-center items-end gap-12 w-full animate-in zoom-in fade-in duration-700">
              {[1, 0, 2].map((actualIndex) => {
                const p = top3[actualIndex];
                if (!p) return <div key={actualIndex} className="hidden md:block w-72" />;
                const borderColor = actualIndex === 0 ? "border-yellow-400" : (actualIndex === 1 ? "border-zinc-300" : "border-amber-700");
                const badgeColor = actualIndex === 0 ? "bg-yellow-400 text-black" : (actualIndex === 1 ? "bg-zinc-300 text-black" : "bg-amber-700 text-white");
                
                return (
                  <div key={p.id} className={cn("relative flex flex-col items-center p-8 transition-all duration-500", actualIndex === 0 ? "scale-125 z-20 order-2" : actualIndex === 1 ? "order-1 opacity-80" : "order-3 opacity-80")}>
                    <div className="relative mb-6">
                      <Avatar className={cn("w-40 h-40 border-8 shadow-2xl", borderColor)}>
                        <AvatarImage src={getParticipantAvatar(p)} className="object-cover" data-ai-hint="character portrait" />
                        <AvatarFallback className="bg-white/10 text-4xl font-black text-white/20">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className={cn("absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full w-12 h-12 flex items-center justify-center font-black italic border-2 border-white/20", badgeColor)}>
                        {actualIndex + 1}º
                      </div>
                    </div>
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-2">{p.name}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-6xl font-black text-primary drop-shadow-lg">{p.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center items-center w-full animate-in zoom-in fade-in duration-700">
              {sortedParticipants[highlightIndex] && (
                <div key={sortedParticipants[highlightIndex].id} className="flex flex-col items-center scale-110 transition-transform duration-1000">
                  <div className="relative mb-8">
                    <div className={cn("absolute inset-0 rounded-full blur-[60px] opacity-20 animate-pulse bg-primary")}></div>
                    <Avatar className="w-80 h-80 border-[10px] border-primary/40 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                      <AvatarImage src={getParticipantAvatar(sortedParticipants[highlightIndex])} className="object-cover" />
                      <AvatarFallback className="bg-white/10 text-8xl font-black text-white/20">{highlightIndex !== -1 ? sortedParticipants[highlightIndex]?.name[0] : "?"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-4 -right-4 bg-primary text-white text-2xl w-20 h-20 rounded-full flex items-center justify-center font-black italic border-4 border-white/20 shadow-2xl rotate-12">
                      {highlightIndex + 1}º
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter drop-shadow-2xl">{sortedParticipants[highlightIndex].name}</h2>
                    <div className="flex items-center justify-center gap-4 bg-black/40 backdrop-blur-xl px-10 py-4 rounded-full border-2 border-white/10 shadow-2xl">
                      <span className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] leading-none">{sortedParticipants[highlightIndex].count}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {overlay && notification && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none p-6 animate-in fade-in zoom-in duration-300">
          <div className={cn(
            "relative max-w-5xl w-full p-16 rounded-[5rem] border-8 text-center shadow-[0_0_150px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex flex-col items-center justify-center overflow-hidden transition-all duration-500",
            notification.type === 'leader' ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 border-yellow-200 text-black rotate-1" : (notification.type === 'lantern' ? "bg-gradient-to-br from-red-600 via-red-700 to-red-900 border-red-400 text-white -rotate-1" : "bg-gradient-to-br from-primary via-purple-600 to-indigo-900 border-white/20 text-white rotate-1")
          )}>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <Avatar className="w-64 h-64 border-8 border-white/30 shadow-2xl relative z-10">
                <AvatarImage src={notification.imageUrl} className="object-cover" />
                <AvatarFallback className="bg-white/10 text-6xl font-black">{notification.userName[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                {notification.title && <p className="text-3xl font-black uppercase tracking-[0.5em] opacity-70 italic">{notification.title}</p>}
                <h2 className="text-[10rem] font-black italic uppercase tracking-tighter leading-none">{notification.userName}</h2>
              </div>
              <div className="flex items-center gap-8 bg-black/30 backdrop-blur-2xl px-12 py-6 rounded-full border-4 border-white/10 shadow-2xl">
                <div className="text-[8rem] font-black italic tabular-nums leading-none">{notification.count}</div>
                <div className="bg-white/10 p-4 rounded-full border border-white/10">
                  {notification.type === 'leader' ? <Trophy className="w-16 h-16 text-white animate-pulse" /> : <Beer className="w-16 h-16 text-white animate-pulse" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {overlay && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4">
          <div className="bg-black/60 backdrop-blur-2xl px-12 py-4 rounded-full border border-white/10 flex items-center shadow-2xl min-w-[500px] justify-center overflow-hidden">
            <div className="relative h-6 w-full flex items-center justify-center">
              {data.customPhrases.map((phrase, i) => (
                <div key={i} className={cn("absolute transition-all duration-1000 transform", tickerIndex === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                  <span className="text-white/80 text-sm font-black italic uppercase tracking-[0.2em]">{phrase}</span>
                </div>
              ))}
              <div className={cn("absolute transition-all duration-1000 transform", tickerIndex === data.customPhrases.length ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                <span className="text-secondary text-sm font-black italic uppercase tracking-widest">
                  Liderança: <span className="text-white">{leader?.count > 0 ? leader.name : "---"}</span> {leader?.count > 0 && <span>com <span className="text-white">{leader.count}</span> pontos</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
