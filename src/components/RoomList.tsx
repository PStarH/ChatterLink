import { Hash, Lock, Users, Plus, Search, Tag, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { RoomMetadata } from '../types';
import { DHTService } from '../services/DHTService';
import { RoomCreation } from './RoomCreation';

interface RoomListProps {
  onJoinRoom: (roomId: string) => void;
  onJoinPrivateRoom: (inviteLink: string) => void;
}

export function RoomList({ onJoinRoom, onJoinPrivateRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomMetadata[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    loadRooms();
  }, [searchQuery, selectedTags]);

  const loadRooms = async () => {
    try {
      const dhtService = DHTService.getInstance();
      const rooms = await dhtService.searchRooms(searchQuery, selectedTags);
      setRooms(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleInviteLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteLink.trim()) {
      onJoinPrivateRoom(inviteLink.trim());
      setInviteLink('');
    }
  };

  const handleRoomCreated = (inviteLink?: string) => {
    setShowCreateRoom(false);
    if (inviteLink) {
      onJoinPrivateRoom(inviteLink);
    }
    loadRooms();
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Available Rooms</h2>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Room
          </button>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleInviteLinkSubmit} className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              onChange={e => setInviteLink(e.target.value)}
              placeholder="Paste private room invite link..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inviteLink.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300"
            >
              Join Private Room
            </button>
          </form>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search rooms..."
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1"
                >
                  <Tag size={14} />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {rooms.map(room => (
              <div
                key={room.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => onJoinRoom(room.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium dark:text-white flex items-center gap-2">
                    {room.isPrivate ? <Lock size={16} /> : <Hash size={16} />}
                    {room.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users size={16} />
                    {room.activeUsers}
                  </div>
                </div>

                {room.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {room.description}
                  </p>
                )}

                {room.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {room.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedTags.includes(tag)) {
                            setSelectedTags(prev => [...prev, tag]);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {rooms.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No rooms found. Create one to get started!
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateRoom && (
        <RoomCreation
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}