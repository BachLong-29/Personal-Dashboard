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
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setProjectViewMode: (mode: ProjectViewMode) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      toasts: [],
      isSidebarOpen: false,
      projectViewMode: 'kanban',
      setProjectViewMode: (mode) => set({ projectViewMode: mode }),
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
