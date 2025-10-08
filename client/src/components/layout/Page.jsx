import React from 'react';

const Page = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      {children}
    </div>
  );
};

export default Page;


