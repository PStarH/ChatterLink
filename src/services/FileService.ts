import { FileShare, FileChunk } from '../types';
import { EncryptionService } from './encryption';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export class FileService {
  private static instance: FileService;
  private encryptionService: EncryptionService;
  private activeTransfers: Map<string, FileShare> = new Map();
  private chunkBuffer: Map<string, Map<number, FileChunk>> = new Map();

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
    this.initCleanupInterval();
  }

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  private initCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      this.activeTransfers.forEach((transfer, id) => {
        if (transfer.expiresAt < now) {
          this.activeTransfers.delete(id);
          this.chunkBuffer.delete(id);
        }
      });
    }, 60000); // Check every minute
  }

  async prepareFileUpload(file: File, expiresIn: number): Promise<FileShare> {
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    const id = crypto.randomUUID();
    const { key, iv } = await this.encryptionService.generateFileKey();

    const fileShare: FileShare = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      chunks,
      chunkSize: CHUNK_SIZE,
      expiresAt: Date.now() + expiresIn,
      uploaderId: this.encryptionService.getCurrentUserId(),
      encryptionKey: await this.encryptionService.exportKey(key),
      iv: iv ? Buffer.from(iv).toString('base64') : undefined
    };

    this.activeTransfers.set(id, fileShare);
    return fileShare;
  }

  async uploadChunk(fileId: string, chunkIndex: number, data: ArrayBuffer): Promise<void> {
    const fileShare = this.activeTransfers.get(fileId);
    if (!fileShare) throw new Error('Invalid file transfer');

    // Encrypt chunk
    const encryptedData = await this.encryptionService.encryptFileChunk(
      data,
      fileShare.encryptionKey!,
      fileShare.iv!
    );

    // Sign chunk
    const signature = await this.encryptionService.signData(encryptedData);

    const chunk: FileChunk = {
      fileId,
      chunkIndex,
      data: encryptedData,
      signature
    };

    if (!this.chunkBuffer.has(fileId)) {
      this.chunkBuffer.set(fileId, new Map());
    }
    this.chunkBuffer.get(fileId)!.set(chunkIndex, chunk);
  }

  async downloadChunk(chunk: FileChunk): Promise<ArrayBuffer> {
    // Verify signature
    const isValid = await this.encryptionService.verifySignature(
      chunk.data,
      chunk.signature!
    );
    if (!isValid) throw new Error('Invalid chunk signature');

    const fileShare = this.activeTransfers.get(chunk.fileId);
    if (!fileShare) throw new Error('Invalid file transfer');

    // Decrypt chunk
    return await this.encryptionService.decryptFileChunk(
      chunk.data,
      fileShare.encryptionKey!,
      fileShare.iv!
    );
  }

  getFileTransfer(fileId: string): FileShare | undefined {
    return this.activeTransfers.get(fileId);
  }

  async assembleFile(fileId: string): Promise<Blob> {
    const fileShare = this.activeTransfers.get(fileId);
    if (!fileShare) throw new Error('Invalid file transfer');

    const chunks = this.chunkBuffer.get(fileId);
    if (!chunks || chunks.size !== fileShare.chunks) {
      throw new Error('Incomplete file chunks');
    }

    const sortedChunks = Array.from(chunks.entries())
      .sort(([a], [b]) => a - b)
      .map(([, chunk]) => chunk);

    const decryptedChunks = await Promise.all(
      sortedChunks.map(chunk => this.downloadChunk(chunk))
    );

    return new Blob(decryptedChunks, { type: fileShare.type });
  }

  cleanup() {
    this.activeTransfers.clear();
    this.chunkBuffer.clear();
  }
}