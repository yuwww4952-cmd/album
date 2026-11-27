/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GridOverview } from './components/GridOverview';
import { PdfExportModal } from './components/PdfExportModal';
import { SinglePageViewer } from './components/SinglePageViewer';
import { TopBar } from './components/TopBar';
import { UploadDropzone } from './components/UploadDropzone';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import {
  AlbumFont,
  AlbumPhoto,
  AlbumState,
  AlbumTheme,
  PageOrientation,
  ViewMode,
} from './types/album';
import { exportAlbumPageToPng } from './utils/pdfExporter';
import {
  clearAlbumState,
  loadAlbumState,
  processImageFiles,
  rotatePhotoDataUrl,
  saveAlbumState,
} from './utils/storage';

function getTodayKoreanDate(): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function createInitialState(): AlbumState {
  return {
    albumTitle: '',
    albumSubtitle: '',
    authorName: '',
    albumDate: getTodayKoreanDate(),
    closingTitle: '',
    closingMessage: '',
    orientation: 'landscape',
    theme: 'white',
    font: 'myeongjo',
    photos: [],
  };
}

export default function App() {
  const [album, setAlbum] = useState<AlbumState>(createInitialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Page index: 0 = Cover, 1..photos.length = Photo pages, photos.length + 1 = Closing page
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSavingPng, setIsSavingPng] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  // Hydrate saved album from IndexedDB on mount (backward-compatible with older saved data)
  useEffect(() => {
    let active = true;
    loadAlbumState().then((saved) => {
      if (active && saved) {
        setAlbum({
          ...createInitialState(),
          ...saved,
          albumDate: saved.albumDate ?? getTodayKoreanDate(),
          theme: saved.theme ?? 'white',
          font: saved.font ?? 'myeongjo',
        });
      }
      if (active) {
        setIsHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist album state to IndexedDB whenever it changes after hydration
  useEffect(() => {
    if (!isHydrated) return;
    const timer = window.setTimeout(() => {
      saveAlbumState(album);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [album, isHydrated]);

  const handleFilesSelected = useCallback(async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    try {
      const processed = await processImageFiles(fileList);
      if (processed.length > 0) {
        setAlbum((prev) => {
          const nextPhotos = [...prev.photos, ...processed];
          // If first upload, start on Cover (0); if appending, jump to first newly added photo (prev.photos.length + 1)
          setCurrentPageIndex(prev.photos.length === 0 ? 0 : prev.photos.length + 1);
          return {
            ...prev,
            photos: nextPhotos,
          };
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleTriggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  // Global window drag-and-drop when photos already exist
  useEffect(() => {
    if (album.photos.length === 0) return;

    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragCounterRef.current += 1;
      setIsWindowDragging(true);
    };

    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
    };

    const onDragLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsWindowDragging(false);
      }
    };

    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsWindowDragging(false);
      handleFilesSelected(e.dataTransfer.files);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [album.photos.length, handleFilesSelected]);

  const handleUpdateAlbumMeta = useCallback(
    (
      patch: Partial<
        Pick<
          AlbumState,
          | 'albumTitle'
          | 'albumSubtitle'
          | 'authorName'
          | 'albumDate'
          | 'closingTitle'
          | 'closingMessage'
        >
      >
    ) => {
      setAlbum((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleUpdatePhoto = useCallback(
    (id: string, patch: Partial<Pick<AlbumPhoto, 'title' | 'description'>>) => {
      setAlbum((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    []
  );

  const handleRotatePhoto = useCallback(
    async (id: string) => {
      const target = album.photos.find((p) => p.id === id);
      if (!target) return;
      const rotated = await rotatePhotoDataUrl(target);
      setAlbum((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => (p.id === id ? rotated : p)),
      }));
    },
    [album.photos]
  );

  const handleMovePhoto = useCallback((photoIndex: number, direction: -1 | 1) => {
    const targetPhotoIndex = photoIndex + direction;
    setAlbum((prev) => {
      if (targetPhotoIndex < 0 || targetPhotoIndex >= prev.photos.length) return prev;
      const nextPhotos = [...prev.photos];
      const [moved] = nextPhotos.splice(photoIndex, 1);
      nextPhotos.splice(targetPhotoIndex, 0, moved);
      return { ...prev, photos: nextPhotos };
    });
    const oldPageIdx = photoIndex + 1;
    const newPageIdx = targetPhotoIndex + 1;
    setCurrentPageIndex((prevPage) => {
      if (prevPage === oldPageIdx) return newPageIdx;
      if (prevPage === newPageIdx) return oldPageIdx;
      return prevPage;
    });
  }, []);

  const handleDeletePhoto = useCallback((id: string) => {
    setAlbum((prev) => {
      const photoIdx = prev.photos.findIndex((p) => p.id === id);
      if (photoIdx === -1) return prev;
      const nextPhotos = prev.photos.filter((p) => p.id !== id);
      const deletedPageIdx = photoIdx + 1;
      setCurrentPageIndex((currPage) => {
        if (nextPhotos.length === 0) return 0;
        if (currPage > nextPhotos.length + 1) return nextPhotos.length + 1;
        if (currPage > deletedPageIdx) return currPage - 1;
        if (currPage === deletedPageIdx && currPage > nextPhotos.length) {
          return nextPhotos.length;
        }
        return currPage;
      });
      return { ...prev, photos: nextPhotos };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setAlbum(createInitialState());
    setCurrentPageIndex(0);
    setViewMode('single');
    clearAlbumState();
  }, []);

  const handleChangeAlbumTitle = useCallback((albumTitle: string) => {
    setAlbum((prev) => ({ ...prev, albumTitle }));
  }, []);

  const handleChangeOrientation = useCallback((orientation: PageOrientation) => {
    setAlbum((prev) => ({ ...prev, orientation }));
  }, []);

  const handleChangeTheme = useCallback((theme: AlbumTheme) => {
    setAlbum((prev) => ({ ...prev, theme }));
  }, []);

  const handleChangeFont = useCallback((font: AlbumFont) => {
    setAlbum((prev) => ({ ...prev, font }));
  }, []);

  const handleSaveCurrentPagePng = useCallback(async () => {
    if (isSavingPng || album.photos.length === 0) return;
    setIsSavingPng(true);
    try {
      await exportAlbumPageToPng(album, currentPageIndex);
    } finally {
      setIsSavingPng(false);
    }
  }, [album, currentPageIndex, isSavingPng]);

  const hasPhotos = album.photos.length > 0;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F6F6F4] text-zinc-900">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      <TopBar
        hasPhotos={hasPhotos}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onTriggerUpload={handleTriggerUpload}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
      />

      {!isHydrated ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <p className="text-sm text-zinc-500">앨범을 불러오는 중입니다...</p>
        </div>
      ) : !hasPhotos ? (
        <UploadDropzone
          isProcessing={isProcessing}
          onFilesSelected={handleFilesSelected}
          onTriggerFilePicker={handleTriggerUpload}
        />
      ) : (
        <>
          <WorkspaceToolbar
            albumTitle={album.albumTitle}
            photoCount={album.photos.length}
            orientation={album.orientation}
            theme={album.theme}
            font={album.font}
            viewMode={viewMode}
            isSavingPng={isSavingPng}
            onChangeAlbumTitle={handleChangeAlbumTitle}
            onChangeOrientation={handleChangeOrientation}
            onChangeTheme={handleChangeTheme}
            onChangeFont={handleChangeFont}
            onChangeViewMode={setViewMode}
            onSaveCurrentPagePng={handleSaveCurrentPagePng}
            onTriggerUpload={handleTriggerUpload}
            onClearAll={handleClearAll}
          />

          {viewMode === 'single' ? (
            <SinglePageViewer
              album={album}
              currentPageIndex={currentPageIndex}
              isSavingPng={isSavingPng}
              onSelectPage={setCurrentPageIndex}
              onSaveCurrentPagePng={handleSaveCurrentPagePng}
              onUpdateAlbumMeta={handleUpdateAlbumMeta}
              onUpdatePhoto={handleUpdatePhoto}
              onRotatePhoto={handleRotatePhoto}
              onMovePhoto={handleMovePhoto}
              onDeletePhoto={handleDeletePhoto}
            />
          ) : (
            <GridOverview
              album={album}
              currentPageIndex={currentPageIndex}
              onOpenPage={(pageIdx) => {
                setCurrentPageIndex(pageIdx);
                setViewMode('single');
              }}
              onUpdateAlbumMeta={handleUpdateAlbumMeta}
              onUpdatePhoto={handleUpdatePhoto}
              onRotatePhoto={handleRotatePhoto}
              onMovePhoto={handleMovePhoto}
              onDeletePhoto={handleDeletePhoto}
              onTriggerUpload={handleTriggerUpload}
            />
          )}
        </>
      )}

      {/* Drag-over overlay when adding more photos */}
      {isWindowDragging && hasPhotos && (
        <div className="fixed inset-0 z-40 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white border-2 border-dashed border-blue-600 rounded-2xl px-10 py-8 shadow-xl text-center">
            <p className="text-lg font-semibold text-zinc-900">
              여기에 사진을 놓으면 앨범에 추가됩니다
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              한 번에 여러 장을 올릴 수 있습니다
            </p>
          </div>
        </div>
      )}

      {/* Non-blocking indicator while reading new photos */}
      {isProcessing && hasPhotos && (
        <div className="fixed bottom-5 right-5 z-40 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg">
          사진을 앨범에 추가하는 중...
        </div>
      )}

      <PdfExportModal
        isOpen={isPdfModalOpen}
        album={album}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
}
