import { useEffect, useState, useRef } from 'react';
import './index.css';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ConnectionStatus } from './components/ConnectionStatus';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Settings } from './components/Settings';
import { PrivacyBar } from './components/PrivacyBar';
import { ChatState, Message, UserPreferences } from './types';
import { EncryptionService } from './services/encryption';
import { PeerService } from './services/PeerService';
import { LogOut } from 'lucide-react';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  messageLifetime: null,
  isAnonymous: false,
  privacyLevel: 'standard'
};

function App() {
  const [state, setState] = useState<ChatState>({
    connected: false,
    messages: [],
    nickname: '',
    theme: DEFAULT_PREFERENCES.theme,
    isAnonymous: DEFAULT_PREFERENCES.isAnonymous,
    messageLifetime: DEFAULT_PREFERENCES.messageLifetime,
    privacyLevel: DEFAULT_PREFERENCES.privacyLevel
  });
  
  const peerService = useRef(PeerService.getInstance());
  const encryptionService = useRef(EncryptionService.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('chatPreferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences) as UserPreferences;
      setState(prev => ({ ...prev, ...preferences }));
    }
  }, []);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Initialize peer connection when nickname is set
  useEffect(() => {
    if (!state.nickname) return;

    const initializePeer = async () => {
      try {
        await peerService.current.initialize();
        setState(prev => ({ ...prev, connected: true }));

        // Set up message handler
        peerService.current.onMessage((data) => {
          if (data.type === 'chat') {
            handleIncomingMessage(data.message);
          }
        });
      } catch (error) {
        console.error('Failed to initialize peer:', error);
        setState(prev => ({ ...prev, connected: false }));
      }
    };

    initializePeer();

    return () => {
      peerService.current.disconnect();
    };
  }, [state.nickname]);

  // Clean up expired messages
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.expiresAt || msg.expiresAt > now)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleIncomingMessage = async (message: Message) => {
    if (message.isEncrypted && message.iv) {
      try {
        const decryptedContent = await encryptionService.current.decryptMessage(
          message.content,
          message.iv,
          message.keyId || ''
        );
        message.content = decryptedContent;
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        message.content = '[Encrypted message - decryption failed]';
      }
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        ...message,
        expiresAt: state.messageLifetime 
          ? Date.now() + state.messageLifetime 
          : undefined
      }]
    }));
  };

  const sendTextMessage = async (content: string) => {
    if (!content.trim()) return;

    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    let encryptedContent = content;
    let iv = '';
    let keyId = '';
    
    if (state.privacyLevel !== 'basic') {
      const encrypted = await encryptionService.current.encryptMessage(content);
      encryptedContent = encrypted.ciphertext;
      iv = encrypted.iv;
      keyId = encrypted.keyId;
    }

    const message: Message = {
      id: messageId,
      sender: state.nickname,
      timestamp,
      content: encryptedContent,
      type: 'text',
      isEncrypted: state.privacyLevel !== 'basic',
      iv,
      keyId,
      expiresAt: state.messageLifetime ? timestamp + state.messageLifetime : undefined
    };

    // Broadcast to peers
    peerService.current.broadcastToRoom(state.currentRoom!, {
      type: 'chat',
      message
    });

    // Add to local messages
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { ...message, content }]
    }));
  };

  const sendFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const messageId = crypto.randomUUID();
      const timestamp = Date.now();
      let encryptedContent = content;
      let iv = '';
      let keyId = '';

      if (state.privacyLevel !== 'basic') {
        const encrypted = await encryptionService.current.encryptMessage(content);
        encryptedContent = encrypted.ciphertext;
        iv = encrypted.iv;
        keyId = encrypted.keyId;
      }

      const message: Message = {
        id: messageId,
        sender: state.nickname,
        timestamp,
        content: encryptedContent,
        type: 'file',
        isEncrypted: state.privacyLevel !== 'basic',
        iv,
        keyId,
        fileMetadata: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        expiresAt: state.messageLifetime ? timestamp + state.messageLifetime : undefined
      };

      // Broadcast to peers
      peerService.current.broadcastToRoom(state.currentRoom!, {
        type: 'chat',
        message
      });

      // Add to local messages
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { ...message, content }]
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleNicknameSubmit = async (nickname: string, password: string, privacyLevel: string) => {
    setState(prev => ({ 
      ...prev, 
      nickname,
      encryptionPassword: password,
      privacyLevel: privacyLevel as any
    }));

    if (privacyLevel !== 'basic') {
      await encryptionService.current.initialize(password, privacyLevel as any);
    }
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    setState(prev => {
      const newState = { ...prev, ...preferences };
      localStorage.setItem('chatPreferences', JSON.stringify({
        theme: newState.theme,
        messageLifetime: newState.messageLifetime,
        isAnonymous: newState.isAnonymous,
        privacyLevel: newState.privacyLevel
      }));
      return newState;
    });
  };

  const handleExit = () => {
    // Disconnect from peers
    peerService.current.disconnect();
    
    // Clear encryption service state
    encryptionService.current.cleanup();
    
    // Reset state
    setState(prev => ({
      ...prev,
      connected: false,
      messages: [],
      nickname: '',
      currentRoom: undefined
    }));
  };

  if (!state.nickname) {
    return (
      <div className={state.theme === 'dark' ? 'dark' : ''}>
        <WelcomeScreen 
          onNicknameSubmit={handleNicknameSubmit}
          preferences={{
            theme: state.theme,
            messageLifetime: state.messageLifetime,
            isAnonymous: state.isAnonymous,
            privacyLevel: state.privacyLevel
          }}
          onUpdatePreferences={updatePreferences}
        />
      </div>
    );
  }

  return (
    <div className={`${state.theme === 'dark' ? 'dark' : ''} h-screen`}>
      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold dark:text-white">ChatterLink</h1>
            <div className="flex items-center gap-4">
              <ConnectionStatus connected={state.connected} />
              <button
                onClick={handleExit}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                title="Exit Room"
              >
                <LogOut size={18} />
                <span>Exit</span>
              </button>
            </div>
          </div>
          
          <Settings
            preferences={{
              theme: state.theme,
              messageLifetime: state.messageLifetime,
              isAnonymous: state.isAnonymous,
              privacyLevel: state.privacyLevel
            }}
            onUpdatePreferences={updatePreferences}
          />

          <PrivacyBar
            privacyLevel={state.privacyLevel}
            messageLifetime={state.messageLifetime}
            isAnonymous={state.isAnonymous}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto">
            {state.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.sender === state.nickname}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput
              onSendMessage={sendTextMessage}
              onSendFile={sendFile}
              disabled={!state.connected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;