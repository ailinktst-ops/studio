"use client";

import { useState, useRef, useEffect } from 'react';
import { useCounter, Participant, Joke, AdminUser } from '@/hooks/useCounter';
import { 
  Plus, Minus, RotateCcw, UserPlus, Trash2, 
  Sparkles, Loader2, Zap,
  Heart, Check, Ban, Upload, History, UserCheck,
  Mic, Send,
  ExternalLink, Eraser, Volume2, Smartphone, X, Edit, QrCode, Beer
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
    data, jokes, loading, isInitializing, 
    addParticipant, updateParticipantImage, incrementCount, decrementCount, updateParticipantCount, resetAll, resetOnlyPoints,
    clearLastWinner, removeParticipant, triggerRaffle, triggerSurpriseChallenge, clearRaffle, clearChallenge, 
    clearActiveMessage, moderateMessage, moderateParticipant, updateParticipantCategory,
    resetRaffleHistory, resetChallengeHistory,
    triggerPiadinha, removeJoke, updateJokeName, moderatePointRequest
  } = useCounter();

  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Gole");
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  const [editingCountId, setEditingCountId] = useState<string | null>(null);
  const [newCountValue, setNewCountValue] = useState<number>(0);

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

  const getParticipantAvatar = (p: any) => {
    if (p.imageUrl) return p.imageUrl;
    return `https://picsum.photos/seed/${p.id || p.participantId}-character-human-face-portrait-anime-movie/200/200`;
  };

  const openCadastroWindow = () => {
    const url = formatUrlWithCorrectPort('/cadastro-qr');
    const width = 260;
    const height = 360;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    window.open(url, 'CadastroQR', `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,toolbar=no,location=no,resizable=no,scrollbars=no`);
  };

  const copyToClipboard = (path: string, label: string) => {
    const url = formatUrlWithCorrectPort(path);
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link Copiado!", description: `O link para ${label} foi copiado.` });
    });
  };

  const handleParticipantImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 250;
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
            updateParticipantImage(id, canvas.toDataURL('image/jpeg', 0.5));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const pendingMessages = data.messages.filter(m => m.status === 'pending');
  const pendingParticipants = data.participants.filter(p => p.status === 'pending');
  const pendingPoints = (data.pointRequests || []).filter(p => p.status === 'pending');
  const approvedParticipants = data.participants.filter(p => p.status === 'approved');
  
  const totalPending = pendingMessages.length + pendingParticipants.length + pendingPoints.length;

  useEffect(() => {
    if (isInitializing) return;

    if (!initializedAlertsRef.current) {
      pendingParticipants.forEach(p => seenIdsRef.current.add(p.id));
      pendingPoints.forEach(pt => seenIdsRef.current.add(pt.id));
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

    pendingPoints.forEach(pt => {
      if (!seenIdsRef.current.has(pt.id)) {
        newItems.push({ ...pt, alertType: 'point' });
        seenIdsRef.current.add(pt.id);
      }
    });

    if (newItems.length > 0) {
      setActiveAlerts(prev => [...prev, ...newItems]);
    }
  }, [pendingParticipants, pendingPoints, isInitializing]);

  const removeAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  const startEditingCount = (id: string, count: number) => {
    setEditingCountId(id);
    setNewCountValue(count);
  };

  const handleUpdateCount = () => {
    if (editingCountId !== null) {
      updateParticipantCount(editingCountId, newCountValue);
      setEditingCountId(null);
      toast({ title: "Pontos Atualizados", description: `Novo valor: ${newCountValue}` });
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

  const raffleWinner = approvedParticipants.find(p => p.id === data.raffle?.winnerId);
  const challengeWinner = approvedParticipants.find(p => p.id === data.challenge?.winnerId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10 relative">
      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 w-[320px]">
        {activeAlerts.map((alert) => (
          <Card key={alert.id} className="bg-card/95 backdrop-blur-xl border-2 border-primary/50 shadow-2xl animate-in slide-in-from-right-10 duration-500 overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                {alert.alertType === 'participant' ? <UserPlus className="w-3 h-3" /> : <Beer className="w-3 h-3" />}
                {alert.alertType === 'participant' ? 'Novo Participante' : 'Novo Ponto Solicitado'}
              </span>
              <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)} className="h-6 w-6 text-white/20 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={getParticipantAvatar(alert)} className="object-cover" />
                  <AvatarFallback className="bg-white/5 font-bold">{alert.name?.[0] || alert.participantName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black italic uppercase truncate">
                    {alert.alertType === 'participant' ? alert.name : alert.participantName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (alert.alertType === 'participant') moderateParticipant(alert.id, 'approved');
                    else moderatePointRequest(alert.id, 'approved');
                    removeAlert(alert.id);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-9 font-black uppercase italic text-[10px]"
                >
                  <Check className="w-3 h-3 mr-1" /> Aceitar
                </Button>
                <Button 
                  onClick={() => {
                    if (alert.alertType === 'participant') moderateParticipant(alert.id, 'rejected');
                    else moderatePointRequest(alert.id, 'rejected');
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
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="outline" size="sm" onClick={openCadastroWindow} className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-secondary hover:text-white">
            <UserPlus className="w-4 h-4 mr-2" /> Cadastro
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard('/correio', 'Correio')} className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-correio hover:text-white">
            <Heart className="w-4 h-4 mr-2" /> Correio
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard('/pedir-ponto', 'Pedir Ponto')} className="h-12 bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:text-white">
            <Beer className="w-4 h-4 mr-2" /> Pedir Ponto
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
            <CardTitle className="text-sm font-black uppercase italic text-yellow-500 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Sorteio Geral</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetRaffleHistory} className="h-8 w-8 p-0 text-yellow-500/40"><RotateCcw className="w-3.5 h-3.5" /></Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
             <Button onClick={triggerRaffle} disabled={approvedParticipants.length < 2 || data.raffle?.isRaffling || loading} className="w-full bg-yellow-500 hover:bg-yellow-600 h-12 rounded-xl text-md font-black uppercase italic">
                {data.raffle?.isRaffling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Sorteio Geral
              </Button>
              {raffleWinner && !data.raffle?.isRaffling && (
                <div className="flex flex-col items-center gap-2 mt-1">
                  <p className="text-[10px] font-black text-yellow-500 uppercase">Vencedor: {raffleWinner.name}</p>
                  <Button onClick={clearRaffle} variant="outline" size="sm" className="w-full text-yellow-500 border-yellow-500/20 h-8 text-[9px]"><Eraser className="w-3 h-3 mr-1" /> Limpar Vencedor</Button>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20 backdrop-blur-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase italic text-purple-500 flex items-center gap-2"><Zap className="w-4 h-4" /> Desafio Rápido</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetChallengeHistory} className="h-8 w-8 p-0 text-purple-500/40"><RotateCcw className="w-3.5 h-3.5" /></Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
             <Button onClick={triggerSurpriseChallenge} disabled={approvedParticipants.length < 1 || data.challenge?.isRaffling || loading} className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl text-md font-black uppercase italic">
                {data.challenge?.isRaffling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                Novo Desafio
              </Button>
              {challengeWinner && !data.challenge?.isRaffling && (
                <div className="flex flex-col items-center gap-2 mt-1">
                  <p className="text-[10px] font-black text-purple-500 uppercase">Desafiado: {challengeWinner.name}</p>
                  <Button onClick={clearChallenge} variant="outline" size="sm" className="w-full text-purple-500 border-purple-500/20 h-8 text-[9px]"><Eraser className="w-3 h-3 mr-1" /> Limpar Desafio</Button>
                </div>
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

          <Card className="bg-card/50 border-white/5">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold">Ranking Geral</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={resetOnlyPoints} className="text-primary border-primary/20 bg-transparent text-[10px] font-bold uppercase"><History className="w-4 h-4 mr-1" /> Zerar Pontos</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive border-destructive/20 bg-transparent text-[10px] font-bold uppercase"><RotateCcw className="w-4 h-4 mr-1" /> Zerar Tudo</Button></AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-white/10 backdrop-blur-xl">
                    <AlertDialogHeader><AlertDialogTitle className="text-white font-black italic">Resetar Tudo?</AlertDialogTitle><AlertDialogDescription className="text-white/60 font-bold">Todos os participantes serão removidos.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-white/10 text-white font-bold uppercase">Não</AlertDialogCancel><AlertDialogAction onClick={resetAll} className="bg-destructive text-destructive-foreground font-black uppercase italic">Sim, Zerar Tudo!</AlertDialogAction></AlertDialogFooter>
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
                        <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                        <AvatarFallback className="bg-white/5 font-bold uppercase">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <button onClick={() => participantFilesRef.current[p.id]?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-full transition-opacity"><Upload className="w-4 h-4 text-white" /></button>
                      <input type="file" accept="image/*" className="hidden" ref={el => participantFilesRef.current[p.id] = el} onChange={(e) => handleParticipantImageUpload(p.id, e)} />
                    </div>
                    <div>
                      <span className="font-black text-xl text-white italic uppercase">{p.name}</span>
                      <div className="flex items-center gap-2">
                        {editingCountId === p.id ? (
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number" 
                              value={newCountValue} 
                              onChange={(e) => setNewCountValue(parseInt(e.target.value) || 0)}
                              className="w-16 h-6 p-1 text-xs"
                              autoFocus
                              onBlur={handleUpdateCount}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateCount()}
                            />
                          </div>
                        ) : (
                          <p onClick={() => startEditingCount(p.id, p.count)} className="text-sm font-bold text-secondary cursor-pointer hover:text-white transition-colors">
                            {p.count} {p.category.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="lg" onClick={() => decrementCount(p.id)} className="bg-destructive/20 text-destructive w-12 h-14 rounded-2xl"><Minus className="w-6 h-6" /></Button>
                    <Button size="lg" onClick={() => incrementCount(p.id)} className="bg-secondary hover:bg-secondary/90 w-16 h-14 rounded-2xl"><Plus className="w-8 h-8" /></Button>
                    <button onClick={() => removeParticipant(p.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="py-3 px-6 bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Participantes Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingParticipants.length === 0 ? (
                <p className="text-[10px] text-white/20 font-bold uppercase italic text-center py-4">Nenhum cadastro aguardando.</p>
              ) : (
                pendingParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={getParticipantAvatar(p)} className="object-cover" />
                        <AvatarFallback className="font-bold">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-white uppercase italic">{p.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => moderateParticipant(p.id, 'approved')} className="bg-green-600 hover:bg-green-700 h-8 text-[10px] font-black uppercase italic"><Check className="w-3 h-3 mr-1" /> Aprovar</Button>
                      <Button onClick={() => moderateParticipant(p.id, 'rejected')} variant="destructive" className="h-8 text-[10px] font-black uppercase italic"><Ban className="w-3 h-3 mr-1" /> Recusar</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="py-3 px-6 bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-correio">Correio Elegante</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingMessages.length === 0 ? (
                <p className="text-[10px] text-white/20 font-bold uppercase italic text-center py-4">Nenhum recado pendente.</p>
              ) : (
                pendingMessages.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                    <p className="text-[10px] font-black uppercase text-white/40">De: <span className="text-white">{m.from}</span> • Para: <span className="text-white">{m.to}</span></p>
                    <p className="text-sm italic font-bold">&ldquo;{m.content}&rdquo;</p>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => moderateMessage(m.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-[10px] font-black uppercase italic">Aprovar & Mostrar</Button>
                      <Button onClick={() => moderateMessage(m.id, 'rejected')} variant="outline" className="flex-1 border-white/10 h-8 text-[10px] font-black uppercase italic">Ignorar</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="py-3 px-6 bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-500">Solicitações de Pontos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingPoints.length === 0 ? (
                <p className="text-[10px] text-white/20 font-bold uppercase italic text-center py-4">Nenhuma solicitação ativa.</p>
              ) : (
                pendingPoints.map((pt) => (
                  <div key={pt.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500/20 p-2 rounded-lg">
                        <Beer className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-xs font-black uppercase italic text-white">{pt.participantName}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => moderatePointRequest(pt.id, 'approved')} size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-[10px] font-black uppercase italic"><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
                      <Button onClick={() => moderatePointRequest(pt.id, 'rejected')} size="sm" variant="destructive" className="h-8 text-[10px] font-black uppercase italic"><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
