import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId = 'theme-1' | 'theme-2';

interface ThemeContextType {
    currentTheme: ThemeId;
    setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
        // Load theme from localStorage on mount
        const saved = localStorage.getItem('alpha_theme');
        return (saved === 'theme-2' ? 'theme-2' : 'theme-1') as ThemeId;
    });

    const setTheme = (theme: ThemeId) => {
        setCurrentTheme(theme);
        localStorage.setItem('alpha_theme', theme);
    };

    useEffect(() => {
        // Apply theme class to body
        document.body.className = currentTheme === 'theme-2'
            ? 'theme-2-service-style'
            : '';
    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
