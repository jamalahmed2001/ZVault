// // tailwind.config.js
// const defaultTheme = require('tailwindcss/defaultTheme');

// module.exports = {
//   content: [
//     './*.html', // Adjust paths based on your project structure
//     './src/**/*.{js,ts,jsx,tsx,html}',
//   ],
//   theme: {
//     extend: {
//       colors: {
//         // --- Brand Colors ---
//         'brand-navy': '#0F1E45', // Your dark navy blue
//         'brand-gold': '#F5E7B8', // Your light pale gold

//         // --- Semantic Colors (Dark Theme) ---
//         'background': '#0A0F1A', // Very dark base background (darker than navy)
//         'surface': '#0F1E45', // Navy blue for cards, modals, raised surfaces
//         'surface-alt': '#1E2A51', // Slightly lighter navy for subtle contrast or hover states

//         'foreground': '#E0E0E0', // Primary text color (light gray/off-white)
//         'foreground-alt': '#A0AEC0', // Secondary text color (medium gray)
//         'foreground-accent': '#F5E7B8', // Accent text (use sparingly for emphasis)

//         'border': '#2D3748', // Default border color (dark gray)
//         'border-accent': '#F5E7B8', // Accent border (gold)

//         'primary': 'var(--brand-navy)', // Map primary actions to navy (can be adjusted)
//         'primary-foreground': '#FFFFFF', // Text on primary elements

//         'accent': 'var(--brand-gold)', // Map accent to gold
//         'accent-foreground': '#0F1E45', // Text on accent elements (navy for contrast on gold)

//         'ring': 'var(--brand-gold)', // Focus ring color (important for accessibility)

//         // --- Status Colors (Adjust saturation/brightness to fit dark theme) ---
//         'success': '#2E7D32', // Darker Green
//         'success-foreground': '#C8E6C9', // Light Green Text
//         'warning': '#FF8F00', // Darker Amber/Orange
//         'warning-foreground': '#FFF3E0', // Light Orange Text
//         'error': '#C62828', // Darker Red
//         'error-foreground': '#FFCDD2', // Light Red Text
//       },
//       fontFamily: {
//         // Use Geist Sans as specified, with fallbacks
//         sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
//         // Optional: Add a serif or mono font if needed
//         // serif: ['Georgia', ...defaultTheme.fontFamily.serif],
//         // mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
//       },
//       fontSize: {
//         // Example: Fine-tune default sizes if needed
//         'xs': '0.75rem', // 12px
//         'sm': '0.875rem', // 14px
//         'base': '1rem', // 16px
//         'lg': '1.125rem', // 18px
//         'xl': '1.25rem', // 20px
//         '2xl': '1.5rem', // 24px
//         '3xl': '1.875rem', // 30px
//         '4xl': '2.25rem', // 36px
//         '5xl': '3rem', // 48px
//         '6xl': '3.75rem', // 60px
//       },
//       borderRadius: {
//         'none': '0',
//         'sm': '0.125rem', // 2px
//         'DEFAULT': '0.25rem', // 4px (standard)
//         'md': '0.375rem', // 6px
//         'lg': '0.5rem', // 8px
//         'xl': '0.75rem', // 12px
//         '2xl': '1rem', // 16px
//         'full': '9999px',
//       },
//       // Add subtle box shadows appropriate for a dark theme
//       boxShadow: {
//         'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
//         'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
//         'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
//         // Consider adding subtle inner shadows or highlights for depth on dark UI
//         'inner-accent': 'inset 0 1px 2px 0 rgba(245, 231, 184, 0.1)', // Subtle gold inner highlight
//       },
//       // Add transitions for smoother interactions
//       transitionProperty: {
//         'colors': 'background-color, border-color, color, fill, stroke, opacity',
//       },
//     },
//   },
//   plugins: [
//     // Add any Tailwind plugins you might use (e.g., forms, typography)
//     require('@tailwindcss/forms'),
//     // require('@tailwindcss/typography'), // If you need prose styling
//   ],
// };