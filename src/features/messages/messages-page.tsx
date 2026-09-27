import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Mail, MailOpen, Phone, Reply, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { notificationKeys } from '@/features/notifications/api';
import { createCrud } from '@/shared/lib/crud';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { PageHeader, SearchInput } from '@/shared/ui/layout';

const messagesCrud = createCrud('contact_submissions', {
  label: 'Message',
  orderBy: [{ column: 'created_at', ascending: false }],
  alsoInvalidate: [notificationKeys.unreadMessages],
});

const RETENTION_YEARS = 3;

function usePurgeOldMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Anciens messages supprimés' },
    mutationFn: async () => {
      const limit = new Date();
      limit.setFullYear(limit.getFullYear() - RETENTION_YEARS);
      const { error } = await supabase.from('contact_submissions').delete().lt('created_at', limit.toISOString());
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesCrud.keys.all }),
  });
}

export function Component() {
  const { data: messages = [], isPending, isError, error, refetch } = messagesCrud.useList();
  const patch = messagesCrud.usePatch();
  const remove = messagesCrud.useRemove();
  const purge = usePurgeOldMessages();
  const confirm = useConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const term = useDeferredValue(search).toLowerCase();

  const visible = messages.filter(
    (m) =>
      (!term || `${m.name} ${m.email} ${m.subject ?? ''} ${m.message}`.toLowerCase().includes(term)) &&
      (filter === 'all' || (filter === 'unread' ? !m.is_read : m.is_read)),
  );
  const selected = messages.find((m) => m.id === selectedId) ?? null;
  const unread = messages.filter((m) => !m.is_read).length;

  const open = (id: string, isRead: boolean) => {
    setSelectedId(id);
    if (!isRead) patch.mutate({ id, values: { is_read: true } });
  };

  const missionLink = (m: NonNullable<typeof selected>) =>
    `/admin/missions/new?${new URLSearchParams({
      client: m.name,
      email: m.email,
      phone: m.phone ?? '',
      title: m.subject ?? '',
      notes: m.message,
    }).toString()}`;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Messages"
        description={`${messages.length} message${messages.length > 1 ? 's' : ''} · ${unread} non lu${unread > 1 ? 's' : ''}`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            loading={purge.isPending}
            onClick={async () => {
              if (
                await confirm({
                  title: `Supprimer les messages de plus de ${RETENTION_YEARS} ans ?`,
                  description: 'Durée de conservation RGPD des demandes de contact.',
                })
              )
                purge.mutate();
            }}
          >
            Purge RGPD
          </Button>
        }
      />

      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <SearchInput
          className="flex-1"
          placeholder="Rechercher…"
          aria-label="Rechercher un message"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="md:w-40"
          aria-label="Filtre"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Tous</option>
          <option value="unread">Non lus</option>
          <option value="read">Lus</option>
        </Select>
      </Card>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Mail} title="Aucun message" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <ul className="max-h-[70vh] divide-y divide-neutral-100 overflow-y-auto">
              {visible.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => open(message.id, message.is_read)}
                    aria-current={message.id === selectedId}
                    className={cn(
                      'w-full p-4 text-left transition-colors hover:bg-neutral-50',
                      message.id === selectedId && 'bg-primary-50 hover:bg-primary-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('truncate', !message.is_read && 'font-semibold text-neutral-900')}>
                        {message.name}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">{formatDateTime(message.created_at)}</span>
                    </div>
                    <p className="truncate text-sm text-neutral-600">{message.subject ?? 'Sans sujet'}</p>
                    <p className="line-clamp-1 text-xs text-neutral-400">{message.message}</p>
                    <div className="mt-1 flex gap-1">
                      {!message.is_read && <Badge tone="primary">Nouveau</Badge>}
                      {message.replied_at && <Badge tone="success">Répondu</Badge>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 lg:col-span-3">
            {!selected ? (
              <p className="py-24 text-center text-neutral-400">Sélectionnez un message</p>
            ) : (
              <article className="space-y-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">{selected.subject ?? 'Sans sujet'}</h2>
                    <p className="text-sm text-neutral-500">
                      {selected.name} · {formatDateTime(selected.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={selected.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      onClick={() => patch.mutate({ id: selected.id, values: { is_read: !selected.is_read } })}
                    >
                      {selected.is_read ? <Mail /> : <MailOpen />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-error-500 hover:bg-error-50"
                      aria-label="Supprimer"
                      onClick={async () => {
                        if (await confirm({ title: 'Supprimer ce message ?' })) {
                          remove.mutate(selected.id);
                          setSelectedId(null);
                        }
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </header>

                <ul className="flex flex-wrap gap-4 text-sm">
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 text-neutral-400" aria-hidden />
                    <a href={`mailto:${selected.email}`} className="text-primary-600 hover:underline">
                      {selected.email}
                    </a>
                  </li>
                  {selected.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="size-4 text-neutral-400" aria-hidden />
                      <a href={`tel:${selected.phone}`} className="text-primary-600 hover:underline">
                        {selected.phone}
                      </a>
                    </li>
                  )}
                </ul>

                <p className="rounded-lg bg-neutral-50 p-4 leading-relaxed whitespace-pre-line text-neutral-700">
                  {selected.message}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject ?? 'Votre demande'}`)}`}
                      onClick={() =>
                        patch.mutate({ id: selected.id, values: { replied_at: new Date().toISOString() } })
                      }
                    >
                      <Reply />
                      Répondre
                    </a>
                  </Button>
                  <Button asChild variant="subtle">
                    <Link to={missionLink(selected)}>
                      <Briefcase />
                      Créer une mission
                    </Link>
                  </Button>
                </div>
                {selected.replied_at && (
                  <p className="text-xs text-neutral-400">Répondu le {formatDateTime(selected.replied_at)}</p>
                )}
              </article>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
