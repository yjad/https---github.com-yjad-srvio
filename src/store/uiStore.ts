import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: React.ReactNode | null;
  notifications: { id: number; message: string; type: 'success' | 'error' | 'info' }[];
  toggleSidebar: () => void;
  setModal: (content: React.ReactNode | null) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: number) => void;
}

let notifId = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  modalOpen: false,
  modalContent: null,
  notifications: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setModal: (content) => set({ modalOpen: content !== null, modalContent: content }),
  addNotification: (message, type) => {
    const id = ++notifId;
    set((state) => ({ notifications: [...state.notifications, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    }, 3000);
  },
  removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),
}));
