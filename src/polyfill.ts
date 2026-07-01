// Robust localStorage sandbox safety polyfill
// Loaded first to prevent any module-load timing exceptions

try {
  const testKey = "__lunito_storage_test__";
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn("⚠️ localStorage is disabled or restricted in this environment. Initiating in-memory fallback storage.");
  const mockStore: Record<string, string> = {};
  const mockStorageObj = {
    getItem: (key: string): string | null => {
      return key in mockStore ? mockStore[key] : null;
    },
    setItem: (key: string, value: string): void => {
      mockStore[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete mockStore[key];
    },
    clear: (): void => {
      for (const k in mockStore) {
        delete mockStore[k];
      }
    },
    key: (index: number): string | null => {
      const keys = Object.keys(mockStore);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(mockStore).length;
    }
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorageObj,
    writable: true,
    configurable: true
  });
}
