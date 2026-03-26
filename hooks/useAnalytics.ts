declare global {
    interface Window {
        gtag: (command: string, ...args: any[]) => void;
        dataLayer: any[];
    }
}

export const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-2Q5MM2CKW0', {
            page_path: pagePath,
            page_title: pageTitle || document.title
        });
    }
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    }
};

export const trackConversion = (conversionId: string, conversionLabel: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
            send_to: `${conversionId}/${conversionLabel}`,
            value: value,
            currency: 'INR'
        });
    }
};

export const useAnalytics = () => {
    return {
        trackPageView,
        trackEvent,
        trackConversion
    };
};
