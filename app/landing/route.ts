import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = path.join(process.cwd(), 'demo.html');
  const html = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
