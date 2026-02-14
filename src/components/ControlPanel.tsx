
"use client";

import { useState, useRef, useEffect } from 'react';
import { useCounter, Participant, MusicRequest, Joke, AdminUser } from '@/hooks/useCounter';
import { 
  Plus, RotateCcw, UserPlus, Trash2, 
  Sparkles, Loader2, Zap,
  Heart, Check, Ban, Upload, History, UserCheck,
  Music, Mic, Send,
  ExternalLink, Eraser, Volume2, Smartphone, Copy, X, GripHorizontal, Edit
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Link from 'next/link';

export function ControlPanel() {
  const { 
    data, loading, isInitializing, 
    addParticipant, updateParticipantImage, incrementCount, resetAll, resetOnlyPoints,
    removeParticipant, triggerRaffle, triggerSurpriseChallenge, clearRaffle, clearChallenge, 
    clearActiveMessage, moderateMessage, moderateParticipant, updateParticipantCategory,
    moderateMusic, removeMusicRequest, resetRaffleHistory, resetChallengeHistory,
    triggerPiadinha, removeJoke, updateJokeName
  } = useCounter();

  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Gole");
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  // Joke Editing State
  const [editingJokeId, setEditingJokeId] = useState<string | null>(null);
  const [editingJokeName, setEditingJokeName] = useState("");

  const participantFilesRef = useRef<Record<string, HTMLInputElement | null>>({});
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedAlertsRef = useRef(false);

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

  const getParticipantAvatar = (p: Participant) => {
    if (p.imageUrl) return p.imageUrl;
    return `https://picsum.photos/seed/${p.id}-character-human-face-portrait-anime-movie/200/200`;
  };

  const openCadastroWindow = () => {
    const url = formatUrlWithCorrectPort('/cadastro-qr');
    const width = 260;
    const height = 360;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    window.open(
      url, 
      'CadastroQR', 
      `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,toolbar=no,location=no,resizable=no,scrollbars=no`
    );
  };

  const copyToClipboard = (path: string, label: string) => {
    const url = formatUrlWithCorrectPort(path);
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link Copiado!", description: `O link para ${label} foi copiado.` });
    });
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      const success = addParticipant(newParticipantName.trim(), selectedCategory, "", true);
      if (success) setNewParticipantName("");
      else toast({ variant: "destructive", title: "Nome duplicado", description: "Já existe um participante com este nome." });
    }
  };

  const handleImageCompression = (file: File, callback: (dataUrl: string) => void, maxSize = 600) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize; }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.7));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleParticipantImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageCompression(file, (url) => updateParticipantImage(id, url), 400);
  };

  const pendingMessages = data.messages.filter(m => m.status === 'pending');
  const pendingParticipants = data.participants.filter(p => p.status === 'pending');
  const pendingMusic = (data.musicRequests || []).filter(m => m.status === 'pending');
  const approvedMusic = (data.musicRequests || []).filter(m => m.status === 'approved').sort((a,b) => a.timestamp - b.timestamp);
  const approvedParticipants = data.participants.filter(p => p.status === 'approved');
  
  const totalPending = pendingMessages.length + pendingParticipants.length + pendingMusic.length;

  useEffect(() => {
    if (isInitializing) return;

    if (!initializedAlertsRef.current) {
      pendingParticipants.forEach(p => seenIdsRef.current.add(p.id));
      pendingMusic.forEach(m => seenIdsRef.current.add(m.id));
      initializedAlertsRef.current = true;
      return;
    }

    const newItems: any[] = [];
    
    pendingParticipants.forEach(p => {
      if (!seenIdsRef.current.has(p.id)) {
        newItems.push({ ...p, alertType: 'participant' });
        seenIdsRef.current.add(p.id);
      }
    });

    pendingMusic.forEach(m => {
      if (!seenIdsRef.current.has(m.id)) {
        newItems.push({ ...m, alertType: 'music' });
        seenIdsRef.current.add(m.id);
      }
    });

    if (newItems.length > 0) {
      setActiveAlerts(prev => [...prev, ...newItems]);
    }
  }, [pendingParticipants, pendingMusic, isInitializing]);

  const removeAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleApproveMusic = (id: string) => {
    if (approvedMusic.length >= 10) {
      toast({
        variant: "destructive",
        title: "Limite Atingido!",
        description: "A playlist já tem 10 músicas. Delete uma da lista ativa para adicionar novas.",
      });
      return;
    }
    moderateMusic(id, 'approved');
    removeAlert(id);
  };

  const startEditingJoke = (joke: Joke) => {
    setEditingJokeId(joke.id);
    setEditingJokeName(joke.name);
  };

  const handleSaveJokeName = () => {
    if (editingJokeId && editingJokeName.trim()) {
      updateJokeName(editingJokeId, editingJokeName.trim());
      setEditingJokeId(null);
      toast({ title: "Nome Atualizado", description: "O nome do meme foi alterado com sucesso." });
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Conectando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10 relative">
      
      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 w-[320px]">
        {activeAlerts.map((alert) => (
          <Card key={alert.id} className="bg-card/95 backdrop-blur-xl border-2 border-primary/50 shadow-2xl animate-in slide-in-from-right-10 duration-500 overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                {alert.alertType === 'participant' ? <UserPlus className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                {alert.alertType === 'participant' ? 'Novo Participante' : 'Novo Pedido de Música'}
              </span>
              <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)} className="h-6 w-6 text-white/20 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                {alert.alertType === 'participant' ? (
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={getParticipantAvatar(alert)} className="object-cover" data-ai-hint="character portrait" />
                    <AvatarFallback className="bg-white/5 font-bold">{alert.name[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                    <Music className="w-6 h-6 text-blue-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {alert.alertType === 'participant' ? (
                    <p className="text-white font-black italic uppercase truncate">{alert.name}</p>
                  ) : (
                    <>
                      <p className="text-white font-black italic uppercase text-xs truncate">{alert.artist}</p>
                      <p className="text-white/40 font-bold uppercase text-[9px] truncate">{alert.song}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (alert.alertType === 'participant') {
                      moderateParticipant(alert.id, 'approved');
                      removeAlert(alert.id);
                    } else {
                      handleApproveMusic(alert.id);
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-9 font-black uppercase italic text-[10px]"
                >
                  <Check className="w-3 h-3 mr-1" /> Aceitar
                </Button>
                <Button 
                  onClick={() => {
                    if (alert.alertType === 'participant') {
                      moderateParticipant(alert.id, 'rejected');
                    } else {
                      moderateMusic(alert.id, 'rejected');
                    }
                    removeAlert(alert.id);
                  }}
                  variant="outline"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 h-9 font-black uppercase italic text-[10px]"
                >
                  <Ban className="w-3 h-3 mr-1" /> Negar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden">
        <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
            <Smartphone className="w-3 h-3" /> QR Codes & Compartilhamento
          </span>
        </div>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openCadastroWindow}
            className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-secondary hover:text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Cadastro
          </Button>

          <Button variant="outline" size="sm" onClick={() => copyToClipboard('/correio', 'Correio')} className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-correio hover:text-white">
            <Heart className="w-4 h-4 mr-2" /> Correio
          </Button>

          <Button variant="outline" size="sm" onClick={() => copyToClipboard('/musica', 'Música')} className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white">
            <Music className="w-4 h-4 mr-2" /> Música
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(formatUrlWithCorrectPort('/piadinha'), '_blank')} 
            className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-500 hover:text-white"
          >
            <Mic className="w-4 h-4 mr-2" /> Memes
          </Button>

          <Link href={formatUrlWithCorrectPort('/overlay')} target="_blank" className="w-full">
            <Button variant="outline" size="sm" className="h-12 w-full bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all">
              <ExternalLink className="w-4 h-4 mr-2" /> Telão
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/20 backdrop-blur-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase italic text-yellow-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Sorteio Geral
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetRaffleHistory} title="Zerar quem já ganhou" className="h-8 w-8 p-0 text-yellow-500/40 hover:text-yellow-500">
               <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
             <Button onClick={triggerRaffle} disabled={approvedParticipants.length < 2 || data.raffle?.isRaffling || loading} className="w-full bg-yellow-500 hover:bg-yellow-600 h-12 rounded-xl text-md font-black uppercase italic shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                {data.raffle?.isRaffling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Sorteio Geral
              </Button>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center">Vencedores: {data.raffle?.winnersHistory?.length || 0} / {approvedParticipants.length}</p>
              {data.raffle?.winnerId && !data.raffle?.isRaffling && (
                <Button onClick={clearRaffle} variant="outline" className="text-yellow-500 border-yellow-500/20 text-[10px] font-bold uppercase h-10">
                  <Eraser className="w-4 h-4 mr-2" /> Limpar Overlay
                </Button>
              )}
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20 backdrop-blur-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase italic text-purple-500 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Desafio Rápido
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetChallengeHistory} title="Zerar histórico de desafios" className="h-8 w-8 p-0 text-purple-500/40 hover:text-purple-500">
               <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
             <Button onClick={triggerSurpriseChallenge} disabled={approvedParticipants.length < 1 || data.challenge?.isRaffling || loading} className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl text-md font-black uppercase italic shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {data.challenge?.isRaffling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                Novo Desafio
              </Button>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center">Desafiados: {data.challenge?.winnersHistory?.length || 0} / {approvedParticipants.length}</p>
              {data.challenge?.winnerId && !data.challenge?.isRaffling && (
                <Button onClick={clearChallenge} variant="outline" className="text-purple-500 border-purple-500/20 text-[10px] font-bold uppercase h-10">
                  <Eraser className="w-4 h-4 mr-2" /> Limpar Overlay
                </Button>
              )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 h-12 w-full">
          <TabsTrigger value="main" className="flex-1 font-bold uppercase text-[10px] tracking-widest">Painel Principal</TabsTrigger>
          <TabsTrigger value="moderation" className="flex-1 font-bold uppercase text-[10px] tracking-widest relative">
            Moderação
            {totalPending > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">{totalPending}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          <Card className="bg-card/30 border-correio/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase italic text-correio flex items-center gap-2"><Heart className="w-4 h-4" /> Correio Ativo</CardTitle>
              {data.activeMessageId && <Button onClick={clearActiveMessage} variant="ghost" size="sm" className="text-destructive text-[10px] font-bold uppercase">Limpar Telão</Button>}
            </CardHeader>
            <CardContent>
              {data.activeMessageId ? (
                <div className="bg-correio/10 border border-correio/20 p-4 rounded-xl">
                   <p className="text-white font-bold italic">&ldquo;{data.messages.find(m => m.id === data.activeMessageId)?.content}&rdquo;</p>
                </div>
              ) : (
                <p className="text-[10px] font-bold uppercase text-white/20 text-center italic py-4">Nenhuma mensagem no telão.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase italic text-blue-500 flex items-center gap-2">
                <Music className="w-4 h-4" /> Playlist Ativa ({approvedMusic.length}/10)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {approvedMusic.length === 0 ? (
                <p className="text-[10px] font-bold uppercase text-white/20 text-center italic py-4">Nenhuma música tocando.</p>
              ) : (
                approvedMusic.map((m, i) => (
                  <div key={m.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group">
                    <div>
                      <span className="block text-white font-black italic uppercase text-xs">{m.artist}</span>
                      <span className="block text-white/40 font-bold uppercase text-[8px] tracking-widest">{m.song}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMusicRequest(m.id)} className="text-white/20 hover:text-destructive opacity-0 group-hover:opacity-100 h-8 w-8">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-secondary/20">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary"><UserPlus className="w-5 h-5" /> Adicionar Participante</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddParticipant} className="flex gap-3">
                <Input placeholder="Nome" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} className="flex-1 bg-black/40 border-secondary/20" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 bg-black/40 border-secondary/20"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {data.categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={!newParticipantName.trim()} className="bg-secondary text-secondary-foreground"><Plus /></Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Ranking Geral</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetOnlyPoints} className="text-primary border-primary/20 hover:bg-primary/10 bg-transparent text-[10px] font-bold uppercase"><History className="w-4 h-4 mr-1" /> Zerar Pontos</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent text-[10px] font-bold uppercase"><RotateCcw className="w-4 h-4 mr-1" /> Zerar Tudo</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-white/10 backdrop-blur-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white font-black italic">Resetar Tudo?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60 font-bold">Todos os participantes serão removidos.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 text-white font-bold uppercase">Não</AlertDialogCancel>
                      <AlertDialogAction onClick={resetAll} className="bg-destructive text-destructive-foreground font-black uppercase italic">Sim, Zerar Tudo!</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...approvedParticipants].sort((a,b) => b.count - a.count).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                  <div className="flex items-center gap-4">
                    <div className="relative group/img">
                      <Avatar className="w-12 h-12 border-2 border-white/10">
                        <AvatarImage src={getParticipantAvatar(p)} className="object-cover" data-ai-hint="character portrait" />
                        <AvatarFallback className="bg-white/5 font-bold uppercase">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <button onClick={() => participantFilesRef.current[p.id]?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-full transition-opacity"><Upload className="w-4 h-4 text-white" /></button>
                      <input type="file" accept="image/*" className="hidden" ref={el => participantFilesRef.current[p.id] = el} onChange={(e) => handleParticipantImageUpload(p.id, e)} />
                    </div>
                    <div>
                      <span className="font-black text-xl text-white italic uppercase">{p.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Select value={p.category} onValueChange={(val) => updateParticipantCategory(p.id, val)}>
                          <SelectTrigger className="h-6 bg-black/40 border-secondary/20 text-[10px] font-bold uppercase px-2 w-auto min-w-[100px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            {data.categories.map(cat => <SelectItem key={cat} value={cat} className="text-[10px] font-bold uppercase">{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <span className="text-sm font-bold text-secondary">{p.count} {p.category.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="lg" onClick={() => incrementCount(p.id)} className="bg-secondary hover:bg-secondary/90 w-16 h-14 text-2xl font-black rounded-2xl"><Plus className="w-8 h-8" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeParticipant(p.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="moderation" className="space-y-6">
          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary"><UserCheck className="w-5 h-5" /> Perfis Pendentes ({pendingParticipants.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pendingParticipants.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-white/10"><AvatarImage src={getParticipantAvatar(p)} className="object-cover" data-ai-hint="character portrait" /><AvatarFallback className="bg-white/5 font-bold uppercase">{p.name[0]}</AvatarFallback></Avatar>
                    <span className="font-bold text-white uppercase italic">{p.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => moderateParticipant(p.id, 'approved')} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-[10px]"><Check className="w-4 h-4 mr-1" /> Aprovar</Button>
                    <Button onClick={() => moderateParticipant(p.id, 'rejected')} size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px]"><Ban className="w-4 h-4 mr-1" /> Rejeitar</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-500"><Music className="w-5 h-5" /> Pedidos de Música ({pendingMusic.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pendingMusic.map(req => (
                <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="block text-white font-black italic uppercase text-xs">{req.artist}</span>
                    <span className="block text-white/40 font-bold uppercase text-[10px] tracking-widest">{req.song}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveMusic(req.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px]"><Check className="w-4 h-4 mr-1" /> Aprovar</Button>
                    <Button onClick={() => moderateMusic(req.id, 'rejected')} size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px]"><Ban className="w-4 h-4 mr-1" /> Rejeitar</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-correio"><Heart className="w-5 h-5" /> Correio Elegante ({pendingMessages.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pendingMessages.map(msg => (
                <div key={msg.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-correio/20 text-correio border-none font-bold italic uppercase text-[10px]">De: {msg.from}</Badge>
                      <span className="text-white/20 text-xs">➔</span>
                      <Badge className="bg-secondary/20 text-secondary border-none font-bold italic uppercase text-[10px]">Para: {msg.to}</Badge>
                    </div>
                  </div>
                  <p className="text-white font-medium italic text-lg">&ldquo;{msg.content}&rdquo;</p>
                  <div className="flex gap-2">
                    <Button onClick={() => moderateMessage(msg.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-[10px] tracking-widest"><Check className="w-4 h-4 mr-2" /> Aprovar</Button>
                    <Button onClick={() => moderateMessage(msg.id, 'rejected')} variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest"><Ban className="w-4 h-4 mr-2" /> Rejeitar</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border-white/5">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-500"><Mic className="w-5 h-5" /> Memes Enviados ({data.jokes?.length || 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(data.jokes || []).map((joke) => (
                <div key={joke.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-white/10 rounded-lg">
                        <AvatarImage src={joke.imageUrl || ""} className="object-cover" />
                        <AvatarFallback className="bg-white/5"><Mic className="w-4 h-4 text-orange-500/40" /></AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-black italic uppercase text-white/80">{joke.name}</span>
                   </div>
                   <div className="flex gap-2">
                      <audio id={`audio-${joke.id}`} src={joke.audioUrl} className="hidden" />
                      <Button variant="outline" size="icon" onClick={() => (document.getElementById(`audio-${joke.id}`) as HTMLAudioElement).play()} className="h-9 w-9 bg-white/5 border-white/10 hover:bg-orange-500/20">
                         <Volume2 className="w-4 h-4 text-orange-500" />
                      </Button>
                      
                      <Dialog open={editingJokeId === joke.id} onOpenChange={(open) => !open && setEditingJokeId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => startEditingJoke(joke)} className="h-9 w-9 bg-white/5 border-white/10 hover:bg-white/10">
                            <Edit className="w-4 h-4 text-white/40" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-white/10 backdrop-blur-xl">
                          <DialogHeader>
                            <DialogTitle className="text-white font-black italic uppercase">Renomear Meme</DialogTitle>
                            <DialogDescription className="text-white/40 font-bold text-xs">Dê um novo nome para este meme na lista.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Input 
                              value={editingJokeName} 
                              onChange={(e) => setEditingJokeName(e.target.value)} 
                              className="bg-black/40 border-white/10 h-12 font-bold"
                            />
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSaveJokeName} className="w-full bg-orange-500 text-white font-black uppercase italic h-12">Salvar Nome</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button onClick={() => triggerPiadinha(joke)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase text-[10px]">
                         <Send className="w-4 h-4 mr-1" /> Enviar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeJoke(joke.id)} className="h-9 w-9 text-white/20 hover:text-destructive">
                         <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
