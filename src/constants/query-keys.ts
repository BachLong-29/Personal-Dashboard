export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  quests: {
    all: ['quests'] as const,
    list: (dateFrom?: string, dateTo?: string) =>
      [...queryKeys.quests.all, 'list', dateFrom ?? 'today', dateTo] as const,
  },
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
  },
  penalty: {
    all: ['penalty'] as const,
    active: () => [...queryKeys.penalty.all, 'active'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  calendar: {
    all: ['calendar'] as const,
    range: (from: string, to: string) => [...queryKeys.calendar.all, 'range', from, to] as const,
    insights: (from: string, to: string) =>
      [...queryKeys.calendar.all, 'insights', from, to] as const,
  },
  scheduleBlocks: {
    all: ['schedule-blocks'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.scheduleBlocks.all, 'list', params] as const,
  },
} as const;
