export interface Message {
  id: string;
  sender: string;
  timestamp: number;
  expiresAt?: number;
  isEncrypted: boolean;
  type: 'text' | 'file' | 'system';
  content: string;
  iv?: string;
  keyId?: string;
  fileMetadata?: {
    name: string;
    size: number;
    type: string;
    expiresAt?: number;
    uploadProgress?: number;
    chunks?: number;
    currentChunk?: number;
  };
}

export type PrivacyLevel = 'basic' | 'standard' | 'maximum';
export type RoomType = 'public' | 'private' | 'ephemeral';

export interface RoomMetadata {
  id: string;
  name: string;
  description: string;
  type: RoomType;
  isPrivate: boolean;
  peerId: string;
  tags: string[];
  activeUsers: number;
  createdAt: number;
  expiresIn?: number;
  expiresAt?: number;
  maxParticipants: number;
  allowFiles: boolean;
  maxFileSize: number;
  fileExpiration: number;
  encryptedMetadata?: {
    iv: string;
    data: string;
    signature?: string;
  };
}

export interface Room extends RoomMetadata {
  messages: Message[];
  peers: Map<string, any>;
  encryptionKey?: string;
}

export interface RoomCreationData {
  name: string;
  description?: string;
  type: RoomType;
  isPrivate: boolean;
  tags: string[];
  encryptionKey?: string;
  expiresIn?: number;
  metadata: {
    maxParticipants: number;
    allowFiles: boolean;
    maxFileSize: number;
    fileExpiration: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  messageLifetime: number | null;
  isAnonymous: boolean;
  privacyLevel: PrivacyLevel;
}

export interface FileShare {
  id: string;
  name: string;
  size: number;
  type: string;
  chunks: number;
  chunkSize: number;
  expiresAt: number;
  uploaderId: string;
  encryptionKey?: string;
  iv?: string;
  signature?: string;
}

export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  data: ArrayBuffer;
  signature?: string;
}