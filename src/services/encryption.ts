import { PrivacyLevel } from '../types';
import { TorService } from './TorService';
import { SMPCService } from './SMPCService';

// ... [previous PRIVACY_CONFIGS code remains the same] ...

export class EncryptionService {
  private static instance: EncryptionService;
  private aesKey: CryptoKey | null = null;
  private rsaKeyPair: CryptoKeyPair | null = null;
  private privacyLevel: PrivacyLevel = 'basic';
  private keyMap: Map<string, CryptoKey> = new Map();
  private torService: TorService;
  private smpcService: SMPCService;

  private constructor() {
    this.torService = TorService.getInstance();
    this.smpcService = SMPCService.getInstance();
  }

  // ... [previous methods remain the same] ...

  async initialize(password: string, level: PrivacyLevel): Promise<void> {
    this.privacyLevel = level;
    
    if (level === 'basic') return;

    // Initialize Tor and SMPC services for maximum privacy
    if (level === 'maximum') {
      await this.torService.initialize();
      await this.smpcService.initialize();
    }

    // Generate key from password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key
    this.aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // For maximum privacy, split the key using SMPC
    if (level === 'maximum') {
      const exportedKey = await crypto.subtle.exportKey('raw', this.aesKey);
      const shares = await this.smpcService.splitSecretKey(
        new Uint8Array(exportedKey),
        3, // threshold
        5  // total shares
      );
      
      // Store shares securely (in a real app, these would be distributed to different nodes)
      localStorage.setItem('keyShares', JSON.stringify(Array.from(shares)));
    }

    // Generate RSA key pair for signatures
    this.rsaKeyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );
  }

  async cleanup() {
    this.aesKey = null;
    this.rsaKeyPair = null;
    this.keyMap.clear();
    await this.torService.cleanup();
    await this.smpcService.cleanup();
  }
}