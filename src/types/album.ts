export interface AlbumPhoto {
  id: string;
  dataUrl: string;
  fileName: string;
  title: string;
  description: string;
  width: number;
  height: number;
  createdAt: number;
}

export type PageOrientation = 'landscape' | 'portrait';
export type ViewMode = 'single' | 'grid';
export type AlbumTheme = 'white' | 'beige' | 'navy';
export type AlbumFont = 'gothic' | 'myeongjo' | 'handwriting';

export interface AlbumState {
  albumTitle: string;
  albumSubtitle: string;
  authorName: string;
  albumDate: string;
  closingTitle: string;
  closingMessage: string;
  orientation: PageOrientation;
  theme: AlbumTheme;
  font: AlbumFont;
  photos: AlbumPhoto[];
}

export interface PdfExportOptions {
  fileName: string;
  orientation: PageOrientation;
  includeCover: boolean;
  includeClosing: boolean;
  showPageNumbers: boolean;
}
