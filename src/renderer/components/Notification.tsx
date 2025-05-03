import React from 'react';

export interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  if (!message) return null;
  
  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  return (
    <div className={`${bgColors[type]} text-white px-4 py-2 rounded-md mt-2 text-sm transition-opacity duration-300 opacity-90`}>
      {message}
    </div>
  );
};

export default Notification; 