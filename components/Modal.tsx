
import React, { ReactNode } from 'react';
import { XMarkIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose} // Close on overlay click
    >
      <div 
        className={`bg-white rounded-lg shadow-xl p-6 relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-neutral-dark hover:text-black"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        {title && <h2 className="text-2xl font-semibold mb-4 text-primary">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
