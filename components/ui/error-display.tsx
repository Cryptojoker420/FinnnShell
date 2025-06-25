import React from 'react';
import { Button } from './button';

interface ErrorDisplayProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 text-red-600">
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error?.message || 'An unexpected error occurred'}
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-2"
        >
          Try Again
        </Button>
      )}
    </div>
  );
} 