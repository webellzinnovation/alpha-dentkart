// Theme Configuration Types

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}

export interface ThemeTypography {
    fontFamily: {
        heading: string;
        body: string;
    };
    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
    };
    fontWeight: {
        light: number;
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    };
}

export interface ThemeSpacing {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
}

export interface ThemeLayout {
    header: {
        style: 'fixed' | 'sticky' | 'static';
        height: string;
        transparent: boolean;
        blur: boolean;
    };
    footer: {
        style: 'minimal' | 'detailed' | 'compact';
    };
    container: {
        maxWidth: string;
        padding: string;
    };
    grid: {
        columns: {
            mobile: number;
            tablet: number;
            desktop: number;
        };
        gap: string;
    };
}

export interface ThemeMobileStyles {
    header: {
        style: 'centered' | 'left-aligned' | 'minimal';
        showSearch: boolean;
        showCart: boolean;
    };
    menu: {
        style: 'sidebar' | 'fullscreen' | 'bottom-sheet';
        width: string;
        position: 'left' | 'right';
    };
    productCard: {
        layout: 'vertical' | 'horizontal' | 'compact';
        imageRatio: string;
        showQuickView: boolean;
    };
    navigation: {
        style: 'bottom-bar' | 'floating' | 'hidden';
        icons: boolean;
    };
    spacing: {
        padding: string;
        gap: string;
    };
}

export interface ThemeComponentStyles {
    button: {
        borderRadius: string;
        padding: string;
        fontSize: string;
        fontWeight: number;
        shadow: boolean;
    };
    card: {
        borderRadius: string;
        shadow: string;
        border: boolean;
        hover: {
            scale: number;
            shadow: boolean;
        };
    };
    input: {
        borderRadius: string;
        border: boolean;
        focusRing: boolean;
    };
    badge: {
        borderRadius: string;
        fontSize: string;
        padding: string;
    };
}

export interface ThemePageStyles {
    homepage: {
        heroStyle: 'slider' | 'static' | 'video' | 'split';
        featuredLayout: 'grid' | 'carousel' | 'masonry';
        showCategories: boolean;
        showBrands: boolean;
    };
    productPage: {
        imageGallery: 'thumbnails' | 'dots' | 'stacked';
        layout: 'sidebar' | 'centered' | 'wide';
        showRelated: boolean;
        showReviews: boolean;
    };
    categoryPage: {
        layout: 'grid' | 'list' | 'mixed';
        filterPosition: 'sidebar' | 'top' | 'drawer';
        sortPosition: 'top' | 'inline';
    };
    cartPage: {
        layout: 'single-column' | 'two-column';
        showRecommendations: boolean;
    };
}

export interface ThemeConfiguration {
    id: string;
    name: string;
    description: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    spacing: ThemeSpacing;
    layout: ThemeLayout;
    mobileStyles: ThemeMobileStyles;
    componentStyles: ThemeComponentStyles;
    pageStyles: ThemePageStyles;
    customCSS?: string;
}

export const DEFAULT_THEME: ThemeConfiguration = {
    id: 'default',
    name: 'Modern Pink',
    description: 'Clean and modern design with pink accents',
    colors: {
        primary: '#DD3B5F',
        secondary: '#F472B6',
        accent: '#EC4899',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
    },
    typography: {
        fontFamily: {
            heading: 'Inter, system-ui, sans-serif',
            body: 'Inter, system-ui, sans-serif',
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
    },
    layout: {
        header: {
            style: 'sticky',
            height: '80px',
            transparent: false,
            blur: true,
        },
        footer: {
            style: 'detailed',
        },
        container: {
            maxWidth: '1280px',
            padding: '1rem',
        },
        grid: {
            columns: {
                mobile: 2,
                tablet: 3,
                desktop: 4,
            },
            gap: '1.5rem',
        },
    },
    mobileStyles: {
        header: {
            style: 'centered',
            showSearch: true,
            showCart: true,
        },
        menu: {
            style: 'sidebar',
            width: '280px',
            position: 'right',
        },
        productCard: {
            layout: 'vertical',
            imageRatio: '1:1',
            showQuickView: false,
        },
        navigation: {
            style: 'bottom-bar',
            icons: true,
        },
        spacing: {
            padding: '1rem',
            gap: '0.75rem',
        },
    },
    componentStyles: {
        button: {
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            shadow: true,
        },
        card: {
            borderRadius: '1rem',
            shadow: 'sm',
            border: true,
            hover: {
                scale: 1.02,
                shadow: true,
            },
        },
        input: {
            borderRadius: '0.5rem',
            border: true,
            focusRing: true,
        },
        badge: {
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
        },
    },
    pageStyles: {
        homepage: {
            heroStyle: 'slider',
            featuredLayout: 'grid',
            showCategories: true,
            showBrands: true,
        },
        productPage: {
            imageGallery: 'thumbnails',
            layout: 'sidebar',
            showRelated: true,
            showReviews: true,
        },
        categoryPage: {
            layout: 'grid',
            filterPosition: 'sidebar',
            sortPosition: 'top',
        },
        cartPage: {
            layout: 'two-column',
            showRecommendations: true,
        },
    },
};
