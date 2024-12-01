import { Room, RoomCreationData } from '../types';
import { EncryptionService } from './encryption';
import { PeerService } from './PeerService';

export class RoomService {
  private static instance: RoomService;
  private rooms: Map<string, Room> = new Map();
  private peerService: PeerService;
  private encryptionService: EncryptionService;

  private constructor() {
    this.peerService = PeerService.getInstance();
    this.encryptionService = EncryptionService.getInstance();
    this.loadRooms();
  }

  static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  private loadRooms() {
    const savedRooms = localStorage.getItem('publicRooms');
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms) as Room[];
      rooms.forEach(room => this.rooms.set(room.id, room));
    }
  }

  private saveRooms() {
    const publicRooms = Array.from(this.rooms.values())
      .filter(room => !room.isPrivate);
    localStorage.setItem('publicRooms', JSON.stringify(publicRooms));
  }

  async createRoom(data: RoomCreationData): Promise<Room> {
    const id = crypto.randomUUID();
    const peerId = this.peerService.id;
    
    if (!peerId) throw new Error('Peer service not initialized');

    let metadata = {
      maxParticipants: 50,
      allowFiles: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      fileExpiration: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    if (data.isPrivate && data.encryptionKey) {
      // Encrypt room metadata for private rooms
      const { ciphertext, iv } = await this.encryptionService.encryptMessage(
        JSON.stringify({
          name: data.name,
          description: data.description
        })
      );
      
      const encryptedMetadata = {
        encrypted: true,
        iv,
        data: ciphertext
      };

      metadata = { ...metadata, ...encryptedMetadata };
    }

    const room: Room = {
      id,
      name: data.name,
      description: data.description || '',
      type: data.type,
      isPrivate: data.isPrivate,
      createdAt: Date.now(),
      tags: data.tags,
      peerId,
      messages: [],
      peers: new Map(),
      metadata,
      activeUsers: 1
    };

    this.rooms.set(id, room);
    
    if (!room.isPrivate) {
      this.saveRooms();
      // Announce new public room to the network
      this.peerService.announceRoom(room);
    }

    return room;
  }

  async joinRoom(roomId: string, inviteKey?: string): Promise<Room> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    if (room.isPrivate && !inviteKey) {
      throw new Error('Invite key required for private room');
    }

    // Connect to room creator
    await this.peerService.connectToPeer(room.peerId);

    return room;
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values())
      .filter(room => !room.isPrivate)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getRoomInviteLink(room: Room): string {
    if (!room.isPrivate) throw new Error('Cannot generate invite link for public room');
    return `${window.location.origin}/join/${room.id}`;
  }
}