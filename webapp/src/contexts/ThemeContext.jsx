'use client';

import React, {createContext, useContext, useEffect, useState} from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({children}) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            setIsDark(savedTheme === 'dark');
        } else {
            setIsDark(prefersDark);
        }
    }, []);

    useEffect(() => {
        // Update document class and localStorage when theme changes
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{isDark, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
};
