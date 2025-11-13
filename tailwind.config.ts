import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Political lean colors
        'dem-blue': '#2E5AAC',
        'rep-red': '#C9252B',
        'neutral-gray': '#6B7280',
        // Background colors
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F9FAFB',
        'bg-card': '#FFFFFF',
        // Text colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'card': '0.75rem',
      },
    },
  },
  plugins: [],
}

export default config
