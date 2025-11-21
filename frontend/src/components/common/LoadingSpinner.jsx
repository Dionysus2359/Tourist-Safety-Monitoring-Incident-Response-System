import React from 'react';

export default function LoadingSpinner({
  size = 'medium',
  color = 'green',
  fullScreen = false,
  message = 'Loading...'
}) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    green: 'border-green-400',
    blue: 'border-blue-400',
    gray: 'border-gray-400',
    white: 'border-white'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinner}
    </div>
  );
}

// Specialized loading components
export function PageLoading({ message = 'Loading page...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="xl" message={message} />
    </div>
  );
}

export function ButtonLoading({ message = 'Processing...' }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="small" color="white" message="" />
      <span>{message}</span>
    </div>
  );
}

export function InlineLoading({ message = 'Loading...' }) {
  return (
    <div className="flex items-center space-x-2 py-2">
      <LoadingSpinner size="small" message="" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}
