'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';

interface AnimItem {
  id: string;
  name: string;
  frames: number;
  imageNames: string[];
}

interface PixiGridViewProps {
  animations: AnimItem[];
  speed: number;
  resolution: number;
}

// Global Texture Cache (simple URL-based)
const textureCache: Map<string, PIXI.Texture[]> = new Map();

async function loadTexturesForAnim(id: string, imageNames: string[]): Promise<PIXI.Texture[]> {
  if (textureCache.has(id)) return textureCache.get(id)!;
  
  // Memory Safety: Strict 40-item limit
  if (textureCache.size >= 40) {
    const keys = Array.from(textureCache.keys());
    console.log(`[Memory Manager] Evicting 20 old animations from cache... (Current size: ${textureCache.size})`);
    
    // Evict 20 to make room for a new page of 20
    for (let i = 0; i < 20; i++) {
       const key = keys[i];
       const textures = textureCache.get(key);
       if (textures) {
         textures.forEach(t => {
           try { t.destroy(true); } catch(e) {} // Force GPU cleanup
         });
       }
       textureCache.delete(key);
    }
  }

  const textures: PIXI.Texture[] = [];
  const promises = imageNames.map(fileName => {
    const url = `/api/assets/${id}/${fileName}`;
    return new Promise<PIXI.Texture>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(PIXI.Texture.from(img));
      img.onerror = () => reject(new Error(`Failed ${url}`));
      img.src = url;
    });
  });

  const results = await Promise.allSettled(promises);
  results.forEach(res => {
    if (res.status === 'fulfilled') textures.push(res.value);
  });
  
  textureCache.set(id, textures);
  return textures;
}

export default function PixiGridView({ animations, speed, resolution }: PixiGridViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spritesRef = useRef<Map<string, PIXI.AnimatedSprite>>(new Map());
  const gridItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [loadingCounter, setLoadingCounter] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize One Shared Pixi Application
  useEffect(() => {
    if (!containerRef.current) return;
    let app: PIXI.Application | null = null;
    let isDestroyed = false;

    const init = async () => {
      app = new PIXI.Application();
      await app.init({
        backgroundAlpha: 0,
        antialias: false,
        resolution: resolution, // Dynamic resolution
        roundPixels: true,
      });
      
      if (isDestroyed) {
        try { app.destroy(true, { children: true, texture: false }); } catch(e) {}
        return;
      }

      // Ensure canvas covers view perfectly without stretching
      if (app.canvas) {
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.position = 'absolute';
        app.canvas.style.top = '0';
        app.canvas.style.left = '0';
      }

      appRef.current = app;
      containerRef.current?.appendChild(app.canvas);

      const handleWindowResize = () => {
        if (app && app.renderer) {
           app.renderer.resize(window.innerWidth, window.innerHeight);
        }
      };
      
      window.addEventListener('resize', handleWindowResize);
      handleWindowResize();

      app.ticker.add(() => {
        if (!app) return;
        spritesRef.current.forEach((sprite, id) => {
          const targetEl = gridItemsRef.current.get(id);
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            sprite.x = rect.left + rect.width / 2;
            sprite.y = rect.top + rect.height / 2;
            const scale = Math.min(rect.width / (sprite.texture.width||1), rect.height / (sprite.texture.height||1), 2) * 0.8;
            if (scale > 0 && isFinite(scale)) sprite.scale.set(scale);
            sprite.visible = rect.top < window.innerHeight && rect.bottom > 0;
          } else {
            sprite.visible = false;
          }
        });
      });

      (app as any)._cleanup = () => window.removeEventListener('resize', handleWindowResize);
      setIsReady(true);
    };

    init();

    return () => {
      isDestroyed = true;
      setIsReady(false);
      if (app) {
        if ((app as any)._cleanup) (app as any)._cleanup();
        appRef.current = null;
        spritesRef.current.clear();
        try {
          app.destroy(true, { children: true, texture: false });
        } catch (e) {}
      }
    };
  }, [resolution]);

  // Sync Sprites (Only when ready)
  useEffect(() => {
    if (!isReady || !appRef.current) return;
    const app = appRef.current;

    const currentIds = new Set(animations.map(a => a.id));
    spritesRef.current.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        app.stage.removeChild(sprite);
      }
    });

    const loadAll = async () => {
      for (const anim of animations) {
        let sprite = spritesRef.current.get(anim.id);
        
        if (!sprite) {
          setLoadingCounter(c => c + 1);
          try {
            const textures = await loadTexturesForAnim(anim.id, anim.imageNames);
            if (textures.length > 0) {
              sprite = new PIXI.AnimatedSprite(textures);
              sprite.anchor.set(0.5);
              app.stage.addChild(sprite);
              spritesRef.current.set(anim.id, sprite);
            }
          } catch (e) {
            console.error(e);
          } finally {
            setLoadingCounter(c => Math.max(0, c - 1));
          }
        }

        if (sprite) {
           if (!sprite.parent) app.stage.addChild(sprite);
           sprite.animationSpeed = speed;
           sprite.play();
        }
      }
    };

    loadAll();
  }, [animations, speed, isReady, resolution]);

  return (
    <>
      {/* 
        This is a FIXED overlay canvas. 
        It sits above/behind everything and sprites follow HTML targets.
      */}
      <div 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none z-20" 
        style={{ pointerEvents: 'none' }} 
      />
      
      {/* 
        The actual Grid Layout 
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {animations.map((anim) => (
          <div 
            key={anim.id}
            className="group relative glass-card rounded-3xl overflow-hidden aspect-square flex flex-col transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:border-white/20"
          >
            {/* The Target Placeholder for WebGL */}
            <div 
              ref={(el) => { if (el) gridItemsRef.current.set(anim.id, el); }}
              className="flex-1 bg-slate-900/40"
            />
            
            {/* Info Bar */}
            <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold truncate max-w-[80%]">{anim.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[9px] text-white/20 uppercase font-black tracking-tighter">ID: {anim.id}</span>
                 <span className="text-[9px] text-indigo-400 font-bold">{anim.frames} FR</span>
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 border border-white/0 group-hover:border-indigo-500/30 rounded-3xl pointer-events-none transition-colors duration-500" />
          </div>
        ))}
      </div>

      {/* Loading Overlay (Shared) */}
      {loadingCounter > 0 && (
         <div className="fixed bottom-8 right-8 z-50 glass-card px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 shadow-2xl">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Hydrating {loadingCounter} assets...</span>
         </div>
      )}
    </>
  );
}
