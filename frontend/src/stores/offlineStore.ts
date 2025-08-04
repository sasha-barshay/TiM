import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OfflineEntry, SyncStatus } from '../types';

interface OfflineState {
  // State
  offlineEntries: OfflineEntry[];
  syncStatus: SyncStatus;
  isOnline: boolean;
  lastSyncAttempt: string | null;

  // Actions
  addOfflineEntry: (entry: Omit<OfflineEntry, 'id' | 'createdAt'>) => void;
  updateOfflineEntry: (id: string, updates: Partial<OfflineEntry>) => void;
  removeOfflineEntry: (id: string) => void;
  markEntrySynced: (id: string) => void;
  syncOfflineEntries: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  updateSyncStatus: (status: SyncStatus) => void;
  clearOfflineEntries: () => void;
  initializeOffline: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial state
      offlineEntries: [],
      syncStatus: {
        status: 'synced',
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
      },
      isOnline: navigator.onLine,
      lastSyncAttempt: null,

      // Add offline entry
      addOfflineEntry: (entryData) => {
        const entry: OfflineEntry = {
          ...entryData,
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          synced: false,
        };

        set((state) => ({
          offlineEntries: [...state.offlineEntries, entry],
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: state.syncStatus.pendingChanges + 1,
          },
        }));
      },

      // Update offline entry
      updateOfflineEntry: (id, updates) => {
        set((state) => ({
          offlineEntries: state.offlineEntries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }));
      },

      // Remove offline entry
      removeOfflineEntry: (id) => {
        set((state) => ({
          offlineEntries: state.offlineEntries.filter((entry) => entry.id !== id),
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: Math.max(0, state.syncStatus.pendingChanges - 1),
          },
        }));
      },

      // Mark entry as synced
      markEntrySynced: (id) => {
        set((state) => ({
          offlineEntries: state.offlineEntries.map((entry) =>
            entry.id === id ? { ...entry, synced: true } : entry
          ),
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: Math.max(0, state.syncStatus.pendingChanges - 1),
          },
        }));
      },

      // Sync offline entries
      syncOfflineEntries: async () => {
        const { offlineEntries, isOnline } = get();
        
        if (!isOnline) {
          set({
            syncStatus: {
              status: 'error',
              lastSync: new Date().toISOString(),
              pendingChanges: offlineEntries.filter(e => !e.synced).length,
            },
          });
          return;
        }

        const unsyncedEntries = offlineEntries.filter((entry) => !entry.synced);

        if (unsyncedEntries.length === 0) {
          set({
            syncStatus: {
              status: 'synced',
              lastSync: new Date().toISOString(),
              pendingChanges: 0,
            },
          });
          return;
        }

        set({
          syncStatus: {
            status: 'syncing',
            lastSync: new Date().toISOString(),
            pendingChanges: unsyncedEntries.length,
          },
          lastSyncAttempt: new Date().toISOString(),
        });

        try {
          // Import API service dynamically to avoid circular dependencies
          const { timeEntriesApi } = await import('../services/api');
          
          // Sync entries in batches
          const batchSize = 10;
          for (let i = 0; i < unsyncedEntries.length; i += batchSize) {
            const batch = unsyncedEntries.slice(i, i + batchSize);
            
            const entriesToSync = batch.map((entry) => ({
              customerId: entry.customerId,
              date: entry.date,
              hours: entry.hours,
              description: entry.description,
            }));

            await timeEntriesApi.syncOfflineEntries(entriesToSync);

            // Mark batch as synced
            batch.forEach((entry) => {
              if (entry.id) {
                get().markEntrySynced(entry.id);
              }
            });
          }

          set({
            syncStatus: {
              status: 'synced',
              lastSync: new Date().toISOString(),
              pendingChanges: 0,
            },
          });

          // Remove synced entries after a delay
          setTimeout(() => {
            set((state) => ({
              offlineEntries: state.offlineEntries.filter((entry) => !entry.synced),
            }));
          }, 5000);

        } catch (error) {
          console.error('Sync failed:', error);
          set({
            syncStatus: {
              status: 'error',
              lastSync: new Date().toISOString(),
              pendingChanges: unsyncedEntries.length,
            },
          });
        }
      },

      // Set online status
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        
        // Auto-sync when coming back online
        if (isOnline) {
          const { syncOfflineEntries } = get();
          setTimeout(() => {
            syncOfflineEntries();
          }, 1000);
        }
      },

      // Update sync status
      updateSyncStatus: (status) => {
        set({ syncStatus: status });
      },

      // Clear offline entries
      clearOfflineEntries: () => {
        set({
          offlineEntries: [],
          syncStatus: {
            status: 'synced',
            lastSync: new Date().toISOString(),
            pendingChanges: 0,
          },
        });
      },

      // Initialize offline functionality
      initializeOffline: () => {
        // Listen for online/offline events
        const handleOnline = () => get().setOnlineStatus(true);
        const handleOffline = () => get().setOnlineStatus(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial online status
        set({ isOnline: navigator.onLine });

        // Auto-sync if online and there are pending changes
        const { isOnline, syncStatus } = get();
        if (isOnline && syncStatus.pendingChanges > 0) {
          setTimeout(() => {
            get().syncOfflineEntries();
          }, 2000);
        }

        // Cleanup function (will be called when component unmounts)
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      },
    }),
    {
      name: 'tim-offline-storage',
      partialize: (state) => ({
        offlineEntries: state.offlineEntries,
        syncStatus: state.syncStatus,
        lastSyncAttempt: state.lastSyncAttempt,
      }),
    }
  )
); 