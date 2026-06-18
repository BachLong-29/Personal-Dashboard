export type SearchHitType = 'task' | 'habit' | 'quest' | 'project';

export interface SearchHit {
  id: string;
  type: SearchHitType;
  label: string;
  icon: string;
  color: string;
  /** In-app navigation target for this hit */
  href: string;
}

export interface GlobalSearchResult {
  tasks: SearchHit[];
  habits: SearchHit[];
  quests: SearchHit[];
  projects: SearchHit[];
}
