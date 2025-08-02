// Configuration des optimisations de performance

export const PERFORMANCE_CONFIG = {
    // Pagination
    ITEMS_PER_PAGE: 12,
    MAX_ITEMS_PER_PAGE: 50,

    // Cache
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    IMAGE_CACHE_DURATION: 10 * 60 * 1000, // 10 minutes

    // Animations
    ANIMATION_DURATION: {
        FAST: 0.2,
        NORMAL: 0.3,
        SLOW: 0.5
    },

    // Debounce delays
    DEBOUNCE_DELAY: {
        SEARCH: 300,
        SCROLL: 100,
        RESIZE: 250
    },

    // Image optimization
    IMAGE_OPTIMIZATION: {
        QUALITY: 80,
        FORMAT: 'webp',
        MAX_WIDTH: 800,
        MAX_HEIGHT: 600
    },

    // API limits
    API_LIMITS: {
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        TIMEOUT: 10000
    }
};

// Fonctions utilitaires pour les performances
export const performanceUtils = {
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Lazy load image
    lazyLoadImage: (src, fallback) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(fallback);
            img.src = src;
        });
    },

    // Preload critical resources
    preloadResources: (resources) => {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as || 'fetch';
            document.head.appendChild(link);
        });
    }
}; 