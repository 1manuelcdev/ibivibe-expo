/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        border: '#4D4D56',
        destructive: '#EF4444',
        foreground: '#FFFFFF',
        muted: '#27272A',
        'muted-foreground': '#71717A',
        primary: '#9FFF8B',
        'primary-foreground': '#000000',
      },
      borderRadius: {
        control: '12px',
        image: '16px',
        button: '24px',
      },
      fontFamily: {
        dm: ['DMSans-Regular'],
        'dm-medium': ['DMSans-Medium'],
        'dm-semibold': ['DMSans-SemiBold'],
        'dm-bold': ['DMSans-Bold'],
      },
    },
  },
  plugins: [],
};
