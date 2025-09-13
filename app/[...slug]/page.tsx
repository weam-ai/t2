'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatchAllRoute() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to /askdb
    router.replace('/askdb');
  }, [router]);

  // Show minimal loading state during redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-100/50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary-500 rounded-3xl blur-2xl opacity-30"></div>
          <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AskDB</h2>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
