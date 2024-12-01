import { TorConnect } from '@torproject/tor-connect';

export class TorService {
  private static instance: TorService;
  private torConnect: TorConnect | null = null;
  private onionAddress: string | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): TorService {
    if (!TorService.instance) {
      TorService.instance = new TorService();
    }
    return TorService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.torConnect = new TorConnect();
      await this.torConnect.initialize();
      
      // Generate .onion address for the service
      this.onionAddress = await this.torConnect.createHiddenService(8080);
      console.log('Tor hidden service created:', this.onionAddress);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Tor service:', error);
      throw error;
    }
  }

  async connectToPeer(onionAddress: string): Promise<void> {
    if (!this.torConnect) throw new Error('Tor service not initialized');
    
    try {
      await this.torConnect.connect(onionAddress);
    } catch (error) {
      console.error('Failed to connect via Tor:', error);
      throw error;
    }
  }

  getOnionAddress(): string | null {
    return this.onionAddress;
  }

  async makeRequest(url: string): Promise<Response> {
    if (!this.torConnect) throw new Error('Tor service not initialized');

    return await this.torConnect.fetch(url);
  }

  async cleanup(): Promise<void> {
    if (this.torConnect) {
      await this.torConnect.close();
      this.torConnect = null;
      this.onionAddress = null;
      this.initialized = false;
    }
  }
}