import React from 'react';
import { Download } from 'lucide-react';
import { ViewMode } from '../types/album';

interface TopBarProps {
  hasPhotos: boolean;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onTriggerUpload: () => void;
  onOpenPdfModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  hasPhotos,
  viewMode,
  onChangeViewMode,
  onTriggerUpload,
  onOpenPdfModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F6F6F4]/95 backdrop-blur-sm border-b border-zinc-200/80">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onChangeViewMode('single');
          }}
          className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded-sm"
        >
          포토 모노그래프
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="앨범 메뉴"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('single')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              viewMode === 'single' && hasPhotos
                ? 'text-zinc-900 border-zinc-900'
                : 'border-transparent hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            한 쪽씩 보기
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('grid')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              viewMode === 'grid' && hasPhotos
                ? 'text-zinc-900 border-zinc-900'
                : 'border-transparent hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            전체 목록
          </button>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 border-transparent hover:text-zinc-900 hover:border-zinc-300"
          >
            사진 올리기
          </button>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={!hasPhotos}
            onClick={onOpenPdfModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>PDF 저장</span>
          </button>
        </div>
      </div>
    </header>
  );
};
