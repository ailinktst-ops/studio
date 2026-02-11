
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ControlPanel } from "@/components/ControlPanel";
import { RankingBoard } from "@/components/RankingBoard";
import { LayoutDashboard, Trophy } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="py-8 px-4 border-b bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
              <Trophy className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black font-headline tracking-tight text-primary uppercase">
              RankUp <span className="text-secondary">Counter</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium hidden sm:block">
            Gestão de Consumo em Tempo Real
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
            <TabsTrigger value="control" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="w-4 h-4" />
              Painel de Controle
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Trophy className="w-4 h-4" />
              Visualização Ranking
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="control">
            <ControlPanel />
          </TabsContent>
          
          <TabsContent value="view">
            <RankingBoard />
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="py-8 text-center text-muted-foreground text-sm border-t mt-12">
        &copy; {new Date().getFullYear()} RankUp Counter. Desenvolvido para resenhas memoráveis.
      </footer>
    </main>
  );
}
