
import { Wifi, WifiOff, RotateCw } from 'lucide-react';
import type { ConnectionStatusProps } from '../../types';

const statusConfig = {
  connected: {
    icon: Wifi,
    text: 'Connected',
    className: 'text-success-600',
  },
  disconnected: {
    icon: WifiOff,
    text: 'Disconnected',
    className: 'text-danger-600',
  },
  connecting: {
    icon: RotateCw,
    text: 'Connecting...',
    className: 'text-warning-600',
  },
};

export function ConnectionStatus({ status, className = '' }: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`connection-indicator ${status} ${className}`}>
      <Icon 
        className={`w-4 h-4 ${status === 'connecting' ? 'animate-spin' : ''} ${config.className}`} 
      />
      <span className={`text-sm font-medium ${config.className}`}>
        {config.text}
      </span>
    </div>
  );
}

interface ConnectionBannerProps {
  status: 'connected' | 'disconnected' | 'connecting';
  onRetry?: () => void;
}

export function ConnectionBanner({ status, onRetry }: ConnectionBannerProps) {
  if (status === 'connected') return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 px-4 py-2 text-center text-sm font-medium ${
      status === 'disconnected' 
        ? 'bg-danger-100 text-danger-800 border-b border-danger-200' 
        : 'bg-warning-100 text-warning-800 border-b border-warning-200'
    }`}>
      <div className="flex items-center justify-center gap-2">
        <ConnectionStatus status={status} />
        {status === 'disconnected' && onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
} 