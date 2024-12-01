import { Globe, Lock, Server, Shield, Fingerprint, Users, Webhook } from 'lucide-react';

interface RoomTypeSelectorProps {
  selected: 'public' | 'private';
  onChange: (type: 'public' | 'private') => void;
}

export function RoomTypeSelector({ selected, onChange }: RoomTypeSelectorProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <button
        onClick={() => onChange('public')}
        className={`p-6 rounded-xl border-2 transition-all text-left ${
          selected === 'public'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
          <Globe className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Public Room</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Create or join a discoverable room that anyone can find and participate in.
          Perfect for open communities and public discussions.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Server className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">Distributed Hash Table (DHT)</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Rooms are indexed in a decentralized network for discovery
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">End-to-End Encryption</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All messages are encrypted using AES-GCM encryption
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">WebRTC P2P</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Direct peer-to-peer connections between participants
              </p>
            </div>
          </div>
        </div>
      </button>

      <button
        onClick={() => onChange('private')}
        className={`p-6 rounded-xl border-2 transition-all text-left ${
          selected === 'private'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
        }`}
      >
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4">
          <Lock className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Private Room</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Create an invitation-only room with enhanced privacy. Only people with the invite
          link can join. Perfect for private conversations.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Fingerprint className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">Invite-Only Access</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Secure invite links with encryption keys for access control
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">Enhanced Encryption</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Double-layer encryption with ephemeral keys for maximum privacy
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Webhook className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">Direct P2P Only</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No DHT indexing, completely private room discovery
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}