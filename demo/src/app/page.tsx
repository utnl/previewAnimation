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
  const [resolution, setResolution] = useState(0.25); // Default to low for performance
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
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Quality Selector */}
          <div className="flex items-center gap-3 glass-card px-5 py-3 rounded-2xl">
             <label className="text-[10px] text-white/30 uppercase font-black">Quality</label>
             <select 
               value={resolution}
               onChange={(e) => setResolution(parseFloat(e.target.value))}
               className="bg-transparent text-xs font-black text-indigo-400 outline-hidden cursor-pointer"
             >
               <option value={0.25} className="bg-slate-900 border-none">0.25x</option>
               <option value={0.5} className="bg-slate-900 border-none">0.50x</option>
               <option value={0.75} className="bg-slate-900 border-none">0.75x</option>
               <option value={1.0} className="bg-slate-900 border-none">1.00x</option>
             </select>
          </div>

          <div className="flex items-center gap-4 glass-card px-6 py-3 rounded-2xl">
             <label className="text-[10px] text-white/30 uppercase font-black">Speed</label>
             <input 
                type="range" min="0.1" max="2" step="0.1" value={speed} 
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
             />
             <span className="text-[10px] font-mono text-indigo-400">{(speed * 60).toFixed(0)}</span>
          </div>
          
          <div className="hidden lg:block px-4 py-2 glass-card rounded-xl text-[10px] font-bold text-white/40 tracking-widest border border-white/5 uppercase">
             {animations.length} Assets • Page {currentPage}/{totalPages || 1}
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
          <PixiCanvas key={resolution} animations={paginatedItems} speed={speed} resolution={resolution} />
        )}

        {/* Empty State */}
        {!loading && animations.length === 0 && (
          <div className="w-full h-64 flex items-center justify-center glass-card rounded-[3rem] text-white/20 italic">
            No animations found in ../animations/
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-8">
            <div className="flex items-center gap-4">
               <button 
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }}
                disabled={currentPage === 1}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-10 transition-all text-[10px] font-black"
               >
                 PREV
               </button>

               <div className="flex items-center gap-2">
                  {/* Current Page Input */}
                  <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl border border-white/5">
                    <span className="text-[10px] text-white/30 uppercase font-bold">Page</span>
                    <input 
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setCurrentPage(Math.min(totalPages, Math.max(1, val)));
                        }
                      }}
                      className="w-12 bg-transparent text-center text-sm font-black text-indigo-400 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] text-white/30 uppercase font-bold">of {totalPages}</span>
                  </div>
               </div>

               <button 
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0); }}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-10 transition-all text-[10px] font-black"
               >
                 NEXT
               </button>
            </div>

            {/* Quick Select Bubbles */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl px-8">
               {[...Array(totalPages)].map((_, i) => {
                 const page = i + 1;
                 // Only show first, last, and around current
                 const isNear = Math.abs(page - currentPage) <= 1;
                 const isEdge = page === 1 || page === totalPages;
                 
                 if (!isNear && !isEdge) {
                   if (page === 2 || page === totalPages - 1) return <span key={page} className="text-white/10">...</span>;
                   return null;
                 }

                 return (
                  <button 
                   key={page}
                   onClick={() => { setCurrentPage(page); window.scrollTo(0,0); }}
                   className={`w-9 h-9 rounded-xl transition-all text-xs font-bold ${
                     currentPage === page ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-white/5 hover:bg-white/10'
                   }`}
                  >
                    {page}
                  </button>
                 );
               })}
            </div>
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
