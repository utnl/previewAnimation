import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // The "animations" folder is at the same level as "demo"
    // Since we are in d:/tdgame/animation/demo
    const animDir = path.join(process.cwd(), '..', 'animations');
    
    if (!fs.existsSync(animDir)) {
      return NextResponse.json({ error: 'Animations directory not found' }, { status: 404 });
    }

    const folders = fs.readdirSync(animDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const folderPath = path.join(animDir, dirent.name);
        // Get all .png files and sort them alphabetically
        const files = fs.readdirSync(folderPath)
          .filter(f => f.toLowerCase().endsWith('.png'))
          .sort()
          .filter((_, i) => i % 2 === 0); // Skip odd frames (Fast Preview)
        
        // Return first 30 frames (Enough for quick glance)
        const sequence = files.slice(0, 30);

        return {
          id: dirent.name,
          name: dirent.name,
          imageNames: sequence,
          frames: sequence.length,
          color: getRandomColor(dirent.name)
        };
      });

    return NextResponse.json({ animations: folders });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to read animations' }, { status: 500 });
  }
}

function getRandomColor(seed: string) {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-rose-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-pink-600',
    'from-slate-600 to-slate-800'
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
