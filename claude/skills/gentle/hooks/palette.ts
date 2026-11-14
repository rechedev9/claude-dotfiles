import { makeColors } from './make-colors.js'

// Dark only, like gentle-shell: near-black plum page, pink accent, rose secondary.
export const { theme, problems } = makeColors({
  label: 'Gentle',
  only: 'dark',
  roles: {
    accent: '#F095C8',
    danger: '#E5707E',
    success: '#8FD1A8',
    warning: '#E8B86D',
    pro: '#C9A0E8',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1A1218',
        'surface-1': '#21171F',
        'surface-2': '#281C26',
        'surface-3': '#2E212B',
        'text-primary': '#F8EAF1',
        'text-secondary': '#DCC3D0',
        'text-muted': '#B79DAC',
      },
    },
    git: {
      added: '#8FD1A8',
      removed: '#E5707E',
      modified: '#D7A0B8',
    },
  },
})
