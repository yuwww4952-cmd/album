import { AlbumFont } from '../types/album';

export interface AlbumFontConfig {
  id: AlbumFont;
  label: string;
  cssFamily: string;
  fontClass: string;
  titleSizeBoostClass: string;
  bodySizeBoostClass: string;
  coverTitleBoostClass: string;
  canvasTitleWeight: string;
  canvasBodyWeight: string;
  canvasSizeScale: number;
  preloadFontSpecs: string[];
}

export const ALBUM_FONTS: Record<AlbumFont, AlbumFontConfig> = {
  gothic: {
    id: 'gothic',
    label: '고딕',
    cssFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
    fontClass: 'font-sans',
    titleSizeBoostClass: 'text-xl sm:text-2xl',
    bodySizeBoostClass: 'text-sm sm:text-[15px]',
    coverTitleBoostClass: 'text-3xl sm:text-5xl',
    canvasTitleWeight: '700',
    canvasBodyWeight: '400',
    canvasSizeScale: 1,
    preloadFontSpecs: [
      '400 24px "Noto Sans KR"',
      '700 40px "Noto Sans KR"',
      '700 40px "Plus Jakarta Sans"',
    ],
  },
  myeongjo: {
    id: 'myeongjo',
    label: '명조',
    cssFamily: '"Playfair Display", "Noto Serif KR", Georgia, serif',
    fontClass: 'font-serif',
    titleSizeBoostClass: 'text-xl sm:text-2xl',
    bodySizeBoostClass: 'text-sm sm:text-[15px]',
    coverTitleBoostClass: 'text-3xl sm:text-5xl',
    canvasTitleWeight: '700',
    canvasBodyWeight: '400',
    canvasSizeScale: 1,
    preloadFontSpecs: [
      '400 24px "Noto Serif KR"',
      '700 40px "Noto Serif KR"',
      '700 40px "Playfair Display"',
    ],
  },
  handwriting: {
    id: 'handwriting',
    label: '손글씨',
    cssFamily: '"Nanum Pen Script", "Gaegu", cursive',
    fontClass: '[font-family:var(--font-handwriting)]',
    titleSizeBoostClass: 'text-2xl sm:text-[28px]',
    bodySizeBoostClass: 'text-lg sm:text-[20px]',
    coverTitleBoostClass: 'text-4xl sm:text-6xl',
    canvasTitleWeight: '400',
    canvasBodyWeight: '400',
    canvasSizeScale: 1.32,
    preloadFontSpecs: [
      '400 32px "Nanum Pen Script"',
      '400 32px "Gaegu"',
    ],
  },
};

export async function ensureAlbumFontsLoaded(font: AlbumFont): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const config = ALBUM_FONTS[font];
  try {
    await Promise.all([
      document.fonts.ready,
      ...config.preloadFontSpecs.map((spec) => document.fonts.load(spec)),
    ]);
  } catch {
    // Proceed gracefully if a secondary font fallback is used
  }
}
