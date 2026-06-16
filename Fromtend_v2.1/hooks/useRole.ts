import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type Role = 'owner' | 'manager' | 'front_desk';

export function useRole() {
  const { user, loading } = useAuth();

  const { data: role, isLoading } = useQuery<Role | null>({
    queryKey: ['role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error || !data) return null;
      return data.role as Role;
    },
    enabled: !!user && !loading,
    staleTime: 1000 * 60 * 30,
  });

  return {
    user,
    loading: loading || isLoading,
    role,
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isFrontDesk: role === 'front_desk',
  };
}
