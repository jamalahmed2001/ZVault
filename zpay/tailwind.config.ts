const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './*.html', // Adjust paths based on your project structure
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Brand Colors --- 
        'brand-navy': '#0F1E45', // Your dark navy blue
        'brand-gold': '#F5E7B8', // Your light pale gold

        // --- Semantic Colors (Dark Theme Base) ---
        'background': 'var(--brand-navy)',         // Dark navy base background
        'surface': '#1E2A51',                  // Slightly lighter navy for cards, modals
        'surface-alt': '#2A3862',             // Even lighter for hover or secondary surfaces

        'foreground': '#E0E0E0',               // Primary text (light gray/off-white)
        'foreground-alt': '#A0AEC0',          // Secondary text (medium gray)
        'foreground-accent': 'var(--brand-gold)',// Accent text (gold)

        'border': '#3A4B71',                   // Default border (mid-tone navy/gray)
        'border-accent': 'var(--brand-gold)',   // Accent border (gold)

        'primary': 'var(--brand-gold)',          // Primary actions (gold)
        'primary-foreground': 'var(--brand-navy)',// Text on primary (navy for contrast on gold)
        
        'secondary': 'var(--brand-navy)',       // Secondary actions (navy - can be different if needed)
        'secondary-foreground': '#FFFFFF',      // Text on secondary (white)

        'accent': 'var(--brand-gold)',          // General accent (gold)
        'accent-foreground': 'var(--brand-navy)',// Text on accent (navy)

        'ring': 'var(--brand-gold)',            // Focus ring (gold)

        // --- Semantic Colors (Light Theme Variants) ---
        'background-light': '#F7FAFC',         // Very light gray/off-white for light sections
        'surface-light': '#FFFFFF',            // White for cards in light sections
        'surface-light-alt': '#EDF2F7',      // Slightly off-white for hover/secondary in light
        
        'foreground-light': '#1A202C',        // Dark text for light backgrounds (almost black)
        'foreground-light-alt': '#4A5568',   // Medium-dark gray for secondary text on light
        'foreground-light-accent': 'var(--brand-navy)', // Navy for accents on light theme

        'border-light': '#CBD5E0',             // Light gray border for light theme
        'border-light-alt': '#A0AEC0',        // Medium gray border for emphasis on light theme
        'border-light-accent': 'var(--brand-navy)',// Navy border for accents on light theme
        
        // --- UI States (Can be applied to both dark/light with appropriate base) ---
        'hover-primary': '#E6D9A4',            // Lighter gold for hover on primary
        'hover-secondary': '#2A3862',         // Darker shade for navy hover (if secondary is navy)
        'active-primary': '#D4C58F',           // Darker gold for active/pressed primary
        'disabled': '#A0AEC0',                 // Gray for disabled elements
        'disabled-foreground': '#718096',      // Text on disabled elements

        // --- Status Colors (Adjust saturation/brightness as needed) ---
        'success': '#2E7D32',                 // Darker Green
        'success-foreground': '#C8E6C9',       // Light Green Text
        'warning': '#FF8F00',                 // Darker Amber/Orange
        'warning-foreground': '#FFF3E0',      // Light Orange Text
        'error': '#C62828',                   // Darker Red
        'error-foreground': '#FFCDD2',        // Light Red Text
      },
      fontFamily: {
        // Use Geist Sans as specified, with fallbacks
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
        // Optional: Add a serif or mono font if needed
        // serif: ['Georgia', ...defaultTheme.fontFamily.serif],
        // mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Example: Fine-tune default sizes if needed
        'xs': '0.75rem', // 12px
        'sm': '0.875rem', // 14px
        'base': '1rem', // 16px
        'lg': '1.125rem', // 18px
        'xl': '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem', // 48px
        '6xl': '3.75rem', // 60px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem', // 2px
        'DEFAULT': '0.25rem', // 4px (standard)
        'md': '0.375rem', // 6px
        'lg': '0.5rem', // 8px
        'xl': '0.75rem', // 12px
        '2xl': '1rem', // 16px
        'full': '9999px',
      },
      // Add subtle box shadows appropriate for a dark theme
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        // Consider adding subtle inner shadows or highlights for depth on dark UI
        'inner-accent': 'inset 0 1px 2px 0 rgba(245, 231, 184, 0.1)', // Subtle gold inner highlight
      },
      // Add transitions for smoother interactions
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke, opacity',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins you might use (e.g., forms, typography)
    require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'), // If you need prose styling
  ],
}; 