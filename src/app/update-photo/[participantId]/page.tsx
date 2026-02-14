"use client";

import { useState, use, useEffect } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Camera, Check, Loader2, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import Link from 'next/link';

export default function UpdatePhotoPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = use(params);
  const { data, updateParticipantImage, isInitializing } = useCounter();
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'uploading'>('idle');

  const participant = data.participants.find(p => p.id === participantId);

  const handleImageCompression = (file: File, callback: (dataUrl: string) => void, maxSize = 600) => {
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
          callback(canvas.toDataURL('image/jpeg', 0.7));
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
          description: "Sua nova foto já deve estar aparecendo no telão.",
        });
      });
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black text-white italic uppercase">Participante não encontrado</h1>
        <Link href="/">
          <Button variant="outline" className="border-white/10 text-white font-bold uppercase italic">
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
          <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Nova <span className="text-primary">Foto</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            Atualizando perfil de {participant.name}
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center gap-8">
            <div className="relative group">
              <Avatar className="w-48 h-48 border-4 border-primary/50 shadow-2xl">
                <AvatarImage src={imageUrl || participant.imageUrl || `https://picsum.photos/seed/${participant.id}/400/400`} className="object-cover" />
                <AvatarFallback className="bg-white/5 font-black uppercase text-6xl">
                  {participant.name[0]}
                </AvatarFallback>
              </Avatar>
              {status === 'success' && (
                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-in zoom-in">
                  <Check className="w-20 h-20 text-white" />
                </div>
              )}
            </div>

            <div className="w-full space-y-4">
              {status === 'success' ? (
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-black italic uppercase text-green-500">Foto enviada!</h3>
                  <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                    Você já pode fechar esta janela.
                  </p>
                </div>
              ) : (
                <>
                  <label className="w-full">
                    <Button 
                      disabled={status === 'uploading'}
                      className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-black italic uppercase tracking-tighter rounded-xl shadow-lg flex items-center justify-center gap-3"
                      asChild
                    >
                      <span>
                        {status === 'uploading' ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6" />
                        )}
                        {status === 'uploading' ? "Processando..." : "Tirar Nova Foto"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </span>
                    </Button>
                  </label>
                  <p className="text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
                    A foto será atualizada instantaneamente no telão
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}