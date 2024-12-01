import { Download, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Message } from '../types';
import { EncryptionService } from '../services/encryption';
import { FilePreview } from './FilePreview';
import { PreviewModal } from './PreviewModal';
import { SecurityIndicator } from './SecurityIndicator';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  onSearch?: (text: string) => void;
}

export function ChatMessage({ message, isOwnMessage, onSearch }: ChatMessageProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isRead, setIsRead] = useState(false);

  const handleFileDownload = async () => {
    if (message.type !== 'file' || !message.fileMetadata) return;

    try {
      const response = await fetch(message.content);
      const blob = await response.blob();
      
      const encryptionService = EncryptionService.getInstance();
      const decryptedBlob = message.isEncrypted && message.iv
        ? await encryptionService.decryptFile(blob, message.iv)
        : blob;

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.fileMetadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleTextClick = (text: string) => {
    if (onSearch) {
      onSearch(text);
    }
  };

  return (
    <>
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-bl-none'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold">
              {isOwnMessage ? 'You' : message.sender}
            </span>
            <SecurityIndicator
              isEncrypted={message.isEncrypted}
              isVerified={!!message.signature}
              privacyLevel={message.privacyLevel || 'basic'}
            />
          </div>
          
          {message.type === 'text' ? (
            <div 
              className="break-words cursor-pointer hover:underline"
              onClick={() => handleTextClick(message.content)}
            >
              {message.content}
            </div>
          ) : (
            <div className="space-y-2">
              <FilePreview
                content={message.content}
                type={message.fileMetadata?.type || ''}
                name={message.fileMetadata?.name || ''}
                size={message.fileMetadata?.size || 0}
                onClick={() => setShowPreview(true)}
              />
              <button
                onClick={handleFileDownload}
                className="flex items-center gap-2 text-sm hover:opacity-80"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-1 text-xs opacity-70">
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            {isOwnMessage && (
              <span className="flex items-center gap-1">
                {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </div>
        </div>
      </div>

      {message.type === 'file' && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          fileUrl={message.content}
          fileName={message.fileMetadata?.name || ''}
          fileType={message.fileMetadata?.type || ''}
        />
      )}
    </>
  );
}