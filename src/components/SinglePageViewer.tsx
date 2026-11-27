import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageDown,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlbumPhoto, AlbumState } from '../types/album';
import { ALBUM_FONTS } from '../utils/albumFonts';
import { ALBUM_THEMES } from '../utils/albumThemes';

interface SinglePageViewerProps {
  album: AlbumState;
  currentPageIndex: number; // 0 = Cover, 1..photos.length = Photos, photos.length + 1 = Closing
  isSavingPng: boolean;
  onSelectPage: (pageIndex: number) => void;
  onSaveCurrentPagePng: () => void;
  onUpdateAlbumMeta: (
    patch: Partial<
      Pick<
        AlbumState,
        'albumTitle' | 'albumSubtitle' | 'authorName' | 'albumDate' | 'closingTitle' | 'closingMessage'
      >
    >
  ) => void;
  onUpdatePhoto: (id: string, patch: Partial<Pick<AlbumPhoto, 'title' | 'description'>>) => void;
  onRotatePhoto: (id: string) => void;
  onMovePhoto: (photoIndex: number, direction: -1 | 1) => void;
  onDeletePhoto: (id: string) => void;
}

export const SinglePageViewer: React.FC<SinglePageViewerProps> = ({
  album,
  currentPageIndex,
  isSavingPng,
  onSelectPage,
  onSaveCurrentPagePng,
  onUpdateAlbumMeta,
  onUpdatePhoto,
  onRotatePhoto,
  onMovePhoto,
  onDeletePhoto,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const closingTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { photos, orientation, theme: themeKey, font: fontKey } = album;
  const palette = ALBUM_THEMES[themeKey ?? 'white'];
  const fontCfg = ALBUM_FONTS[fontKey ?? 'myeongjo'];

  const totalPages = photos.length + 2; // Cover + Photos + Closing
  const safePageIndex = Math.min(Math.max(currentPageIndex, 0), totalPages - 1);

  const isCoverPage = safePageIndex === 0;
  const isClosingPage = safePageIndex === totalPages - 1;
  const photoIndex = safePageIndex - 1;
  const photo = !isCoverPage && !isClosingPage ? photos[photoIndex] : undefined;

  const hasPrev = safePageIndex > 0;
  const hasNext = safePageIndex < totalPages - 1;

  // Scroll active filmstrip thumbnail into view smoothly
  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [safePageIndex]);

  // Auto-resize photo description textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 68)}px`;
  }, [photo?.id, photo?.description, fontKey]);

  // Auto-resize closing message textarea
  useEffect(() => {
    const el = closingTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, [isClosingPage, album.closingMessage, fontKey]);

  // Keyboard navigation (ArrowLeft / ArrowRight) when not typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onSelectPage(safePageIndex - 1);
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onSelectPage(safePageIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, safePageIndex, onSelectPage]);

  if (photos.length === 0) return null;

  const isLandscape = orientation === 'landscape';
  const sheetKey = isCoverPage ? 'cover-page' : isClosingPage ? 'closing-page' : photo!.id;

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center">
      {/* Main Single-Page Stage with Flanking Previous / Next Buttons */}
      <div className="w-full flex items-center justify-center gap-4 lg:gap-8">
        {/* Desktop Previous Button */}
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onSelectPage(safePageIndex - 1)}
          aria-label="이전 페이지"
          title="이전 페이지 (←)"
          className="hidden md:inline-flex flex-col items-center justify-center gap-1.5 w-16 h-24 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 hover:shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          <span className="text-xs font-medium whitespace-nowrap">이전</span>
        </button>

        {/* Physical Album Page Sheet */}
        <div
          className={`w-full transition-all duration-200 ${
            isLandscape ? 'max-w-[880px]' : 'max-w-[600px]'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={sheetKey}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={`border rounded-2xl shadow-[0_20px_50px_-24px_rgba(24,24,27,0.18)] p-5 sm:p-8 flex flex-col transition-colors duration-200 ${palette.sheetClass}`}
            >
              {isCoverPage ? (
                /* ================= COVER PAGE (FIRST PAGE) ================= */
                <div
                  className={`flex flex-col justify-between border rounded-xl p-6 sm:p-12 text-center transition-colors duration-200 ${palette.innerBorderClass} ${
                    isLandscape
                      ? 'min-h-[460px] sm:min-h-[540px] lg:min-h-[580px]'
                      : 'min-h-[520px] sm:min-h-[620px] lg:min-h-[660px]'
                  }`}
                >
                  <div className={`flex items-center justify-between gap-2 text-xs ${palette.mutedTextClass}`}>
                    <span className={`font-mono font-medium tabular-nums ${palette.secondaryTextClass}`}>
                      표지 · 01 / {String(totalPages).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>총 {photos.length}장의 사진</span>
                      <button
                        type="button"
                        disabled={isSavingPng}
                        onClick={onSaveCurrentPagePng}
                        title="표지를 PNG 그림 파일로 저장"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${palette.iconButtonClass}`}
                      >
                        <ImageDown className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isSavingPng ? '저장 중' : 'PNG 저장'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Large Centerpiece: Title & Subtitle */}
                  <div className="my-auto py-8 flex flex-col items-center gap-5">
                    <span className={`text-xs font-medium tracking-[0.18em] ${palette.mutedTextClass}`}>
                      PHOTO ALBUM
                    </span>

                    <div className="w-full max-w-2xl">
                      <label htmlFor="cover-title-input" className="sr-only">
                        앨범 제목
                      </label>
                      <input
                        id="cover-title-input"
                        type="text"
                        value={album.albumTitle}
                        onChange={(e) =>
                          onUpdateAlbumMeta({ albumTitle: e.target.value })
                        }
                        placeholder="앨범 제목을 입력하세요"
                        className={`w-full text-center font-bold tracking-tight bg-transparent border-b border-transparent outline-none pb-2 transition-colors leading-tight ${fontCfg.fontClass} ${fontCfg.coverTitleBoostClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>

                    <div className={`w-12 h-px ${palette.ruleClass}`} aria-hidden="true" />

                    <div className="w-full max-w-xl">
                      <label htmlFor="cover-subtitle-input" className="sr-only">
                        앨범 부제
                      </label>
                      <input
                        id="cover-subtitle-input"
                        type="text"
                        value={album.albumSubtitle}
                        onChange={(e) =>
                          onUpdateAlbumMeta({ albumSubtitle: e.target.value })
                        }
                        placeholder="부제를 입력하세요 (예: 함께 걸었던 가을의 기록)"
                        className={`w-full text-center font-normal bg-transparent border-b border-transparent outline-none pb-1.5 transition-colors ${fontCfg.fontClass} ${fontCfg.bodySizeBoostClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>
                  </div>

                  {/* Prominent Author Name & Date at Bottom of Cover */}
                  <div className={`pt-4 border-t flex flex-col items-center gap-2 ${palette.headerDividerClass}`}>
                    <div className="w-full max-w-sm">
                      <label htmlFor="cover-author-input" className="sr-only">
                        만든 사람 이름
                      </label>
                      <input
                        id="cover-author-input"
                        type="text"
                        value={album.authorName}
                        onChange={(e) =>
                          onUpdateAlbumMeta({ authorName: e.target.value })
                        }
                        placeholder="이름을 입력하세요"
                        className={`w-full text-center font-semibold bg-transparent border-b border-transparent outline-none pb-1 transition-colors ${fontCfg.fontClass} ${fontCfg.titleSizeBoostClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>

                    <div className="w-full max-w-xs">
                      <label htmlFor="cover-date-input" className="sr-only">
                        날짜
                      </label>
                      <input
                        id="cover-date-input"
                        type="text"
                        value={album.albumDate}
                        onChange={(e) =>
                          onUpdateAlbumMeta({ albumDate: e.target.value })
                        }
                        placeholder="날짜를 입력하세요 (예: 2026년 11월 26일)"
                        className={`w-full text-center font-medium bg-transparent border-b border-transparent outline-none pb-1 transition-colors ${fontCfg.fontClass} ${fontCfg.bodySizeBoostClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>
                  </div>
                </div>
              ) : isClosingPage ? (
                /* ================= CLOSING PAGE (LAST PAGE) ================= */
                <div
                  className={`flex flex-col justify-between border rounded-xl p-6 sm:p-12 text-center transition-colors duration-200 ${palette.innerBorderClass} ${
                    isLandscape
                      ? 'min-h-[460px] sm:min-h-[540px] lg:min-h-[580px]'
                      : 'min-h-[520px] sm:min-h-[620px] lg:min-h-[660px]'
                  }`}
                >
                  <div className={`flex items-center justify-between gap-2 text-xs ${palette.mutedTextClass}`}>
                    <span className={`font-mono font-medium tabular-nums ${palette.secondaryTextClass}`}>
                      마무리 · {String(totalPages).padStart(2, '0')} /{' '}
                      {String(totalPages).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>마지막 페이지</span>
                      <button
                        type="button"
                        disabled={isSavingPng}
                        onClick={onSaveCurrentPagePng}
                        title="마무리 페이지를 PNG 그림 파일로 저장"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${palette.iconButtonClass}`}
                      >
                        <ImageDown className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isSavingPng ? '저장 중' : 'PNG 저장'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="my-auto py-8 flex flex-col items-center gap-5 w-full max-w-xl mx-auto">
                    <div className="w-full">
                      <label htmlFor="closing-title-input" className="sr-only">
                        마무리 제목
                      </label>
                      <input
                        id="closing-title-input"
                        type="text"
                        value={album.closingTitle}
                        onChange={(e) =>
                          onUpdateAlbumMeta({ closingTitle: e.target.value })
                        }
                        placeholder="마치며"
                        className={`w-full text-center font-semibold bg-transparent border-b border-transparent outline-none pb-1.5 transition-colors ${fontCfg.fontClass} ${fontCfg.titleSizeBoostClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>

                    <div className={`w-10 h-px ${palette.ruleClass}`} aria-hidden="true" />

                    <div className="w-full">
                      <label htmlFor="closing-message-input" className="sr-only">
                        마무리 문구
                      </label>
                      <textarea
                        ref={closingTextareaRef}
                        id="closing-message-input"
                        rows={4}
                        value={album.closingMessage}
                        onChange={(e) =>
                          onUpdateAlbumMeta({ closingMessage: e.target.value })
                        }
                        placeholder="이 앨범의 마지막 페이지에 남기고 싶은 마무리 문구를 적어보세요..."
                        className={`w-full text-center leading-relaxed bg-transparent border rounded-xl px-4 py-3 outline-none resize-none transition-colors ${fontCfg.fontClass} ${fontCfg.bodySizeBoostClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>
                  </div>

                  <div className={`pt-4 border-t text-xs sm:text-sm ${fontCfg.fontClass} ${palette.headerDividerClass} ${palette.mutedTextClass}`}>
                    {[album.authorName.trim(), album.albumDate.trim()]
                      .filter(Boolean)
                      .join(' · ') || '포토 모노그래프'}
                  </div>
                </div>
              ) : (
                /* ================= PHOTO PAGE ================= */
                <>
                  {/* Page Sheet Header: Page Number & Subtle Photo Actions */}
                  <div className={`flex items-center justify-between gap-4 pb-4 mb-4 border-b ${palette.headerDividerClass}`}>
                    <div className={`flex items-center gap-2 text-xs min-w-0 ${palette.mutedTextClass}`}>
                      <span className={`font-mono font-medium tabular-nums shrink-0 ${palette.secondaryTextClass}`}>
                        {String(photoIndex + 1).padStart(2, '0')} /{' '}
                        {String(photos.length).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{photo!.fileName}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isSavingPng}
                        onClick={onSaveCurrentPagePng}
                        title="현재 페이지를 PNG 그림 파일로 저장"
                        aria-label="현재 페이지 PNG 저장"
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${palette.iconButtonClass}`}
                      >
                        <ImageDown className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isSavingPng ? '저장 중' : 'PNG 저장'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRotatePhoto(photo!.id)}
                        title="시계 방향 90° 회전"
                        aria-label="사진 90도 회전"
                        className={`p-2 rounded-lg transition-colors ${palette.iconButtonClass}`}
                      >
                        <RotateCw className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={photoIndex === 0}
                        onClick={() => onMovePhoto(photoIndex, -1)}
                        title="앞 페이지로 이동"
                        aria-label="앞 페이지로 이동"
                        className={`p-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors ${palette.iconButtonClass}`}
                      >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={photoIndex === photos.length - 1}
                        onClick={() => onMovePhoto(photoIndex, 1)}
                        title="다음 페이지로 이동"
                        aria-label="다음 페이지로 이동"
                        className={`p-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors ${palette.iconButtonClass}`}
                      >
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePhoto(photo!.id)}
                        title="이 사진 삭제"
                        aria-label="이 사진 삭제"
                        className={`p-2 rounded-lg transition-colors ${
                          palette.isDark
                            ? 'text-[#889BB6] hover:text-rose-400 hover:bg-rose-500/15'
                            : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Single Photo Frame (Unobstructed, aspect ratio preserved) */}
                  <div
                    className={`w-full border rounded-xl flex items-center justify-center p-3 sm:p-5 overflow-hidden transition-colors duration-200 ${palette.frameClass} ${
                      isLandscape
                        ? 'h-[320px] sm:h-[420px] lg:h-[460px]'
                        : 'h-[380px] sm:h-[480px] lg:h-[520px]'
                    }`}
                  >
                    <img
                      src={photo!.dataUrl}
                      alt={photo!.title || photo!.fileName}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-sm shadow-[0_6px_20px_-6px_rgba(0,0,0,0.18)]"
                    />
                  </div>

                  {/* Editable Title & Description directly on the Album Page */}
                  <div className="mt-6 space-y-2.5">
                    <div>
                      <label htmlFor={`photo-title-${photo!.id}`} className="sr-only">
                        사진 제목
                      </label>
                      <input
                        id={`photo-title-${photo!.id}`}
                        type="text"
                        value={photo!.title}
                        onChange={(e) =>
                          onUpdatePhoto(photo!.id, { title: e.target.value })
                        }
                        placeholder="이 사진의 제목을 입력하세요"
                        className={`w-full font-semibold bg-transparent border-b outline-none pb-1.5 transition-colors ${fontCfg.fontClass} ${fontCfg.titleSizeBoostClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>

                    <div>
                      <label htmlFor={`photo-desc-${photo!.id}`} className="sr-only">
                        사진 설명
                      </label>
                      <textarea
                        ref={textareaRef}
                        id={`photo-desc-${photo!.id}`}
                        rows={2}
                        value={photo!.description}
                        onChange={(e) =>
                          onUpdatePhoto(photo!.id, { description: e.target.value })
                        }
                        placeholder="사진에 담긴 순간과 이야기를 자유롭게 적어보세요..."
                        className={`w-full leading-relaxed bg-transparent border rounded-lg px-2 py-1.5 -mx-2 outline-none resize-none transition-colors ${fontCfg.fontClass} ${fontCfg.bodySizeBoostClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Desktop Next Button */}
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onSelectPage(safePageIndex + 1)}
          aria-label="다음 페이지"
          title="다음 페이지 (→)"
          className="hidden md:inline-flex flex-col items-center justify-center gap-1.5 w-16 h-24 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 hover:shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
          <span className="text-xs font-medium whitespace-nowrap">다음</span>
        </button>
      </div>

      {/* Mobile & Compact Prev / Next Control Bar */}
      <div className="mt-5 flex md:hidden items-center justify-between w-full max-w-[600px] gap-3">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onSelectPage(safePageIndex - 1)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-35 disabled:pointer-events-none transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>이전</span>
        </button>

        <span className="px-3 text-xs font-mono font-medium text-zinc-600 tabular-nums whitespace-nowrap">
          {safePageIndex + 1} / {totalPages}
        </span>

        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onSelectPage(safePageIndex + 1)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-35 disabled:pointer-events-none transition-colors whitespace-nowrap"
        >
          <span>다음</span>
          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>

      {/* Bottom Thumbnail Filmstrip: Cover + Photos + Closing */}
      <section aria-label="페이지 목록" className="mt-7 w-full max-w-[960px]">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 px-1 album-scrollbar">
          {/* Cover Thumbnail */}
          <button
            ref={isCoverPage ? activeThumbRef : null}
            type="button"
            onClick={() => onSelectPage(0)}
            aria-label="첫 쪽 표지"
            aria-current={isCoverPage ? 'page' : undefined}
            className={`group shrink-0 flex flex-col items-start w-24 rounded-xl p-1.5 bg-white border transition-all text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              isCoverPage
                ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
            }`}
          >
            <div
              className={`w-full h-14 rounded-lg border flex flex-col items-center justify-center px-1.5 text-center transition-colors ${palette.miniCardBgClass}`}
            >
              <span className={`text-[10px] font-semibold truncate w-full ${fontCfg.fontClass} ${palette.primaryTextClass}`}>
                {album.albumTitle.trim() || '앨범 표지'}
              </span>
              {album.authorName.trim() && (
                <span className={`text-[9px] truncate w-full mt-0.5 ${fontCfg.fontClass} ${palette.mutedTextClass}`}>
                  {album.authorName}
                </span>
              )}
            </div>
            <div className="mt-1.5 w-full flex items-center gap-1 text-[11px] leading-tight">
              <span className="font-medium text-blue-600 shrink-0">표지</span>
              <span className="truncate text-zinc-500">첫 쪽</span>
            </div>
          </button>

          {/* Photo Thumbnails */}
          {photos.map((item, idx) => {
            const pageNum = idx + 1;
            const isActive = safePageIndex === pageNum;
            return (
              <button
                key={item.id}
                ref={isActive ? activeThumbRef : null}
                type="button"
                onClick={() => onSelectPage(pageNum)}
                aria-label={`${idx + 1}번 사진: ${item.title || item.fileName}`}
                aria-current={isActive ? 'page' : undefined}
                className={`group shrink-0 flex flex-col items-start w-24 rounded-xl p-1.5 bg-white border transition-all text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                    : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-full h-14 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.dataUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-1.5 w-full flex items-center gap-1 text-[11px] leading-tight">
                  <span className="font-mono text-zinc-400 tabular-nums shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-zinc-700 font-medium">
                    {item.title || '제목 없음'}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Closing Thumbnail */}
          <button
            ref={isClosingPage ? activeThumbRef : null}
            type="button"
            onClick={() => onSelectPage(totalPages - 1)}
            aria-label="마지막 쪽 마무리"
            aria-current={isClosingPage ? 'page' : undefined}
            className={`group shrink-0 flex flex-col items-start w-24 rounded-xl p-1.5 bg-white border transition-all text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              isClosingPage
                ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
            }`}
          >
            <div
              className={`w-full h-14 rounded-lg border flex flex-col items-center justify-center px-1.5 text-center transition-colors ${palette.miniCardBgClass}`}
            >
              <span className={`text-[10px] font-semibold truncate w-full ${fontCfg.fontClass} ${palette.primaryTextClass}`}>
                {album.closingTitle.trim() || '마치며'}
              </span>
              <span className={`text-[9px] truncate w-full mt-0.5 ${fontCfg.fontClass} ${palette.mutedTextClass}`}>
                {album.closingMessage.trim() ? '문구 작성됨' : '마무리 글'}
              </span>
            </div>
            <div className="mt-1.5 w-full flex items-center gap-1 text-[11px] leading-tight">
              <span className="font-medium text-blue-600 shrink-0">마무리</span>
              <span className="truncate text-zinc-500">끝 쪽</span>
            </div>
          </button>
        </div>
      </section>
    </main>
  );
};
