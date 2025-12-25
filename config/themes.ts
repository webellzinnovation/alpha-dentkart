// Available Themes Configuration

export interface Theme {
    id: string;
    name: string;
    description: string;
    preview: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

export const AVAILABLE_THEMES: Theme[] = [
    {
        id: 'modern-pink',
        name: 'Modern Pink',
        description: 'Clean and modern design with pink accents (Current)',
        preview: '/themes/modern-pink-preview.jpg',
        colors: {
            primary: '#DD3B5F',
            secondary: '#F472B6',
            accent: '#EC4899',
        },
    },
    {
        id: 'minimal-blue',
        name: 'Minimal Blue',
        description: 'Clean minimalist design with blue tones',
        preview: '/themes/minimal-blue-preview.jpg',
        colors: {
            primary: '#2563EB',
            secondary: '#60A5FA',
            accent: '#3B82F6',
        },
    },
    {
        id: 'bold-dark',
        name: 'Bold Dark',
        description: 'Modern dark theme with neon accents',
        preview: '/themes/bold-dark-preview.jpg',
        colors: {
            primary: '#10B981',
            secondary: '#F59E0B',
            accent: '#8B5CF6',
        },
    },
    {
        id: 'elegant-purple',
        name: 'Elegant Purple',
        description: 'Sophisticated purple and gold theme',
        preview: '/themes/elegant-purple-preview.jpg',
        colors: {
            primary: '#9333EA',
            secondary: '#C084FC',
            accent: '#A855F7',
        },
    },
    {
        id: 'fresh-green',
        name: 'Fresh Green',
        description: 'Natural green theme for organic products',
        preview: '/themes/fresh-green-preview.jpg',
        colors: {
            primary: '#059669',
            secondary: '#34D399',
            accent: '#10B981',
        },
    },
];

export const getThemeById = (id: string): Theme | undefined => {
    return AVAILABLE_THEMES.find(theme => theme.id === id);
};

export const getDefaultTheme = (): Theme => {
    return AVAILABLE_THEMES[0]; // Modern Pink
};
