'use client';

import Sidebar from '@/components/ui/Sidebar';
import ClientOnly from '@/components/ui/ClientOnly';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <div className="min-h-screen bg-surface-50">
        <Sidebar />
        <main className="lg:ml-64 pb-20 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </ClientOnly>
  );
}
