import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SecurityIndicatorProps {
  isEncrypted: boolean;
  isVerified: boolean;
  privacyLevel: 'basic' | 'standard' | 'maximum';
}

export function SecurityIndicator({ isEncrypted, isVerified, privacyLevel }: SecurityIndicatorProps) {
  const getIcon = () => {
    if (privacyLevel === 'maximum') return ShieldAlert;
    if (privacyLevel === 'standard') return ShieldCheck;
    return Shield;
  };

  const Icon = getIcon();

  const getStatusColor = () => {
    if (!isEncrypted) return 'text-gray-400';
    if (!isVerified) return 'text-orange-500';
    if (privacyLevel === 'maximum') return 'text-purple-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!isEncrypted) return 'Not Encrypted';
    if (!isVerified) return 'Encrypted (Unverified)';
    return `${privacyLevel.charAt(0).toUpperCase() + privacyLevel.slice(1)} Security`;
  };

  return (
    <div className={`flex items-center gap-1 ${getStatusColor()}`}>
      <Icon size={16} />
      <span className="text-sm">{getStatusText()}</span>
    </div>
  );
}