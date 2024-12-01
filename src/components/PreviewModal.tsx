import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export function PreviewModal({ isOpen, onClose, fileUrl, fileName, fileType }: PreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    const loadContent = async () => {
      try {
        if (fileType.startsWith('text/')) {
          const text = await fetch(fileUrl).then(r => r.text());
          setContent(text);
        } else {
          setContent(fileUrl);
        }
      } catch (err) {
        console.error('Failed to load file:', err);
        setError('Failed to load file preview');
      }
    };

    loadContent();
  }, [fileUrl, fileType, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">{fileName}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
          {error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : fileType.startsWith('image/') ? (
            <img
              src={content || ''}
              alt={fileName}
              className="max-w-full h-auto mx-auto"
            />
          ) : fileType === 'application/pdf' ? (
            <iframe
              src={content || ''}
              className="w-full h-[calc(90vh-8rem)]"
              title={fileName}
            />
          ) : fileType.startsWith('text/') ? (
            <pre className="whitespace-pre-wrap font-mono text-sm dark:text-white">
              {content}
            </pre>
          ) : (
            <div className="text-center p-4 text-gray-500">
              Preview not available for this file type
            </div>
          )}
        </div>
      </div>
    </div>
  );
}