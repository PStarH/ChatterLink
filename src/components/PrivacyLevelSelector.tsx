import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PrivacyLevel } from '../types';
import { PRIVACY_CONFIGS } from '../services/encryption';

interface PrivacyLevelSelectorProps {
  selected: PrivacyLevel;
  onChange: (level: PrivacyLevel) => void;
}

export function PrivacyLevelSelector({ selected, onChange }: PrivacyLevelSelectorProps) {
  const levels: PrivacyLevel[] = ['basic', 'standard', 'maximum'];

  return (
    <div className="grid grid-cols-3 gap-4">
      {levels.map(level => {
        const config = PRIVACY_CONFIGS[level];
        const Icon = {
          'shield': Shield,
          'shield-check': ShieldCheck,
          'shield-alert': ShieldAlert
        }[config.icon];

        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selected === level
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <div className={`${config.color} flex justify-center mb-2`}>
              <Icon size={24} />
            </div>
            <h3 className="font-medium dark:text-white mb-1">{config.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {config.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}