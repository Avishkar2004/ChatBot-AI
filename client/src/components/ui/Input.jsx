import React from 'react';

export default function Input({ label, hint, id, className = '', ...props }) {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-sm text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <input id={id} className={`input ${className}`} {...props} />
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}


