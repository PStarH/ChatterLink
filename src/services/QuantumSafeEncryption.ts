import { Kyber } from 'kyber-crystals';

export class QuantumSafeEncryption {
  private static instance: QuantumSafeEncryption;
  private initialized = false;
  private kyber: typeof Kyber | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private constructor() {}

  static getInstance(): QuantumSafeEncryption {
    if (!QuantumSafeEncryption.instance) {
      QuantumSafeEncryption.instance = new QuantumSafeEncryption();
    }
    return QuantumSafeEncryption.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Initialize Kyber with the highest security level (Kyber1024)
      this.kyber = await Kyber.create('Kyber1024');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Kyber:', error);
      throw error;
    }
  }

  async generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    if (!this.kyber) throw new Error('Kyber not initialized');

    const keyPair = await this.kyber.keyGen();
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  async encapsulate(publicKey: Uint8Array): Promise<{ 
    sharedSecret: Uint8Array; 
    ciphertext: Uint8Array 
  }> {
    if (!this.kyber) throw new Error('Kyber not initialized');

    const result = await this.kyber.encaps(publicKey);
    return {
      sharedSecret: result.sharedSecret,
      ciphertext: result.ciphertext
    };
  }

  async decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
    if (!this.kyber) throw new Error('Kyber not initialized');

    const sharedSecret = await this.kyber.decaps(ciphertext, privateKey);
    return sharedSecret;
  }

  // Hybrid encryption using Kyber for key exchange and AES for data encryption
  async encrypt(data: Uint8Array, recipientPublicKey: Uint8Array): Promise<{
    encryptedData: Uint8Array;
    encapsulatedKey: Uint8Array;
  }> {
    // Generate shared secret using Kyber
    const { sharedSecret, ciphertext: encapsulatedKey } = await this.encapsulate(recipientPublicKey);

    // Use shared secret to derive AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt data using AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      data
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);

    return {
      encryptedData: result,
      encapsulatedKey
    };
  }

  async decrypt(
    encryptedData: Uint8Array,
    encapsulatedKey: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    // Recover shared secret using Kyber
    const sharedSecret = await this.decapsulate(encapsulatedKey, privateKey);

    // Derive AES key from shared secret
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Extract IV and ciphertext
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    return new Uint8Array(decryptedData);
  }

  async cleanup(): Promise<void> {
    this.kyber = null;
    this.initialized = false;
  }
}