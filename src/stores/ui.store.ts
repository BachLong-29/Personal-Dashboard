import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

type ProjectViewMode = 'kanban' | 'list';

interface UIState {
  toasts: Toast[];
  isSidebarOpen: boolean;
  projectViewMode: ProjectViewMode;
  searchOpen: boolean;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setProjectViewMode: (mode: ProjectViewMode) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      toasts: [],
      isSidebarOpen: false,
      projectViewMode: 'kanban',
      searchOpen: false,
      setProjectViewMode: (mode) => set({ projectViewMode: mode }),
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false }),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
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
