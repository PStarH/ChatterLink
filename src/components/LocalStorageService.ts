export class LocalStorageService {
  private static instance: LocalStorageService;
  private prefix = 'chatterlink_';

  private constructor() {}

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  setSecure(key: string, value: any, expiresIn?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null
    };
    this.set(key, item);
  }

  getSecure<T>(key: string): T | null {
    const item = this.get<{
      value: T;
      timestamp: number;
      expiresAt: number | null;
    }>(key);

    if (!item) return null;

    // Check if item has expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.remove(key);
      return null;
    }

    return item.value;
  }
}