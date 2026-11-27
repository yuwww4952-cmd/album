import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ImagePlus,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { AlbumPhoto, AlbumState } from '../types/album';
import { ALBUM_FONTS } from '../utils/albumFonts';
import { ALBUM_THEMES } from '../utils/albumThemes';

interface GridOverviewProps {
  album: AlbumState;
  currentPageIndex: number;
  onOpenPage: (pageIndex: number) => void;
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
  onTriggerUpload: () => void;
}

export const GridOverview: React.FC<GridOverviewProps> = ({
  album,
  currentPageIndex,
  onOpenPage,
  onUpdateAlbumMeta,
  onUpdatePhoto,
  onRotatePhoto,
  onMovePhoto,
  onDeletePhoto,
  onTriggerUpload,
}) => {
  const { photos, theme, font } = album;
  const palette = ALBUM_THEMES[theme ?? 'white'];
  const fontCfg = ALBUM_FONTS[font ?? 'myeongjo'];

  const actionLinkClass = palette.isDark
    ? 'text-blue-400 hover:text-blue-300'
    : 'text-blue-600 hover:text-blue-700';

  const deleteButtonClass = palette.isDark
    ? 'text-[#889BB6] hover:text-rose-400 hover:bg-rose-500/15'
    : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50';

  return (
    <main className="max-w-[1440px] mx-auto px-5 sm:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-zinc-900">
            전체 페이지 편집
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            표지와 마무리 문구, 그리고 모든 사진의 순서와 설명을 한눈에 정리할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Cover & Closing Quick Editor Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors duration-200 ${palette.sheetClass}`}
        >
          <div className={`flex items-center justify-between border-b pb-3 ${palette.headerDividerClass}`}>
            <span className={`text-xs font-medium ${palette.secondaryTextClass}`}>
              첫 쪽 · 표지
            </span>
            <button
              type="button"
              onClick={() => onOpenPage(0)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${actionLinkClass}`}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>표지 크게 보기</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={album.albumTitle}
              onChange={(e) => onUpdateAlbumMeta({ albumTitle: e.target.value })}
              placeholder="앨범 제목"
              aria-label="표지 제목"
              className={`w-full text-sm font-semibold border-b outline-none py-1.5 bg-transparent transition-colors ${fontCfg.fontClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
            />
            <input
              type="text"
              value={album.albumSubtitle}
              onChange={(e) => onUpdateAlbumMeta({ albumSubtitle: e.target.value })}
              placeholder="부제"
              aria-label="표지 부제"
              className={`w-full text-sm border-b outline-none py-1.5 bg-transparent transition-colors ${fontCfg.fontClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
            />
            <input
              type="text"
              value={album.authorName}
              onChange={(e) => onUpdateAlbumMeta({ authorName: e.target.value })}
              placeholder="이름"
              aria-label="만든 사람 이름"
              className={`w-full text-sm border-b outline-none py-1.5 bg-transparent transition-colors ${fontCfg.fontClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
            />
            <input
              type="text"
              value={album.albumDate}
              onChange={(e) => onUpdateAlbumMeta({ albumDate: e.target.value })}
              placeholder="날짜"
              aria-label="날짜"
              className={`w-full text-sm border-b outline-none py-1.5 bg-transparent transition-colors ${fontCfg.fontClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
            />
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors duration-200 ${palette.sheetClass}`}
        >
          <div className={`flex items-center justify-between border-b pb-3 ${palette.headerDividerClass}`}>
            <span className={`text-xs font-medium ${palette.secondaryTextClass}`}>
              마지막 쪽 · 마무리 문구
            </span>
            <button
              type="button"
              onClick={() => onOpenPage(photos.length + 1)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${actionLinkClass}`}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>마무리 쪽 보기</span>
            </button>
          </div>

          <div className="space-y-2.5">
            <input
              type="text"
              value={album.closingTitle}
              onChange={(e) => onUpdateAlbumMeta({ closingTitle: e.target.value })}
              placeholder="마무리 제목 (예: 마치며)"
              aria-label="마무리 제목"
              className={`w-full text-sm font-semibold border-b outline-none py-1 bg-transparent transition-colors ${fontCfg.fontClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
            />
            <textarea
              rows={2}
              value={album.closingMessage}
              onChange={(e) => onUpdateAlbumMeta({ closingMessage: e.target.value })}
              placeholder="마지막 페이지에 남길 마무리 문구를 작성하세요..."
              aria-label="마무리 문구"
              className={`w-full text-sm border rounded-lg px-2.5 py-2 outline-none resize-none bg-transparent transition-colors ${fontCfg.fontClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
            />
          </div>
        </div>
      </section>

      {/* Photo Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo, index) => {
          const isCurrent = currentPageIndex === index + 1;
          return (
            <article
              key={photo.id}
              className={`rounded-2xl border p-4 flex flex-col transition-all duration-200 ${palette.sheetClass} ${
                isCurrent ? 'ring-2 ring-blue-600/30 shadow-sm' : ''
              }`}
            >
              {/* Card Header: Unboxed page index + controls */}
              <div className={`flex items-center justify-between gap-2 pb-3 mb-3 border-b ${palette.headerDividerClass}`}>
                <span className={`text-xs font-mono font-medium tabular-nums ${palette.secondaryTextClass}`}>
                  Photo {String(index + 1).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRotatePhoto(photo.id)}
                    title="90° 회전"
                    aria-label="90도 회전"
                    className={`p-1.5 rounded-md transition-colors ${palette.iconButtonClass}`}
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMovePhoto(index, -1)}
                    title="앞으로 이동"
                    aria-label="앞으로 이동"
                    className={`p-1.5 rounded-md disabled:opacity-30 disabled:pointer-events-none transition-colors ${palette.iconButtonClass}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={index === photos.length - 1}
                    onClick={() => onMovePhoto(index, 1)}
                    title="뒤로 이동"
                    aria-label="뒤로 이동"
                    className={`p-1.5 rounded-md disabled:opacity-30 disabled:pointer-events-none transition-colors ${palette.iconButtonClass}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(photo.id)}
                    title="삭제"
                    aria-label="삭제"
                    className={`p-1.5 rounded-md transition-colors ${deleteButtonClass}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Photo Thumbnail */}
              <button
                type="button"
                onClick={() => onOpenPage(index + 1)}
                className={`w-full aspect-[4/3] rounded-xl border overflow-hidden flex items-center justify-center p-2 transition-colors ${palette.frameClass}`}
                title="한 쪽씩 보기에서 열기"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.title || photo.fileName}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-sm"
                />
              </button>

              {/* Inline Title & Description */}
              <div className="mt-4 space-y-2 flex-1 flex flex-col">
                <input
                  type="text"
                  value={photo.title}
                  onChange={(e) => onUpdatePhoto(photo.id, { title: e.target.value })}
                  placeholder="제목 입력"
                  aria-label={`${index + 1}번 사진 제목`}
                  className={`w-full text-base font-semibold border-b outline-none pb-1 bg-transparent transition-colors ${fontCfg.fontClass} ${palette.primaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                />
                <textarea
                  rows={2}
                  value={photo.description}
                  onChange={(e) =>
                    onUpdatePhoto(photo.id, { description: e.target.value })
                  }
                  placeholder="설명 입력..."
                  aria-label={`${index + 1}번 사진 설명`}
                  className={`w-full text-xs sm:text-sm border rounded-lg px-2.5 py-2 outline-none resize-none bg-transparent transition-colors ${fontCfg.fontClass} ${palette.secondaryTextClass} ${palette.placeholderClass} ${palette.inputBorderClass}`}
                />
              </div>

              <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${palette.headerDividerClass}`}>
                <span className={`text-[11px] truncate ${palette.mutedTextClass}`}>
                  {photo.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenPage(index + 1)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${actionLinkClass}`}
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>이 쪽 보기</span>
                </button>
              </div>
            </article>
          );
        })}

        {/* Add More Photos Card */}
        <button
          type="button"
          onClick={onTriggerUpload}
          className="min-h-[300px] rounded-2xl border border-dashed border-zinc-300 bg-white/60 hover:bg-white hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-3 p-6 text-zinc-600 hover:text-blue-600"
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
            <ImagePlus className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-medium">사진 더 추가하기</span>
        </button>
      </div>
    </main>
  );
};
