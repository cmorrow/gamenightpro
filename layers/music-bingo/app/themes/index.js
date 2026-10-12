import ThemeDefault from './ThemeDefault.vue'

/**
 * Theme registry.
 *
 * Each entry has:
 *   component        — Vue component rendered for each bingo card
 *   id / name        — used by the picker UI
 *   (flat tokens)    — used by the mini swatch preview in BingoInput
 *
 * To add a custom theme:
 *   1. Create src/themes/ThemeMyCustom.vue (copy any existing theme as a starting point)
 *   2. Add an entry here with your component + preview tokens
 */
export const THEME_LIST = [
  {
    id: 'default',
    name: 'Classic Black',
    component: ThemeDefault,
    // swatch preview tokens
    cardBg: '#ffffff',
    cardBorder: '1px solid #000000',
    cardBoxShadow: 'none',
    cardBorderRadius: '0',
    colHeaderColors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    colHeaderColor: '#000000',
    colHeaderFontFamily: 'inherit',
    colHeaderFontWeight: '800',
    colHeaderLetterSpacing: '.05em',
    cellColBorderColors: ['#000000', '#000000', '#000000', '#000000', '#000000'],
    cellBg: '#ffffff',
    cellTextColor: '#000000',
    cellSubColor: '#000000',
    freeBg: '#ffffff',
    freeBorderColor: '#000000',
    freeTextColor: '#000000',
    freeIcon: '',
  },
]

export const DEFAULT_THEME = THEME_LIST[0]
