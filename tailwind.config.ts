import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],

  /*
   * Only real source locations are scanned. The previous config also globbed
   * `./pages`, `./components` and `./app`, none of which exist in this project —
   * they were leftovers from a Next.js template and made every build walk three
   * phantom trees.
   */
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  prefix: '',

  theme: {
    container: {
      center: true,
      /*
       * A flat `2rem` padding consumed 64px of a 360px viewport (18% of the
       * screen) before any content was drawn. Padding now scales with the
       * breakpoint.
       */
      padding: {
        DEFAULT: '1rem',
        xs: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },

    screens: {
      // `xs` targets the 360-420px budget-Android band explicitly.
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /*
         * The `sidebar` palette was removed: it mapped to `--sidebar-*` custom
         * properties that no longer exist, so every `bg-sidebar` style resolved
         * to `hsl()` with an empty argument — an invalid colour.
         */
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      /* Safe-area aware spacing for Android gesture bars and notches. */
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-t': 'env(safe-area-inset-top, 0px)',
      },

      /* Minimum tap target, per WCAG 2.5.5. */
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },

      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },

  plugins: [tailwindcssAnimate],
} satisfies Config;
