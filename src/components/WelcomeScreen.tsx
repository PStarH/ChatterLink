import { ArrowRight, Key, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { Settings } from './Settings';
import { UserPreferences, PrivacyLevel } from '../types';
import { EncryptionService } from '../services/encryption';
import { PrivacyLevelSelector } from './PrivacyLevelSelector';
import { RoomTypeSelector } from './RoomTypeSelector';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface WelcomeScreenProps {
  onNicknameSubmit: (nickname: string, password: string, privacyLevel: PrivacyLevel) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => void;
}

export function WelcomeScreen({ 
  onNicknameSubmit, 
  preferences,
  onUpdatePreferences 
}: WelcomeScreenProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    setIsGeneratingPassword(true);
    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setPassword(randomPassword);
    setIsGeneratingPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password && preferences.privacyLevel !== 'basic') return;

    try {
      const encryptionService = EncryptionService.getInstance();
      await encryptionService.initialize(password, preferences.privacyLevel);
      
      if (preferences.isAnonymous || nickname.trim()) {
        onNicknameSubmit(
          preferences.isAnonymous ? 'Anonymous' : nickname.trim(),
          password,
          preferences.privacyLevel
        );
      }
    } catch (error) {
      console.error('Error initializing encryption:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-3xl p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">
          Welcome to ChatterLink
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Secure, private, and decentralized P2P messaging
        </p>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Choose Room Type</h2>
          <RoomTypeSelector 
            selected={roomType}
            onChange={setRoomType}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Choose Privacy Level</h2>
          <PrivacyLevelSelector 
            selected={preferences.privacyLevel} 
            onChange={(level) => onUpdatePreferences({ privacyLevel: level })}
          />
        </div>

        <Settings
          preferences={preferences}
          onUpdatePreferences={onUpdatePreferences}
        />
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {!preferences.isAnonymous && (
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
            </div>
          )}

          {preferences.privacyLevel !== 'basic' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Encryption Password
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter or generate a password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  disabled={isGeneratingPassword}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Key size={18} />
                </button>
              </div>
              <div className="mt-2">
                <PasswordStrengthMeter password={password} />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Share this password with people you want to chat with
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={(!preferences.isAnonymous && !nickname.trim()) || (preferences.privacyLevel !== 'basic' && !password)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:disabled:bg-gray-700"
          >
            {roomType === 'public' ? 'Join Public Room' : 'Create Private Room'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}