'use client';

import React from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertBannerProps {
  type?: AlertType;
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const stylesByType: Record<AlertType, { container: string; icon: string; title: string; text: string }> = {
  success: {
    container: 'border',
    icon: '',
    title: '',
    text: '',
  },
  error: {
    container: 'bg-red-50 border border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    text: 'text-red-700',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
};

export default function AlertBanner({ type = 'info', title, message, onClose, className = '' }: AlertBannerProps) {
  const styles = stylesByType[type];
  const icon = type === 'success' ? '✅' : type === 'error' ? '⛔' : type === 'warning' ? '⚠️' : 'ℹ️';

  return (
    <div 
      className={`rounded-md p-4 flex items-start gap-3 ${styles.container} ${className}`}
      style={type === 'success' ? {
        backgroundColor: '#F3E5F2',
        borderColor: '#C70CB9'
      } : {}}
    >
      <div 
        className={`text-lg ${styles.icon}`} 
        aria-hidden
        style={type === 'success' ? {color: '#C70CB9'} : {}}
      >
        {icon}
      </div>
      <div className="flex-1">
        {title && (
          <div 
            className={`font-semibold ${styles.title}`}
            style={type === 'success' ? {color: '#A00A9A'} : {}}
          >
            {title}
          </div>
        )}
        <div 
          className={`text-sm ${styles.text}`}
          style={type === 'success' ? {color: '#C70CB9'} : {}}
        >
          {message}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  );
}


