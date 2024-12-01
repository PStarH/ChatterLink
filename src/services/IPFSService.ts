import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { CID } from 'multiformats/cid';
import { EncryptionService } from './encryption';

export class IPFSService {
  private static instance: IPFSService;
  private client: IPFSHTTPClient | null = null;
  private encryptionService: EncryptionService;
  private initialized = false;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Connect to local IPFS node if available
      this.client = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http'
      });

      // Test connection
      await this.client.version();
    } catch (error) {
      // Fallback to Infura IPFS gateway
      console.log('Falling back to Infura IPFS gateway');
      this.client = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: 'Basic ' + btoa(process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_API_SECRET)
        }
      });
    }

    this.initialized = true;
  }

  async uploadFile(file: File): Promise<string> {
    if (!this.client) throw new Error('IPFS client not initialized');

    // Generate encryption key and IV
    const { key, iv } = await this.encryptionService.generateFileKey();
    
    // Encrypt file
    const encryptedBlob = await this.encryptionService.encryptFile(file, iv);
    const encryptedBuffer = await encryptedBlob.arrayBuffer();

    // Upload to IPFS
    const result = await this.client.add(Buffer.from(encryptedBuffer));
    
    // Store encryption metadata
    const metadata = {
      cid: result.cid.toString(),
      key: await this.encryptionService.exportKey(key),
      iv: Buffer.from(iv).toString('base64'),
      name: file.name,
      type: file.type,
      size: file.size
    };

    // Store metadata in local storage (encrypted)
    const encryptedMetadata = await this.encryptionService.encryptMessage(JSON.stringify(metadata));
    localStorage.setItem(`ipfs-meta-${result.cid.toString()}`, JSON.stringify(encryptedMetadata));

    return result.cid.toString();
  }

  async downloadFile(cid: string): Promise<{ data: Uint8Array; metadata: any }> {
    if (!this.client) throw new Error('IPFS client not initialized');

    // Fetch file from IPFS
    const chunks = [];
    for await (const chunk of this.client.cat(CID.parse(cid))) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);

    // Get and decrypt metadata
    const encryptedMetadata = localStorage.getItem(`ipfs-meta-${cid}`);
    if (!encryptedMetadata) throw new Error('File metadata not found');

    const parsedMetadata = JSON.parse(encryptedMetadata);
    const decryptedMetadata = await this.encryptionService.decryptMessage(
      parsedMetadata.ciphertext,
      parsedMetadata.iv,
      parsedMetadata.keyId
    );
    const metadata = JSON.parse(decryptedMetadata);

    // Decrypt file
    const key = await this.encryptionService.importKey(metadata.key);
    const iv = Buffer.from(metadata.iv, 'base64');
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      data: new Uint8Array(decryptedData),
      metadata
    };
  }

  async pinFile(cid: string): Promise<void> {
    if (!this.client) throw new Error('IPFS client not initialized');
    await this.client.pin.add(CID.parse(cid));
  }

  async unpinFile(cid: string): Promise<void> {
    if (!this.client) throw new Error('IPFS client not initialized');
    await this.client.pin.rm(CID.parse(cid));
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      // Close IPFS client connection
      await this.client.stop().catch(console.error);
      this.client = null;
    }
    this.initialized = false;
  }
}