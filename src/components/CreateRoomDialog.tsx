import { useState } from 'react';
import { X, Lock, Globe, Clock } from 'lucide-react';
import { RoomCreationData } from '../types';

interface CreateRoomDialogProps {
  onClose: () => void;
  onCreateRoom: (data: RoomCreationData) => void;
}

export function CreateRoomDialog({ onClose, onCreateRoom }: CreateRoomDialogProps) {
  const [formData, setFormData] = useState<RoomCreationData>({
    name: '',
    description: '',
    isPrivate: false,
    tags: [],
    expiresIn: null,
    metadata: {
      maxParticipants: 50,
      allowFiles: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      fileExpiration: 24 * 60 * 60 * 1000, // 24 hours
    }
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const expirationOptions = [
    { value: null, label: 'Never' },
    { value: 3600000, label: '1 hour' },
    { value: 86400000, label: '24 hours' },
    { value: 604800000, label: '7 days' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Create New Room</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Expiration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {expirationOptions.map(option => (
                <button
                  key={option.value?.toString()}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, expiresIn: option.value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    formData.expiresIn === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Clock size={16} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File Sharing
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.metadata.allowFiles}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, allowFiles: e.target.checked }
                  }))}
                  className="rounded"
                />
                Allow file sharing
              </label>
              
              {formData.metadata.allowFiles && (
                <div className="ml-6 space-y-2">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Max file size</label>
                    <select
                      value={formData.metadata.maxFileSize}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, maxFileSize: Number(e.target.value) }
                      }))}
                      className="ml-2 px-2 py-1 rounded border dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value={10485760}>10 MB</option>
                      <option value={52428800}>50 MB</option>
                      <option value={104857600}>100 MB</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">File expiration</label>
                    <select
                      value={formData.metadata.fileExpiration}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, fileExpiration: Number(e.target.value) }
                      }))}
                      className="ml-2 px-2 py-1 rounded border dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value={3600000}>1 hour</option>
                      <option value={86400000}>24 hours</option>
                      <option value={604800000}>7 days</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!formData.isPrivate}
                onChange={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                className="w-4 h-4"
              />
              <Globe size={16} />
              Public Room
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.isPrivate}
                onChange={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                className="w-4 h-4"
              />
              <Lock size={16} />
              Private Room
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}