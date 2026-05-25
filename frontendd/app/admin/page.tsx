"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/dashboard'); }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-alabaster-50">
      <div className="w-8 h-8 border-2 border-midnight-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
