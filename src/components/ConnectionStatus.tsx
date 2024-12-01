import { WifiOff, Wifi } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
        connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {connected ? (
        <>
          <Wifi size={16} />
          Connected
        </>
      ) : (
        <>
          <WifiOff size={16} />
          Disconnected
        </>
      )}
    </div>
  );
}