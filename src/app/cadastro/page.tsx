"use client";

import { useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { UserPlus, Camera, AlertCircle, Loader2, ArrowRight, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CadastroPage() {
  const { data, addParticipant, isInitializing } = useCounter();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const getPreviewAvatar = () => {
    if (imageUrl) return imageUrl;
    const seed = name.trim() || "guest";
    // Semente focada exclusivamente em rostos de personagens para evitar paisagens
    return `https://picsum.photos/seed/${seed}-character-human-face-portrait-anime-movie/200/200`;
  };

  const handleImageCompression = (file: File, callback: (dataUrl: string) => void, maxSize = 200) => {
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
          // Qualidade reduzida para 0.5 para otimizar espaço em Base64
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          callback(optimizedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCompression(file, (url) => setImageUrl(url));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const success = addParticipant(name.trim(), "Gole", imageUrl, false);
    
    if (success) {
      setStatus('success');
      setName("");
      setImageUrl("");
    } else {
      setStatus('error');
      setErrorMessage("Este nome já está em uso. Tente outro!");
      setTimeout(() => setStatus('idle'), 3000);
    }
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
          <div className="bg-secondary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary/20">
            <UserPlus className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Entre na <span className="text-secondary">Disputa</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            {data.brandName} • Cadastre seu perfil
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8">
            {status === 'success' ? (
              <div className="py-10 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-12 h-12 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white">Aguardando Aprovação</h3>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2 mb-8">
                  Seu perfil foi enviado! Assim que o mestre da resenha aprovar, você aparecerá no telão.
                </p>
                <Button 
                  onClick={() => setStatus('idle')}
                  className="w-full h-14 bg-secondary text-secondary-foreground font-black uppercase italic"
                >
                  Cadastrar outro <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="w-32 h-32 border-4 border-white/10 shadow-xl">
                      <AvatarImage src={getPreviewAvatar()} className="object-cover" data-ai-hint="character portrait" />
                      <AvatarFallback className="bg-white/5 font-black uppercase text-4xl">
                        {name[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-secondary text-secondary-foreground p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sua Foto (Opcional)</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Seu Nome / Apelido:</label>
                  <Input 
                    placeholder="Como quer ser chamado?" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={15}
                    className="bg-black/40 border-white/10 h-14 text-lg font-bold"
                  />
                </div>

                {status === 'error' && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    disabled={!name.trim()}
                    className="w-full h-16 bg-secondary hover:bg-secondary/90 text-lg font-black italic uppercase tracking-tighter rounded-xl shadow-[0_0_20px_rgba(0,128,128,0.3)]"
                  >
                    Participar do Ranking
                  </Button>
                </div>
              </form>
            )}
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