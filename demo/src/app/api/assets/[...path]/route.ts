import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: filePathParts } = await params;
    
    if (!filePathParts || filePathParts.length === 0) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const filePath = filePathParts.join(path.sep);
    
    // Relative path out of demo/ and into animations/
    const assetPath = path.resolve(process.cwd(), '..', 'animations', filePath);

    if (!fs.existsSync(assetPath)) {
      console.error(`[AssetAPI] 404: ${assetPath}`);
      return NextResponse.json({ error: 'File not found', path: assetPath }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(assetPath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[AssetAPI] Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
