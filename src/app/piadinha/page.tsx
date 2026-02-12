
"use client";

import { useState, useRef } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Mic, Square, Send, Loader2, Play, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from "@/hooks/use-toast";

export default function PiadinhaPage() {
  const { data, submitJoke, isInitializing } = useCounter();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      };

      mediaRecorder.start();
      setIsRecording(true);
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

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        submitJoke(base64Audio);
        setIsUploading(false);
        setAudioBlob(null);
        setAudioUrl(null);
        toast({
          title: "Piadinha Enviada!",
          description: "Seu áudio entrou no banco de piadas do administrador.",
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
          <div className="bg-orange-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            <Mic className={`w-10 h-10 text-orange-500 ${isRecording ? 'animate-pulse' : ''}`} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Gravar <span className="text-orange-500">Piadinha</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
            {data.brandName} • Conte algo engraçado!
          </p>
        </div>

        <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center gap-8">
            {!audioBlob ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-red-500 bg-red-500/10 scale-110' : 'border-orange-500/20 bg-white/5'}`}>
                  {isRecording ? (
                    <div className="flex gap-1 items-end h-12">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className="w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }}></div>
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
                    <><Square className="w-6 h-6 mr-2 fill-current" /> Parar</>
                  ) : (
                    <><Mic className="w-6 h-6 mr-2" /> Gravar</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-6 py-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <Volume2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-xs font-black uppercase text-white/60 tracking-widest">Áudio Gravado</span>
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
                    <><Send className="w-6 h-6 mr-2" /> Enviar para o Telão</>
                  )}
                </Button>
              </div>
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
