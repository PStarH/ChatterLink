import Peer, { DataConnection } from 'peerjs';
import { Room } from '../types';

export class PeerService {
  private static instance: PeerService;
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private messageHandlers: Set<(message: any) => void> = new Set();
  private roomUpdateHandlers: Set<(room: Room) => void> = new Set();

  private constructor() {}

  static getInstance(): PeerService {
    if (!PeerService.instance) {
      PeerService.instance = new PeerService();
    }
    return PeerService.instance;
  }

  async initialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.peer) {
        resolve(this.peer.id);
        return;
      }

      this.peer = new Peer();

      this.peer.on('open', (id) => {
        console.log('My peer ID is:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      this.peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        reject(error);
      });
    });
  }

  private handleConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data: any) => {
      this.messageHandlers.forEach(handler => handler(data));
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  async connectToPeer(peerId: string): Promise<void> {
    if (!this.peer) throw new Error('PeerService not initialized');
    
    if (this.connections.has(peerId)) {
      return;
    }

    const conn = this.peer.connect(peerId);
    return new Promise((resolve, reject) => {
      conn.on('open', () => {
        this.handleConnection(conn);
        resolve();
      });

      conn.on('error', (error) => {
        reject(error);
      });
    });
  }

  broadcastToRoom(room: Room, data: any) {
    if (!this.peer) throw new Error('PeerService not initialized');
    
    this.connections.forEach(conn => {
      conn.send({
        type: 'message',
        roomId: room.id,
        data
      });
    });
  }

  broadcastToPeers(data: any) {
    if (!this.peer) throw new Error('PeerService not initialized');
    
    this.connections.forEach(conn => {
      conn.send(data);
    });
  }

  announceRoom(room: Room) {
    if (!this.peer) throw new Error('PeerService not initialized');
    
    this.connections.forEach(conn => {
      conn.send({
        type: 'room_announcement',
        room
      });
    });
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onRoomUpdate(handler: (room: Room) => void) {
    this.roomUpdateHandlers.add(handler);
    return () => this.roomUpdateHandlers.delete(handler);
  }

  disconnect() {
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
  }

  get id(): string | undefined {
    return this.peer?.id;
  }
}