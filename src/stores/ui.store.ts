import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

type ProjectViewMode = 'kanban' | 'list';

/** One-shot navigation intent for the schedule view — set by e.g. a notification
 * click, consumed (and cleared) by ScheduleView whenever it's mounted, so it
 * works whether the schedule tab is already active or needs to be switched to. */
interface PendingScheduleNav {
  tab: 'day' | 'week' | 'month';
  dayDate?: string;
  weekStart?: string;
  month?: number;
  year?: number;
}

interface UIState {
  toasts: Toast[];
  isSidebarOpen: boolean;
  projectViewMode: ProjectViewMode;
  /** Kanban board: hide status columns that have no tasks */
  hideEmptyKanbanColumns: boolean;
  searchOpen: boolean;
  quickAddTaskOpen: boolean;
  quickAddTransactionOpen: boolean;
  shareAgendaOpen: boolean;
  notesOpen: boolean;
  /** Task ID to restore + edit after a "Quest Failed" notification click */
  pendingRestoreTaskId: string | null;
  pendingScheduleNav: PendingScheduleNav | null;
  /**
   * A message handed to the assistant from elsewhere (the Ctrl+K palette). The
   * assistant page sends it once on arrival. Kept here rather than in the URL
   * so a reload does not send it a second time.
   */
  pendingAssistantPrompt: string | null;
  setPendingAssistantPrompt: (prompt: string | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setProjectViewMode: (mode: ProjectViewMode) => void;
  toggleHideEmptyKanbanColumns: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openQuickAddTask: () => void;
  closeQuickAddTask: () => void;
  toggleQuickAddTask: () => void;
  openQuickAddTransaction: () => void;
  closeQuickAddTransaction: () => void;
  openNotes: () => void;
  closeNotes: () => void;
  openShareAgenda: () => void;
  closeShareAgenda: () => void;
  setPendingRestoreTaskId: (id: string | null) => void;
  setPendingScheduleNav: (nav: PendingScheduleNav | null) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      toasts: [],
      isSidebarOpen: false,
      projectViewMode: 'kanban',
      hideEmptyKanbanColumns: false,
      searchOpen: false,
      quickAddTaskOpen: false,
      quickAddTransactionOpen: false,
      shareAgendaOpen: false,
      notesOpen: false,
      pendingRestoreTaskId: null,
      pendingScheduleNav: null,
      pendingAssistantPrompt: null,
      setProjectViewMode: (mode) => set({ projectViewMode: mode }),
      toggleHideEmptyKanbanColumns: () =>
        set((state) => ({ hideEmptyKanbanColumns: !state.hideEmptyKanbanColumns })),
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false }),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      openQuickAddTask: () => set({ quickAddTaskOpen: true }),
      closeQuickAddTask: () => set({ quickAddTaskOpen: false }),
      toggleQuickAddTask: () => set((state) => ({ quickAddTaskOpen: !state.quickAddTaskOpen })),
      openQuickAddTransaction: () => set({ quickAddTransactionOpen: true }),
      closeQuickAddTransaction: () => set({ quickAddTransactionOpen: false }),
      openNotes: () => set({ notesOpen: true }),
      closeNotes: () => set({ notesOpen: false }),
      openShareAgenda: () => set({ shareAgendaOpen: true }),
      closeShareAgenda: () => set({ shareAgendaOpen: false }),
      setPendingRestoreTaskId: (id) => set({ pendingRestoreTaskId: id }),
      setPendingScheduleNav: (nav) => set({ pendingScheduleNav: nav }),
      setPendingAssistantPrompt: (prompt) => set({ pendingAssistantPrompt: prompt }),
      addToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
        })),
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    { name: 'UIStore' },
  ),
);
