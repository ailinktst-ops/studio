"use client";

import { useState, use, useRef } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Camera, Check, Loader2, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import Link from 'next/link';

interface PageProps {
  params: Promise<{ participantId: string }>;
}

export default function UpdatePhotoPage({ params }: PageProps) {
  const { participantId } = use(params);
  const { data, updateParticipantImage, isInitializing, loading } = useCounter();
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'uploading'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participant = data.participants.find(p => p.id === participantId);

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
          // Redução para 250px e qualidade 0.5 para economizar espaço
          const compressed = canvas.toDataURL('image/jpeg', 0.5);
          callback(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStatus('uploading');
      handleImageCompression(file, (url) => {
        setImageUrl(url);
        updateParticipantImage(participantId, url);
        setStatus('success');
        toast({
          title: "Foto Atualizada!",
          description: "Sua nova foto já foi enviada para o telão.",
        });
      });
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  if (isInitializing || (loading && !participant)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="bg-red-500/20 p-4 rounded-full mb-4">
          <User className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
          Perfil não encontrado
        </h1>
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest max-w-[200px]">
          O perfil solicitado não existe ou foi removido.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-white/10 text-white font-bold uppercase italic mt-4">
            Voltar ao Início
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
            Nova <span className="text-primary">Foto</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
            {data.brandName} • Atualizando {participant.name}
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center gap-8">
            <div className="relative group">
              <Avatar className="w-48 h-48 border-4 border-primary/50 shadow-[0_0_40px_rgba(236,72,153,0.2)]">
                <AvatarImage 
                  src={imageUrl || participant.imageUrl || `https://picsum.photos/seed/${participant.id}/400/400`} 
                  className="object-cover" 
                />
                <AvatarFallback className="bg-white/5 font-black uppercase text-6xl">
                  {participant.name[0]}
                </AvatarFallback>
              </Avatar>
              
              {status === 'success' && (
                <div className="absolute inset-0 bg-green-500/40 backdrop-blur-sm rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                  <Check className="w-20 h-20 text-white drop-shadow-lg" />
                </div>
              )}
              
              {status === 'uploading' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              )}
            </div>

            <div className="w-full space-y-4">
              {status === 'success' ? (
                <div className="text-center space-y-4 py-2">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                    <h3 className="text-xl font-black italic uppercase text-green-500">Foto Atualizada!</h3>
                    <p className="text-white/40 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">
                      Já pode fechar esta aba
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setStatus('idle')}
                    className="text-white/20 hover:text-white font-bold uppercase text-[10px] tracking-widest"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" /> Trocar novamente
                  </Button>
                </div>
              ) : (
                <>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user"
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                  <Button 
                    onClick={triggerCamera}
                    disabled={status === 'uploading'}
                    className="w-full h-20 bg-primary hover:bg-primary/90 text-xl font-black italic uppercase tracking-tighter rounded-2xl shadow-lg flex items-center justify-center gap-4 transition-all active:scale-95"
                  >
                    <Camera className="w-8 h-8" />
                    {status === 'uploading' ? "Enviando..." : "Abrir Câmera"}
                  </Button>
                  <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-[0.3em] leading-relaxed">
                    Sua foto será atualizada<br />automaticamente no ranking
                  </p>
                </>
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