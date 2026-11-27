import React, { useState } from 'react';
import { ImageDown, ImagePlus, Trash2 } from 'lucide-react';
import { AlbumFont, AlbumTheme, PageOrientation, ViewMode } from '../types/album';
import { ALBUM_FONTS } from '../utils/albumFonts';
import { ALBUM_THEMES } from '../utils/albumThemes';

interface WorkspaceToolbarProps {
  albumTitle: string;
  photoCount: number;
  orientation: PageOrientation;
  theme: AlbumTheme;
  font: AlbumFont;
  viewMode: ViewMode;
  isSavingPng: boolean;
  onChangeAlbumTitle: (title: string) => void;
  onChangeOrientation: (orientation: PageOrientation) => void;
  onChangeTheme: (theme: AlbumTheme) => void;
  onChangeFont: (font: AlbumFont) => void;
  onChangeViewMode: (mode: ViewMode) => void;
  onSaveCurrentPagePng: () => void;
  onTriggerUpload: () => void;
  onClearAll: () => void;
}

const THEME_ORDER: AlbumTheme[] = ['white', 'beige', 'navy'];
const FONT_ORDER: AlbumFont[] = ['gothic', 'myeongjo', 'handwriting'];

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  albumTitle,
  photoCount,
  orientation,
  theme,
  font,
  viewMode,
  isSavingPng,
  onChangeAlbumTitle,
  onChangeOrientation,
  onChangeTheme,
  onChangeFont,
  onChangeViewMode,
  onSaveCurrentPagePng,
  onTriggerUpload,
  onClearAll,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="bg-white/80 border-b border-zinc-200/80">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Album Title Input + Unboxed Metadata */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
          <input
            type="text"
            value={albumTitle}
            onChange={(e) => onChangeAlbumTitle(e.target.value)}
            placeholder="앨범 제목을 입력하세요 (예: 2026 가을의 기록)"
            aria-label="앨범 제목"
            className="w-full min-w-[140px] text-sm sm:text-base font-semibold text-zinc-900 placeholder:text-zinc-400 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-600 outline-none py-1 transition-colors"
          />
          <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap shrink-0">
            총 {photoCount}장
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile View Mode Switch (visible below md where header nav is hidden) */}
          <div className="flex md:hidden items-center gap-1 p-1 bg-zinc-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeViewMode('single')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'single'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600'
              }`}
            >
              한 쪽씩
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600'
              }`}
            >
              전체 목록
            </button>
          </div>

          {/* 3 Album Font Buttons */}
          <div
            className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg"
            role="group"
            aria-label="앨범 글꼴"
          >
            {FONT_ORDER.map((fontKey) => {
              const fontCfg = ALBUM_FONTS[fontKey];
              const isSelected = font === fontKey;
              return (
                <button
                  key={fontKey}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChangeFont(fontKey)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${fontCfg.fontClass} ${
                    isSelected
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {fontCfg.label}
                </button>
              );
            })}
          </div>

          {/* 3 Album Color Mood Buttons */}
          <div
            className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg"
            role="group"
            aria-label="앨범 색 분위기"
          >
            {THEME_ORDER.map((themeKey) => {
              const palette = ALBUM_THEMES[themeKey];
              const isSelected = theme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChangeTheme(themeKey)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-full border border-zinc-300/90 shrink-0"
                    style={{ backgroundColor: palette.swatchHex }}
                  />
                  <span>{palette.label}</span>
                </button>
              );
            })}
          </div>

          {/* Orientation Segmented Control */}
          <div
            className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg"
            role="group"
            aria-label="페이지 비율"
          >
            <button
              type="button"
              onClick={() => onChangeOrientation('landscape')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                orientation === 'landscape'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              가로형
            </button>
            <button
              type="button"
              onClick={() => onChangeOrientation('portrait')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                orientation === 'portrait'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              세로형
            </button>
          </div>

          {/* Current Page PNG Save Button */}
          {viewMode === 'single' && (
            <button
              type="button"
              disabled={isSavingPng}
              onClick={onSaveCurrentPagePng}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:border-zinc-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <ImageDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isSavingPng ? 'PNG 저장 중...' : '현재 쪽 PNG 저장'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:border-zinc-400 transition-colors whitespace-nowrap shrink-0"
          >
            <ImagePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>사진 추가</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">비우기</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
              <span className="text-xs text-rose-700 whitespace-nowrap">
                모두 삭제할까요?
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  onClearAll();
                }}
                className="px-2 py-0.5 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 whitespace-nowrap"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-0.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 whitespace-nowrap"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
