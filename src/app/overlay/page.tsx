
"use client";

import { RankingBoard } from "@/components/RankingBoard";

export default function OverlayPage() {
  return (
    <div className="min-h-screen bg-transparent overflow-hidden">
      <RankingBoard overlay />
    </div>
  );
}
