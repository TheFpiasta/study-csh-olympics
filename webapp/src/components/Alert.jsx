'use client';

import {useState} from 'react';

const Alert = ({
                   type = 'info',
                   title,
                   children,
                   dismissible = false,
                   onDismiss,
                   className = ''
               }) => {
    const [isVisible, setIsVisible] = useState(true);

    const typeStyles = {
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    };

    const iconStyles = {
        info: '💡',
        success: '✅',
        warning: '⚠️',
        error: '❌',
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className={`
      rounded-xl border p-4 transition-all duration-300 ease-in-out
      ${typeStyles[type]}
      ${className}
    `}>
            <div className="flex items-start">
                <div className="flex-shrink-0 text-lg mr-3">
                    {iconStyles[type]}
                </div>
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className="text-sm font-semibold mb-1">
                            {title}
                        </h3>
                    )}
                    <div className="text-sm">
                        {children}
                    </div>
                </div>
                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 ml-3 text-lg hover:opacity-70 transition-opacity"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default Alert;
