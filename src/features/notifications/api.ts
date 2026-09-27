import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export const notificationKeys = {
  unread: ['notifications', 'unread'] as const,
  unreadMessages: ['contact_submissions', 'unread-count'] as const,
};

export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, link, created_at')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadMessagesCount() {
  return useQuery({
    queryKey: notificationKeys.unreadMessages,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
  });
}
