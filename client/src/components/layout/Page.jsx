import React from 'react';

const Page = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen overflow-hidden bg-surface ${className}`}>
      {children}
    </div>
  );
};

export default Page;


