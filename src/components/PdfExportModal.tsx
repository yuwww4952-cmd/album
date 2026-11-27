import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, X } from 'lucide-react';
import { AlbumState, PageOrientation, PdfExportOptions } from '../types/album';
import { exportAlbumToPdf } from '../utils/pdfExporter';

interface PdfExportModalProps {
  isOpen: boolean;
  album: AlbumState;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  album,
  onClose,
}) => {
  const [fileName, setFileName] = useState(album.albumTitle.trim() || '포토_모노그래프_앨범');
  const [orientation, setOrientation] = useState<PageOrientation>(album.orientation);
  const [includeCover, setIncludeCover] = useState(true);
  const [includeClosing, setIncludeClosing] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName(album.albumTitle.trim() || '포토_모노그래프_앨범');
      setOrientation(album.orientation);
      setIsComplete(false);
      setErrorMessage(null);
      setProgress({ current: 0, total: 0 });
    }
  }, [isOpen, album.albumTitle, album.orientation]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  const totalPdfPages =
    album.photos.length + (includeCover ? 1 : 0) + (includeClosing ? 1 : 0);

  const handleStartExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExporting || album.photos.length === 0) return;

    setIsExporting(true);
    setIsComplete(false);
    setErrorMessage(null);
    setProgress({ current: 0, total: totalPdfPages });

    try {
      const options: PdfExportOptions = {
        fileName,
        orientation,
        includeCover,
        includeClosing,
        showPageNumbers,
      };
      await exportAlbumToPdf(album, options, (current, total) =>
        setProgress({ current, total })
      );
      setIsComplete(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'PDF 생성 중 문제가 발생했습니다.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      onClick={() => {
        if (!isExporting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="pdf-modal-title" className="text-lg font-semibold text-zinc-900">
              PDF 앨범 저장
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              사진 {album.photos.length}장 · 총 {totalPdfPages}페이지로 구성됩니다
            </p>
          </div>
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStartExport} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="pdf-filename"
              className="block text-sm font-medium text-zinc-800 mb-1.5"
            >
              파일 이름
            </label>
            <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15 bg-white overflow-hidden">
              <input
                id="pdf-filename"
                type="text"
                value={fileName}
                disabled={isExporting}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="포토_모노그래프_앨범"
                className="w-full px-3.5 py-2.5 text-sm text-zinc-900 outline-none bg-transparent"
              />
              <span className="px-3 text-xs font-mono text-zinc-400 border-l border-zinc-200 bg-zinc-50 py-2.5 shrink-0">
                .pdf
              </span>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-zinc-800 mb-2">
              용지 방향 (A4)
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-lg">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setOrientation('landscape')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  orientation === 'landscape'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                가로형 (Landscape)
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setOrientation('portrait')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  orientation === 'portrait'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                세로형 (Portrait)
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <div>
                <span className="block text-sm font-medium text-zinc-800">
                  첫 쪽 표지 포함
                </span>
                <span className="block text-xs text-zinc-500">
                  제목, 부제, 이름과 날짜가 크게 담긴 표지를 첫 페이지로 추가합니다
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeCover}
                disabled={isExporting}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <div>
                <span className="block text-sm font-medium text-zinc-800">
                  마지막 쪽 마무리 문구 포함
                </span>
                <span className="block text-xs text-zinc-500">
                  마지막 페이지에 작성한 마무리 인사말을 함께 저장합니다
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeClosing}
                disabled={isExporting}
                onChange={(e) => setIncludeClosing(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <div>
                <span className="block text-sm font-medium text-zinc-800">
                  쪽 번호 표시
                </span>
                <span className="block text-xs text-zinc-500">
                  각 사진 페이지 우측 하단에 페이지 번호를 깔끔하게 인쇄합니다
                </span>
              </div>
              <input
                type="checkbox"
                checked={showPageNumbers}
                disabled={isExporting}
                onChange={(e) => setShowPageNumbers(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {isExporting && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-600 tabular-nums">
                <span>고화질 페이지 생성 중...</span>
                <span>
                  {progress.current} / {progress.total} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {isComplete && !isExporting && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>PDF 앨범이 생성되어 다운로드를 시작했습니다.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
            <button
              type="button"
              disabled={isExporting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={isExporting || album.photos.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isExporting ? 'PDF 만드는 중...' : 'PDF 다운로드'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
