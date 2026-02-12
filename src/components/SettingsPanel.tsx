
"use client";

import { useState, useRef } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { 
  Plus, Settings2, X, Upload, Megaphone,
  Beer, Wine, CupSoda, GlassWater, Trophy, Star, Flame, Music, Pizza,
  Instagram, Youtube, Share2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ICON_OPTIONS = [
  { id: 'Beer', icon: Beer },
  { id: 'Wine', icon: Wine },
  { id: 'CupSoda', icon: CupSoda },
  { id: 'GlassWater', icon: GlassWater },
  { id: 'Trophy', icon: Trophy },
  { id: 'Star', icon: Star },
  { id: 'Flame', icon: Flame },
  { id: 'Music', icon: Music },
  { id: 'Pizza', icon: Pizza },
];

export function SettingsPanel() {
  const { 
    data, updateTitle, updateBrand, updatePhrases, updateBrandImage, 
    triggerAnnouncement, updateSocialLinks, triggerSocialAnnouncement
  } = useCounter();

  const [newPhrase, setNewPhrase] = useState("");
  const [customAnnouncement, setCustomAnnouncement] = useState("");
  const [instagramInput, setInstagramInput] = useState(data.instagramUrl || "");
  const [youtubeInput, setYoutubeInput] = useState(data.youtubeUrl || "");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      updatePhrases([...data.customPhrases, newPhrase.trim()]);
      setNewPhrase("");
    }
  };

  const handleRemovePhrase = (index: number) => {
    const updated = data.customPhrases.filter((_, i) => i !== index);
    updatePhrases(updated);
  };

  const handleSendAnnouncement = () => {
    if (customAnnouncement.trim()) {
      triggerAnnouncement(customAnnouncement);
      setCustomAnnouncement("");
    }
  };

  const handleSaveSocial = () => {
    updateSocialLinks(instagramInput.trim(), youtubeInput.trim());
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
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(optimizedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleBrandImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma imagem de até 2MB.");
        return;
      }
      handleImageCompression(file, (url) => updateBrandImage(url), 800);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-card/30 backdrop-blur-md border-white/5">
        <CardContent className="pt-8 space-y-6">
          <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-widest text-xs mb-4">
            <Settings2 className="w-4 h-4" />
            Configurações Gerais
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-white/40">Título do Ranking</label>
              <Input 
                placeholder="Ex: Resenha Épica" 
                value={data.title} 
                onChange={(e) => updateTitle(e.target.value)}
                className="bg-black/20 border-white/10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-white/40">Nome da Marca</label>
                <Input 
                  value={data.brandName} 
                  onChange={(e) => updateBrand(e.target.value, data.brandIcon)}
                  className="bg-black/20 border-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-white/40">Logo Personalizada (Máx. 2MB)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleBrandImageUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-10">
                    <Upload className="w-4 h-4 mr-2" /> Upload
                  </Button>
                  {data.brandImageUrl && (
                    <div className="relative group">
                      <img src={data.brandImageUrl} className="w-10 h-10 rounded-lg object-cover border border-white/20" alt="Brand Logo" />
                      <button onClick={() => updateBrandImage("")} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] font-bold uppercase text-white/40 flex items-center gap-2">
                <Share2 className="w-3 h-3" /> Redes Sociais
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Instagram Link</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                      <Input 
                        placeholder="https://instagram.com/..." 
                        value={instagramInput} 
                        onChange={(e) => setInstagramInput(e.target.value)}
                        className="bg-black/20 border-white/10 pl-10"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => triggerSocialAnnouncement('instagram')}
                    disabled={!data.instagramUrl}
                    className="h-10 mt-5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] uppercase"
                  >
                    Divulgar
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">YouTube Link</label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                      <Input 
                        placeholder="https://youtube.com/..." 
                        value={youtubeInput} 
                        onChange={(e) => setYoutubeInput(e.target.value)}
                        className="bg-black/20 border-white/10 pl-10"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => triggerSocialAnnouncement('youtube')}
                    disabled={!data.youtubeUrl}
                    className="h-10 mt-5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase"
                  >
                    Divulgar
                  </Button>
                </div>

                <Button 
                  onClick={handleSaveSocial}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase italic tracking-tighter"
                >
                  Salvar Links Sociais
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-white/40">Frases do Overlay</label>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Nova frase..." value={newPhrase} onChange={(e) => setNewPhrase(e.target.value)} className="bg-black/20 border-white/10" />
                <Button onClick={handleAddPhrase} className="bg-secondary text-secondary-foreground"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                {data.customPhrases.map((phrase, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white/80">
                    {phrase}
                    <button onClick={() => handleRemovePhrase(i)} className="text-white/20 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5">
              <label className="text-[10px] font-bold uppercase text-white/40">Aviso Urgente (Buzina)</label>
              <div className="flex gap-2">
                <Input placeholder="Digite o aviso..." value={customAnnouncement} onChange={(e) => setCustomAnnouncement(e.target.value)} className="bg-black/20 border-white/10" />
                <Button onClick={handleSendAnnouncement} disabled={!customAnnouncement.trim()} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                  <Megaphone className="w-4 h-4 mr-2" /> ENVIAR
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

