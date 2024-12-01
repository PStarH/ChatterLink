import { Room, RoomMetadata } from '../types';
import { PeerService } from './PeerService';
import { EncryptionService } from './encryption';

export class DHTService {
  private static instance: DHTService;
  private rooms: Map<string, RoomMetadata> = new Map();
  private peerService: PeerService;
  private encryptionService: EncryptionService;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.peerService = PeerService.getInstance();
    this.encryptionService = EncryptionService.getInstance();
    this.loadRooms();
    this.cleanupInterval = this.initCleanupInterval();
  }

  private initCleanupInterval(): NodeJS.Timeout {
    // Check for expired rooms every minute
    return setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      for (const [id, room] of this.rooms) {
        if (room.expiresAt && room.expiresAt < now) {
          this.rooms.delete(id);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this.saveRooms();
      }
    }, 60000);
  }

  static getInstance(): DHTService {
    if (!DHTService.instance) {
      DHTService.instance = new DHTService();
    }
    return DHTService.instance;
  }

  private loadRooms() {
    const savedRooms = localStorage.getItem('dht_rooms');
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms) as RoomMetadata[];
      const now = Date.now();
      // Only load non-expired rooms
      rooms
        .filter(room => !room.expiresAt || room.expiresAt > now)
        .forEach(room => this.rooms.set(room.id, room));
    }
  }

  private saveRooms() {
    const publicRooms = Array.from(this.rooms.values())
      .filter(room => !room.isPrivate);
    localStorage.setItem('dht_rooms', JSON.stringify(publicRooms));
  }

  private async encryptRoomMetadata(metadata: Partial<RoomMetadata>): Promise<{ iv: string; data: string }> {
    const { ciphertext, iv } = await this.encryptionService.encryptMessage(
      JSON.stringify({
        name: metadata.name,
        description: metadata.description,
        tags: metadata.tags,
        maxParticipants: metadata.maxParticipants || 50,
        allowFiles: metadata.allowFiles || true,
        maxFileSize: metadata.maxFileSize || 100 * 1024 * 1024,
        fileExpiration: metadata.fileExpiration || 24 * 60 * 60 * 1000
      })
    );

    return {
      iv,
      data: ciphertext
    };
  }

  async announceRoom(room: Room): Promise<void> {
    const metadata: RoomMetadata = {
      id: room.id,
      name: room.name,
      description: room.description || '',
      type: room.type,
      isPrivate: room.isPrivate,
      peerId: room.peerId,
      tags: room.tags,
      activeUsers: 1,
      createdAt: Date.now(),
      expiresAt: room.expiresIn ? Date.now() + room.expiresIn : undefined,
      maxParticipants: room.metadata.maxParticipants,
      allowFiles: room.metadata.allowFiles,
      maxFileSize: room.metadata.maxFileSize,
      fileExpiration: room.metadata.fileExpiration
    };

    // Encrypt metadata for both public and private rooms
    metadata.encryptedMetadata = await this.encryptRoomMetadata(metadata);

    this.rooms.set(room.id, metadata);
    this.saveRooms();

    // Broadcast to connected peers
    this.peerService.broadcastToPeers({
      type: 'room_announcement',
      metadata
    });
  }

  async searchRooms(query?: string, tags?: string[]): Promise<RoomMetadata[]> {
    const now = Date.now();
    const publicRooms = Array.from(this.rooms.values())
      .filter(room => !room.isPrivate && (!room.expiresAt || room.expiresAt > now))
      .sort((a, b) => b.createdAt - a.createdAt);

    if (!query && !tags?.length) {
      return publicRooms;
    }

    return publicRooms.filter(room => {
      const matchesQuery = !query || 
        room.name.toLowerCase().includes(query.toLowerCase()) ||
        room.description.toLowerCase().includes(query.toLowerCase());

      const matchesTags = !tags?.length ||
        tags.some(tag => room.tags.includes(tag));

      return matchesQuery && matchesTags;
    });
  }

  async joinRoom(roomId: string): Promise<RoomMetadata> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.isPrivate) throw new Error('Cannot join private room without invitation');
    if (room.expiresAt && room.expiresAt < Date.now()) throw new Error('Room has expired');

    if (room.activeUsers >= room.maxParticipants) {
      throw new Error('Room is full');
    }

    // Connect to room creator's peer
    await this.peerService.connectToPeer(room.peerId);
    
    // Update active users count
    room.activeUsers++;
    this.rooms.set(roomId, room);
    this.saveRooms();

    return room;
  }

  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}