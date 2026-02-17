
"use client";

import { useState, useRef, useEffect } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Mic, Square, Send, Loader2, Play, Trash2, Volume2, Image as ImageIcon, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function MemesPage() {
  const { data, submitJoke, isInitializing } = useCounter();
  const [isRecording, setIsRecording] = useState(false);
  const [memeName, setMemeName] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Trava de segurança: Máximo 8 segundos por meme para economizar espaço no banco
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopRecording();
          toast({
            title: "Limite atingido",
            description: "Memes são limitados a 8 segundos para garantir performance.",
          });
        }
      }, 8000);

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      toast({
        variant: "destructive",
        title: "Erro no Microfone",
        description: "Não foi possível acessar o microfone do seu dispositivo.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleImageCompression = (file: File, callback: (dataUrl: string) => void, maxSize = 250) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Qualidade reduzida para 0.4 para garantir que o documento não estoure 1MB
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
          callback(optimizedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCompression(file, (url) => setImageUrl(url));
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        submitJoke(base64Audio, memeName.trim(), imageUrl || undefined);
        setIsUploading(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setImageUrl(null);
        setMemeName("");
        toast({
          title: "Meme Enviado!",
          description: "Seu meme entrou na fila do administrador.",
        });
      };
    } catch (err) {
      console.error("Erro ao converter áudio:", err);
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Erro no Envio",
        description: "Não foi possível enviar o áudio.",
      });
    }
  };

  const resetAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-orange-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
            <Mic className={`w-10 h-10 text-orange-500 ${isRecording ? 'animate-pulse' : ''}`} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Memes <span className="text-orange-500">Ao Vivo!</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            {data.brandName} • Crie seu meme agora!
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center gap-6">
            
            <div className="w-full space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] block text-center">Nome do Meme:</label>
              <Input 
                placeholder="Ex: Risada do João" 
                value={memeName}
                onChange={(e) => setMemeName(e.target.value)}
                className="bg-black/40 border-white/10 h-12 text-center font-bold"
              />
            </div>

            <div className="w-full space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] block text-center">Foto do Meme:</label>
              <div className="relative group mx-auto w-40 h-40">
                <Avatar className="w-40 h-40 rounded-2xl border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center">
                  {imageUrl ? (
                    <AvatarImage src={imageUrl} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-transparent flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 text-white/10" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {imageUrl ? (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 rounded-full w-8 h-8"
                    onClick={() => setImageUrl(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute inset-0 w-full h-full bg-transparent border-none hover:bg-white/5 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Camera className="w-8 h-8 text-orange-500/40" />
                  </Button>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={imageInputRef}
                  onChange={handleImageUpload} 
                />
              </div>
            </div>

            <div className="w-full border-t border-white/5 pt-6">
              {!audioBlob ? (
                <div className="flex flex-col items-center gap-6">
                  <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-red-500 bg-red-500/10 scale-110' : 'border-orange-500/20 bg-white/5'}`}>
                    {isRecording ? (
                      <div className="flex gap-1 items-end h-12">
                         {[...Array(5)].map((_, i) => (
                           <div key={i} className="w-1.5 bg-red-500 rounded-full animate-bounce" style={{ 
                             animationDelay: `${i * 0.1}s`, 
                             height: isMounted ? `${Math.floor(Math.random() * 60) + 40}%` : '50%' 
                           }}></div>
                         ))}
                      </div>
                    ) : (
                      <Mic className="w-12 h-12 text-orange-500/20" />
                    )}
                  </div>
                  
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    className={`w-48 h-16 rounded-full text-lg font-black uppercase italic tracking-tighter transition-all ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                  >
                    {isRecording ? (
                      <><Square className="w-6 h-6 mr-2 fill-current" /> Parar Áudio</>
                    ) : (
                      <><Mic className="w-6 h-6 mr-2" /> Gravar Áudio</>
                    )}
                  </Button>
                  {isRecording && <p className="text-[10px] text-red-500 font-bold animate-pulse">GRAVANDO (MÁX 8S)...</p>}
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500/20 p-2 rounded-lg">
                        <Volume2 className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-xs font-black uppercase text-white/60 tracking-widest">Áudio Pronto</span>
                    </div>
                    <div className="flex gap-2">
                      <audio src={audioUrl || ''} controls className="hidden" id="recorded-audio" />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => (document.getElementById('recorded-audio') as HTMLAudioElement).play()}
                        className="rounded-full bg-white/5 border-white/10"
                      >
                        <Play className="w-4 h-4 text-orange-500" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={resetAudio}
                        className="rounded-full bg-white/5 border-white/10 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSend}
                    disabled={isUploading}
                    className="w-full h-16 bg-green-600 hover:bg-green-700 text-lg font-black italic uppercase tracking-tighter rounded-xl shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Enviando...</>
                    ) : (
                      <><Send className="w-6 h-6 mr-2" /> Enviar Meme Completo</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <footer className="text-center">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} {data.brandName}
          </p>
        </footer>
      </div>
    </div>
  );
}
