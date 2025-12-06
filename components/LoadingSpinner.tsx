
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div 
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
      ></div>
      {message && <p className="text-primary text-sm">{message}</p>}
    </div>
  );
};


export const FullPageLoader: React.FC<{ message?: string}> = ({ message = "Loading..."}) => {
    return (
        <div className="fixed inset-0 bg-neutral-light bg-opacity-75 flex items-center justify-center z-[200]">
            <LoadingSpinner size="lg" message={message} />
        </div>
    )
}


export default LoadingSpinner;
