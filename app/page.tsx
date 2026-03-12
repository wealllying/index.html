import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';

export default function HomePage() {
  return redirect('/landing');
}
