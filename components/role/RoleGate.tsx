
'use client';
import { ReactNode } from 'react';
import { useRole, Role } from '@/hooks/useRole';

interface Props {
  allowed: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ allowed, fallback, children }: Props) {
  const { role, loading } = useRole();

  if (loading) return <div className="p-4 text-gray-400">Loading permissions...</div>;
  if (!role || !allowed.includes(role)) {
    return fallback ?? (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Access Restricted</p>
        <p className="text-sm">This feature requires: {allowed.join(' or ')}. Your role: {role || 'Guest'}</p>
      </div>
    );
  }

  return <>{children}</>;
}
