import React from 'react';

export default function Card({ className = '', children }) {
    return <div className={`glass rounded-xl ${className}`}>{children}</div>;
}


