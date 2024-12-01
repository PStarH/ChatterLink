import { Moon, Sun, Clock, UserX } from 'lucide-react';
import { UserPreferences } from '../types';

interface SettingsProps {
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => void;
}

export function Settings({ preferences, onUpdatePreferences }: SettingsProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div className="max-w-3xl mx-auto flex flex-wrap gap-4 items-center justify-between">
        <button
          onClick={() => onUpdatePreferences({ 
            theme: preferences.theme === 'light' ? 'dark' : 'light' 
          })}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {preferences.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button
          onClick={() => onUpdatePreferences({ 
            messageLifetime: preferences.messageLifetime ? null : 30000 
          })}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            preferences.messageLifetime
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Clock size={16} />
          {preferences.messageLifetime ? 'Ephemeral' : 'Permanent'}
        </button>

        <button
          onClick={() => onUpdatePreferences({ isAnonymous: !preferences.isAnonymous })}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            preferences.isAnonymous
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <UserX size={16} />
          {preferences.isAnonymous ? 'Anonymous' : 'Named'}
        </button>
      </div>
    </div>
  );
}