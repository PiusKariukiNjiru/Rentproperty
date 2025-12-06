import React from 'react';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from './icons'; // Assuming InformationCircleIcon exists or create one

const Toast: React.FC<{ message: string; type: string; onClose: () => void }> = ({ message, type, onClose }) => {
  let bgColorClass = 'bg-blue-500';
  let textColorClass = 'text-white';
  let IconComponent;

  switch (type) {
    case 'success':
      bgColorClass = 'bg-green-500';
      IconComponent = CheckCircleIcon;
      break;
    case 'error':
      bgColorClass = 'bg-red-500';
      IconComponent = ExclamationCircleIcon;
      break;
    case 'warning':
      bgColorClass = 'bg-yellow-500';
      IconComponent = ExclamationCircleIcon; // Or a specific warning icon
      break;
    case 'info':
    default:
      bgColorClass = 'bg-primary'; // Using primary for info
      IconComponent = InformationCircleIcon; // Placeholder
      break;
  }
  
  // A simple InformationCircleIcon if not available in icons.tsx
   if (type === 'info' && !IconComponent) {
    IconComponent = () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    );
  }


  return (
    <div 
        className={`${bgColorClass} ${textColorClass} p-4 rounded-md shadow-lg flex items-center justify-between animate-fadeInRight`}
        role="alert"
        aria-live="assertive"
    >
      <div className="flex items-center">
        {IconComponent && <IconComponent className="w-6 h-6 mr-3 flex-shrink-0" />}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors" aria-label="Close notification">
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const ToastNotifications: React.FC = () => {
  const { toasts, addToast } = useToast(); // addToast is available if manual removal is needed, but not used here for auto-dismiss

  const removeToast = (id: string) => {
    // This function could be used if manual close needed to update context state,
    // but setTimeout in provider handles auto-removal. Here, it's for the button.
    // To make button fully remove from state:
    // setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
    // This would require setToasts in ToastContext. For simplicity, just visual close.
  };


  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-[200]" style={{maxWidth: '350px'}}>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type}
          onClose={() => removeToast(toast.id)} // Visually closes, provider handles actual removal
        />
      ))}
    </div>
  );
};

export default ToastNotifications;

// Add this basic CSS for animation if not using a utility library that provides it
// Or add to index.html style block
/*
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fadeInRight {
  animation: fadeInRight 0.3s ease-out forwards;
}
*/
