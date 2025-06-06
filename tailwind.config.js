import { heroui } from '@heroui/theme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  plugins: [
    heroui({
      addCommonColors: false,
      defaultTheme: 'dark',
      defaultExtendTheme: 'dark',
      themes: {
        dark: {
          layout: {
            disabledOpacity: '0.5',
          },
          colors: {
            default: {
              50: '#080707',
              100: '#100f0e',
              200: '#191616',
              300: '#211e1d',
              400: '#292524',
              500: '#545150',
              600: '#7f7c7c',
              700: '#a9a8a7',
              800: '#d4d3d3',
              900: '#ffffff',
              foreground: '#fff',
              DEFAULT: '#292524',
            },
            primary: {
              50: '#4c3e1a',
              100: '#786229',
              200: '#a48739',
              300: '#d0ab48',
              400: '#fccf57',
              500: '#fdd774',
              600: '#fde092',
              700: '#fee8af',
              800: '#fef1cd',
              900: '#fff9ea',
              foreground: '#000',
              DEFAULT: '#fccf57',
            },
            secondary: {
              50: '#03080a',
              100: '#050c10',
              200: '#071015',
              300: '#08151b',
              400: '#0a1921',
              500: '#354148',
              600: '#606a6f',
              700: '#8b9296',
              800: '#b6babc',
              900: '#e0e2e3',
              foreground: '#fff',
              DEFAULT: '#0a1921',
            },
            success: {
              50: '#2f3729',
              100: '#4b5740',
              200: '#667758',
              300: '#82976f',
              400: '#9db787',
              500: '#aec49c',
              600: '#bfd0b1',
              700: '#d0ddc6',
              800: '#e2e9db',
              900: '#f3f6f0',
              foreground: '#000',
              DEFAULT: '#9db787',
            },
            warning: {
              50: '#4d3f1d',
              100: '#79642d',
              200: '#a6893e',
              300: '#d2ad4e',
              400: '#ffd25f',
              500: '#ffda7b',
              600: '#ffe297',
              700: '#ffeab3',
              800: '#fff2cf',
              900: '#fff9eb',
              foreground: '#000',
              DEFAULT: '#ffd25f',
            },
            danger: {
              50: '#4c2d27',
              100: '#78473d',
              200: '#a46154',
              300: '#d07b6a',
              400: '#fc9581',
              500: '#fda897',
              600: '#fdbaad',
              700: '#fecdc3',
              800: '#fedfd9',
              900: '#fff2ef',
              foreground: '#000',
              DEFAULT: '#fc9581',
            },
            background: '#0C0A09',
            foreground: '#FAFAF9',
            content1: {
              DEFAULT: '#1C1917',
              foreground: '#fff',
            },
            content2: {
              DEFAULT: '#292524',
              foreground: '#fff',
            },
            content3: {
              DEFAULT: '#44403C',
              foreground: '#fff',
            },
            content4: {
              DEFAULT: '#57534E',
              foreground: '#fff',
            },
            focus: '#F6A740',
            overlay: '#0C0A09',
          },
        },
        light: {
          layout: {},
          colors: {},
        },
      },
    }),
  ],
}
