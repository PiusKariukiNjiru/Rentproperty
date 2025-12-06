import React from 'react';

interface BadgeProps {
  text: string;
  color?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'warning' | 'neutral' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ text, color = 'neutral', size = 'md', icon }) => {
  const colorClasses = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    accent: 'bg-accent text-primary',
    danger: 'bg-danger text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white',
    neutral: 'bg-neutral text-neutral-dark',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </span>
  );
};

export default Badge;