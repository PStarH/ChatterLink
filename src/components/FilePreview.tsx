import { useEffect, useState } from 'react';
import { File, Image, FileText, Film, Music, Package } from 'lucide-react';

interface FilePreviewProps {
  content: string;
  type: string;
  name: string;
  size: number;
  onClick?: () => void;
  className?: string;
}

export function FilePreview({ content, type, name, size, onClick, className = '' }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!content) return;

    const loadPreview = async () => {
      try {
        if (type.startsWith('image/')) {
          setPreview(content);
        } else if (type === 'application/pdf') {
          // Show first page as thumbnail
          setPreview('/pdf-preview.png'); // You could generate this dynamically
        } else if (type.startsWith('text/')) {
          // For text files, show the first few lines
          const text = await fetch(content).then(r => r.text());
          const preview = text.split('\n').slice(0, 3).join('\n');
          setPreview(preview);
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
        setError(true);
      }
    };

    loadPreview();
  }, [content, type]);

  const getFileIcon = () => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('text/')) return FileText;
    if (type.startsWith('video/')) return Film;
    if (type.startsWith('audio/')) return Music;
    return Package;
  };

  const FileIcon = getFileIcon();

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded bg-gray-100 dark:bg-gray-800 ${className}`}>
        <File className="text-gray-500" size={24} />
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm">{name}</div>
          <div className="text-xs text-gray-500">Preview not available</div>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div 
        className={`flex items-center gap-2 p-2 rounded bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
        onClick={onClick}
      >
        <FileIcon className="text-gray-500" size={24} />
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm">{name}</div>
          <div className="text-xs text-gray-500">{formatSize(size)}</div>
        </div>
      </div>
    );
  }

  if (type.startsWith('image/')) {
    return (
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img 
          src={preview} 
          alt={name}
          className="max-w-[200px] max-h-[200px] rounded object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity">
          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Click to preview
          </div>
        </div>
      </div>
    );
  }

  if (type === 'application/pdf') {
    return (
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img 
          src={preview}
          alt="PDF Preview"
          className="w-[200px] h-[200px] rounded object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity">
          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Click to preview PDF
          </div>
        </div>
      </div>
    );
  }

  if (type.startsWith('text/')) {
    return (
      <div 
        className={`p-2 rounded bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="text-gray-500" size={24} />
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm">{name}</div>
            <div className="text-xs text-gray-500">{formatSize(size)}</div>
          </div>
        </div>
        <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
          {preview}
        </pre>
      </div>
    );
  }

  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}