import { Send } from 'lucide-react';
import { useState } from 'react';
import { FileUpload } from './FileUpload';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  disabled: boolean;
}

export function ChatInput({ onSendMessage, onSendFile, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
      <div className="flex-1 flex items-center gap-2 px-4 py-2 border dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? 'Connecting...' : 'Type a message...'}
          className="flex-1 bg-transparent focus:outline-none dark:text-white disabled:text-gray-500"
        />
        <FileUpload onFileSelect={onSendFile} disabled={disabled} />
      </div>
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Send size={18} />
        Send
      </button>
    </form>
  );
}