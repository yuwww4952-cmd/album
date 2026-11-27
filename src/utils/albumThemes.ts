import { AlbumTheme } from '../types/album';

export interface AlbumThemePalette {
  id: AlbumTheme;
  label: string;
  swatchHex: string;
  isDark: boolean;
  // Hex colors for Canvas/PDF export
  paperBg: string;
  paperBorder: string;
  frameBg: string;
  frameBorder: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Tailwind utility classes for live preview
  sheetClass: string;
  innerBorderClass: string;
  headerDividerClass: string;
  frameClass: string;
  ruleClass: string;
  primaryTextClass: string;
  secondaryTextClass: string;
  mutedTextClass: string;
  placeholderClass: string;
  inputBorderClass: string;
  iconButtonClass: string;
  miniCardBgClass: string;
}

export const ALBUM_THEMES: Record<AlbumTheme, AlbumThemePalette> = {
  white: {
    id: 'white',
    label: '흰색(깔끔)',
    swatchHex: '#FFFFFF',
    isDark: false,
    paperBg: '#FFFFFF',
    paperBorder: '#E4E4E7',
    frameBg: '#FAFAFA',
    frameBorder: 'rgba(24, 24, 27, 0.08)',
    divider: '#D4D4D8',
    textPrimary: '#18181B',
    textSecondary: '#52525B',
    textMuted: '#A1A1AA',
    sheetClass: 'bg-white border-zinc-200/90',
    innerBorderClass: 'border-zinc-200/80',
    headerDividerClass: 'border-zinc-100',
    frameClass: 'bg-zinc-50/70 border-zinc-100',
    ruleClass: 'bg-zinc-300',
    primaryTextClass: 'text-zinc-900',
    secondaryTextClass: 'text-zinc-600',
    mutedTextClass: 'text-zinc-400',
    placeholderClass: 'placeholder:text-zinc-300',
    inputBorderClass:
      'border-zinc-200/70 hover:border-zinc-300 focus:border-blue-600',
    iconButtonClass:
      'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
    miniCardBgClass: 'bg-zinc-50 border-zinc-200/80',
  },
  beige: {
    id: 'beige',
    label: '베이지(따뜻한 종이)',
    swatchHex: '#F5EFE4',
    isDark: false,
    paperBg: '#F6F1E7',
    paperBorder: '#E4DAC8',
    frameBg: '#EEE7D9',
    frameBorder: 'rgba(44, 36, 27, 0.1)',
    divider: '#D3C7B3',
    textPrimary: '#2C241B',
    textSecondary: '#5E5142',
    textMuted: '#8E806E',
    sheetClass: 'bg-[#F6F1E7] border-[#E4DAC8]',
    innerBorderClass: 'border-[#E0D5C1]',
    headerDividerClass: 'border-[#EAE1D0]',
    frameClass: 'bg-[#EEE7D9]/75 border-[#E2D8C5]',
    ruleClass: 'bg-[#CFC3AE]',
    primaryTextClass: 'text-[#2C241B]',
    secondaryTextClass: 'text-[#5E5142]',
    mutedTextClass: 'text-[#8E806E]',
    placeholderClass: 'placeholder:text-[#B9AC98]',
    inputBorderClass:
      'border-[#DFD4C1] hover:border-[#C7B9A1] focus:border-[#8B5E34]',
    iconButtonClass:
      'text-[#6E6050] hover:text-[#2C241B] hover:bg-[#EAE1D0]',
    miniCardBgClass: 'bg-[#F6F1E7] border-[#E0D5C1]',
  },
  navy: {
    id: 'navy',
    label: '네이비(차분함)',
    swatchHex: '#0F1B2E',
    isDark: true,
    paperBg: '#0F1B2E',
    paperBorder: '#23344F',
    frameBg: '#16253D',
    frameBorder: 'rgba(241, 245, 249, 0.12)',
    divider: '#33486B',
    textPrimary: '#F4F6FA',
    textSecondary: '#CBD5E1',
    textMuted: '#889BB6',
    sheetClass: 'bg-[#0F1B2E] border-[#23344F]',
    innerBorderClass: 'border-[#223552]',
    headerDividerClass: 'border-[#1D2E49]',
    frameClass: 'bg-[#16253D] border-[#223552]',
    ruleClass: 'bg-[#3A5175]',
    primaryTextClass: 'text-[#F4F6FA]',
    secondaryTextClass: 'text-[#CBD5E1]',
    mutedTextClass: 'text-[#889BB6]',
    placeholderClass: 'placeholder:text-[#556A8A]',
    inputBorderClass:
      'border-[#263A59] hover:border-[#3E5882] focus:border-blue-400',
    iconButtonClass:
      'text-[#9FB0C9] hover:text-white hover:bg-[#1C2E4A]',
    miniCardBgClass: 'bg-[#0F1B2E] border-[#253754]',
  },
};
