import { Shield, ShieldCheck, ShieldAlert, Clock, UserX } from 'lucide-react';
import { PrivacyLevel } from '../types';
import { PRIVACY_CONFIGS } from '../services/encryption';

interface PrivacyBarProps {
  privacyLevel: PrivacyLevel;
  messageLifetime: number | null;
  isAnonymous: boolean;
}

export function PrivacyBar({ privacyLevel, messageLifetime, isAnonymous }: PrivacyBarProps) {
  const config = PRIVACY_CONFIGS[privacyLevel];
  
  const PrivacyIcon = {
    'shield': Shield,
    'shield-check': ShieldCheck,
    'shield-alert': ShieldAlert
  }[config.icon];

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm">
      <div className={`flex items-center gap-1 ${config.color} dark:opacity-90`}>
        <PrivacyIcon size={16} />
        <span>{config.name} Privacy</span>
      </div>
      
      {messageLifetime && (
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <Clock size={16} />
          <span>Messages expire in {messageLifetime / 1000}s</span>
        </div>
      )}
      
      {isAnonymous && (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <UserX size={16} />
          <span>Anonymous Mode</span>
        </div>
      )}
    </div>
  );
}