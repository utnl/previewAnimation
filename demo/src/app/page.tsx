'use client';

import { useEffect, useState } from 'react';
import PixiCanvas from '@/components/PixiCanvas';

interface AnimationSet {
  id: string;
  name: string;
  frames: number;
  imageNames: string[];
  color: string;
}

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const [animations, setAnimations] = useState<AnimationSet[]>([]);
  const [speed, setSpeed] = useState(0.5);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    const fetchAnims = async () => {
      try {
        const res = await fetch('/api/animations');
        const data = await res.json();
        if (data.animations) {
          setAnimations(data.animations);
        }
      } catch (err) {
        console.error('Failed to fetch animations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnims();
  }, []);

  const totalPages = Math.ceil(animations.length / ITEMS_PER_PAGE);
  const paginatedItems = animations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center p-8 lg:p-12">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 transition-all duration-1000 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/30 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative w-full max-w-7xl flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 z-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            PIXI.ANIMATE
          </h1>
          <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">Visual Grid Preview</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4 glass-card px-6 py-3 rounded-2xl">
             <label className="text-[10px] text-white/30 uppercase font-black">Global FPS</label>
             <input 
                type="range" min="0.1" max="2" step="0.1" value={speed} 
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
             />
             <span className="text-[10px] font-mono text-indigo-400">{(speed * 60).toFixed(0)}</span>
          </div>
          
          <div className="px-4 py-2 glass-card rounded-xl text-xs font-bold text-white/50 tracking-widest border border-white/5">
             {animations.length} ASSETS • PAGE {currentPage}/{totalPages || 1}
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="relative w-full max-w-7xl z-10">
        {loading ? (
          <div className="w-full h-[600px] flex items-center justify-center glass-card rounded-[3rem]">
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white/30 text-sm font-bold uppercase tracking-widest">Scanning Animations...</span>
             </div>
          </div>
        ) : (
          <PixiCanvas animations={paginatedItems} speed={speed} />
        )}

        {/* Empty State */}
        {!loading && animations.length === 0 && (
          <div className="w-full h-64 flex items-center justify-center glass-card rounded-[3rem] text-white/20 italic">
            No animations found in ../animations/
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-6">
            <button 
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }}
              disabled={currentPage === 1}
              className="px-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-10 transition-all text-xs font-black tracking-widest"
            >
              PREVIOUS
            </button>
            <div className="flex gap-2">
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                  key={i}
                  onClick={() => { setCurrentPage(i + 1); window.scrollTo(0,0); }}
                  className={`w-10 h-10 rounded-xl transition-all text-[10px] font-bold ${
                    currentPage === i + 1 ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-white/5 hover:bg-white/10'
                  }`}
                 >
                   {i + 1}
                 </button>
               ))}
            </div>
            <button 
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0); }}
              disabled={currentPage === totalPages}
              className="px-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-10 transition-all text-xs font-black tracking-widest"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      <footer className="mt-24 py-12 text-white/10 text-[10px] font-black uppercase tracking-[0.6em] flex flex-col items-center gap-2 z-10">
         <p>PIXI.ANIMATE • ENGINE v1.2</p>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </main>
  );
}
