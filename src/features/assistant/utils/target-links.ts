import type { AgentTarget } from '@/types';

export type TargetLink = {
  kind: AgentTarget['kind'];
  /** More than one of this kind: the link goes to the list instead of the one item. */
  many: boolean;
  /** A page in the app, without the locale. `null` for the notes panel, which has no page. */
  href: string | null;
};

/**
 * One link per kind, in the order the kinds first appear. One thing of a kind opens that
 * thing as closely as its page allows; several open the page that lists them.
 */
export function toTargetLinks(targets: AgentTarget[]): TargetLink[] {
  const byKind = new Map<AgentTarget['kind'], AgentTarget[]>();
  for (const target of targets) {
    byKind.set(target.kind, [...(byKind.get(target.kind) ?? []), target]);
  }

  return [...byKind].map(([kind, group]) => {
    const many = group.length > 1;
    const only = many ? undefined : group[0];
    switch (kind) {
      case 'task':
        // The task list has no page per task, but it can open already searched for it.
        return {
          kind,
          many,
          href: only ? `/tasks?q=${encodeURIComponent(only.label)}` : '/tasks',
        };
      case 'habit':
        return { kind, many, href: '/dashboard?tab=habits' };
      case 'event':
        return { kind, many, href: '/manage/events' };
      case 'note':
        return { kind, many, href: null };
    }
  });
}
