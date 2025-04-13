import { type Config } from "tailwindcss";
import fontFamily from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.fontFamily.sans],
      },
      colors: {
        primary: '#0F2A4A', // Dark Navy Blue
        secondary: '#EDD889', // Desert Gold
        background: '#000000', // Pure Black
        textPrimary: '#FFFFFF', // White
        textSecondary: '#EDD889', // Desert Gold
        accent: '#8B6F27', // Rich Dark Gold
      
        amber: {
          50: '#F8F5E6',  // Lightest desert tint
          100: '#F5EED0', // Very light desert
          200: '#EDD889', // Desert gold (secondary)
          300: '#E6CA5A', // Medium desert gold
          400: '#D4AF37', // Deeper desert gold
          500: '#B8941E', // Rich desert gold
          600: '#8B6F27', // Dark desert gold
          700: '#6D5720', // Very dark desert gold
          800: '#4E3E17', // Brown desert gold
          900: '#2F250E', // Almost black desert gold
        },
        dark: {
          100: '#2A2A2A', // Light charcoal
          200: '#222222', // Charcoal
          300: '#1A1A1A', // Deep charcoal
          400: '#121212', // Very dark gray
          500: '#0A0A0A', // Nearly black
          600: '#050505', // Almost pure black
          700: '#030303', // Barely off black
          800: '#010101', // Virtually black
          900: '#000000', // Pure black
        },
        gold: {
          50: '#FBF7E4',  // Lightest gold tint
          100: '#F5E7B8', // Very light gold
          200: '#EDD889', // Pale gold (same as desert.200)
          300: '#E6CA5A', // Medium gold
          400: '#D4AF37', // Standard gold
          500: '#B8941E', // Deep gold
          600: '#8B6F27', // Rich dark gold
          700: '#6D5720', // Very dark gold
          800: '#4E3E17', // Brown gold
          900: '#2F250E', // Almost black gold
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #EDD889 0%, #8B6F27 100%)',
        'gradient-navy': 'linear-gradient(135deg, #2A476A 0%, #0F2A4A 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #000000 100%)',
        'gradient-fade': 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)',
        'gradient-overlay': 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.3))',
        'gradient-card': 'linear-gradient(145deg, rgba(26,26,26,0.9) 0%, rgba(10,10,10,0.95) 100%)',
        'gradient-desert': 'linear-gradient(135deg, #F5EED0 0%, #EDD889 100%)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
        'gold': '0 4px 14px rgba(237, 216, 137, 0.15)',
        'navy': '0 4px 14px rgba(15, 42, 74, 0.25)',
        'inner-gold': 'inset 0 2px 4px 0 rgba(237, 216, 137, 0.05)',
        'inner-navy': 'inset 0 2px 4px 0 rgba(15, 42, 74, 0.1)',
        'glow': '0 0 15px rgba(237, 216, 137, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
