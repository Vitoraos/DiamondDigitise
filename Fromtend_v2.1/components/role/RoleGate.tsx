'use client';
import { ReactNode } from 'react';
import { useRole, Role } from '@/hooks/useRole';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  allowed: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ allowed, fallback, children }: Props) {
  const { role, loading } = useRole();

  if (loading) return <div className="p-4 text-dim">Loading permissions...</div>;
  if (!role || !allowed.includes(role)) {
    return fallback ?? (
      <EmptyState
        title="Access Restricted"
        description={`This feature requires: ${allowed.join(' or ')}. Your role: ${role || 'Guest'}`}
      />
    );
  }

  return <>{children}</>;
}
