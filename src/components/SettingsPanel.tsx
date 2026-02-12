
"use client";

import { useState, useRef } from 'react';
import { useCounter, SocialLink } from '@/hooks/useCounter';
import { 
  Plus, Settings2, X, Upload, Megaphone,
  Beer, Wine, CupSoda, GlassWater, Trophy, Star, Flame, Music, Pizza,
  Instagram, Youtube, Share2, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [newSocialType, setNewSocialType] = useState<'instagram' | 'youtube'>('instagram');
  const [newSocialUrl, setNewSocialUrl] = useState("");
  
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

  const handleAddSocial = () => {
    if (newSocialUrl.trim()) {
      const newLink: SocialLink = {
        id: Math.random().toString(36).substring(2, 11),
        type: newSocialType,
        url: newSocialUrl.trim()
      };
      updateSocialLinks([...(data.socialLinks || []), newLink]);
      setNewSocialUrl("");
    }
  };

  const handleRemoveSocial = (id: string) => {
    const updated = (data.socialLinks || []).filter(l => l.id !== id);
    updateSocialLinks(updated);
  };

  const handleSendAnnouncement = () => {
    if (customAnnouncement.trim()) {
      triggerAnnouncement(customAnnouncement);
      setCustomAnnouncement("");
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

  const getSocialHandle = (url: string) => {
    try {
      const cleanUrl = url.replace(/\/$/, "");
      const parts = cleanUrl.split('/');
      return parts[parts.length - 1] || parts[parts.length - 2] || 'Social';
    } catch {
      return 'Social';
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
                <Share2 className="w-3 h-3" /> Redes Sociais Dinâmicas
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Tipo</label>
                    <Select value={newSocialType} onValueChange={(val: any) => setNewSocialType(val)}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-[3] space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/20 tracking-widest ml-1">Link Completo (URL)</label>
                    <Input 
                      placeholder="https://..." 
                      value={newSocialUrl} 
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      className="bg-black/20 border-white/10 h-10"
                    />
                  </div>
                  <Button 
                    onClick={handleAddSocial}
                    disabled={!newSocialUrl.trim()}
                    className="h-10 bg-secondary text-secondary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {(data.socialLinks || []).map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                      <div className="flex items-center gap-3">
                        {link.type === 'instagram' ? <Instagram className="w-4 h-4 text-pink-500" /> : <Youtube className="w-4 h-4 text-red-600" />}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-white italic">{getSocialHandle(link.url)}</span>
                          <span className="text-[8px] text-white/20 truncate max-w-[150px]">{link.url}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => triggerSocialAnnouncement(link.type, link.url)}
                          size="sm"
                          className={cn(
                            "h-8 text-[9px] font-black uppercase px-3",
                            link.type === 'instagram' ? "bg-pink-600 hover:bg-pink-700" : "bg-red-600 hover:bg-red-700"
                          )}
                        >
                          Divulgar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveSocial(link.id)}
                          className="h-8 w-8 text-white/20 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
