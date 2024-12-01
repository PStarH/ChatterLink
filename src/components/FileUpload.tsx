import { Upload, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { IPFSService } from '../services/IPFSService';
import { QuantumSafeEncryption } from '../services/QuantumSafeEncryption';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

export function FileUpload({ onFileSelect, disabled, maxSize = 100 * 1024 * 1024, allowedTypes }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const initServices = async () => {
      try {
        const ipfs = IPFSService.getInstance();
        await ipfs.initialize();
        
        const qse = QuantumSafeEncryption.getInstance();
        await qse.initialize();
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setError('Failed to initialize encryption services');
      }
    };

    initServices();
  }, []);

  const handleClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (maxSize && file.size > maxSize) {
      setError(`File too large. Maximum size is ${formatSize(maxSize)}`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      setError('File type not allowed');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Generate quantum-safe keys
      const qse = QuantumSafeEncryption.getInstance();
      const { publicKey, privateKey } = await qse.generateKeyPair();
      
      // Encrypt and upload to IPFS
      const buffer = await file.arrayBuffer();
      const encryptedData = await encryptFile(new Uint8Array(buffer), publicKey);
      
      const ipfs = IPFSService.getInstance();
      const cid = await ipfs.uploadFile(new File([encryptedData], file.name));
      
      // Pin the file for persistence
      await ipfs.pinFile(cid);
      
      // Create a metadata object with file info and encryption keys
      const metadata = {
        cid,
        name: file.name,
        size: file.size,
        type: file.type,
        publicKey: Array.from(publicKey),
        privateKey: Array.from(privateKey)
      };

      // Store metadata in local storage
      const fileMetadata = JSON.parse(localStorage.getItem('fileMetadata') || '{}');
      fileMetadata[cid] = metadata;
      localStorage.setItem('fileMetadata', JSON.stringify(fileMetadata));

      await onFileSelect(file);
    } catch (error) {
      setError('Failed to upload file');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const encryptFile = async (data: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> => {
    const qse = QuantumSafeEncryption.getInstance();
    const { sharedSecret, ciphertext } = await qse.encapsulate(publicKey);
    
    // Use the shared secret for AES encryption
    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV, ciphertext, and encrypted data
    const combined = new Uint8Array(iv.length + ciphertext.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(ciphertext, iv.length);
    combined.set(new Uint8Array(encryptedData), iv.length + ciphertext.length);

    return combined;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 relative"
      >
        {isUploading ? (
          <div className="flex items-center">
            <Loader2 size={20} className="animate-spin" />
            <span className="ml-2">{progress}%</span>
          </div>
        ) : (
          <Upload size={20} />
        )}
      </button>
      
      {error && (
        <div className="absolute bottom-full mb-2 left-0 bg-red-100 text-red-700 px-2 py-1 rounded text-sm whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}