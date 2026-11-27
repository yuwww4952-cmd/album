import React, { useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';

interface UploadDropzoneProps {
  isProcessing: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
  onTriggerFilePicker: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  isProcessing,
  onFilesSelected,
  onTriggerFilePicker,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-medium text-zinc-500 mb-3">
          개인 포토북 제작기 · 한 쪽에 한 장씩
        </p>
        <h1
          className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900 leading-[1.18]"
          style={{ textWrap: 'balance' }}
        >
          한 장의 사진, 하나의 페이지로 엮는 앨범
        </h1>
        <p className="mt-4 text-base text-zinc-600 leading-relaxed max-w-xl">
          여러 장의 사진을 올리면 한 쪽에 한 장씩 감상할 수 있는 앨범을 즉시 만들어 드립니다.
          사진마다 제목과 이야기를 기록하고 PDF로 저장하세요.
        </p>
      </div>

      {/* Interactive Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border transition-all duration-150 bg-white p-8 sm:p-14 text-center ${
          isDragging
            ? 'border-blue-600 bg-blue-50/40 shadow-sm'
            : 'border-dashed border-zinc-300 hover:border-zinc-400'
        }`}
      >
        <div className="mx-auto w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 mb-5">
          {isDragging ? (
            <Upload className="w-6 h-6 text-blue-600" aria-hidden="true" />
          ) : (
            <ImagePlus className="w-6 h-6" aria-hidden="true" />
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
          {isProcessing
            ? '사진을 앨범 페이지로 불러오는 중...'
            : isDragging
              ? '여기에 놓으면 앨범에 추가됩니다'
              : '사진 여러 장을 끌어다 놓거나 선택하세요'}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          JPG · PNG · WEBP 지원 · 브라우저 내에서 안전하게 처리됩니다
        </p>

        <div className="mt-7">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onTriggerFilePicker}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap"
          >
            <ImagePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isProcessing ? '불러오는 중...' : '사진 여러 장 선택하기'}</span>
          </button>
        </div>
      </div>

      {/* Clean 3-column editorial steps without pill badges or thick borders */}
      <div className="mt-12 pt-8 border-t border-zinc-200 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">01. 다중 사진 업로드</h3>
          <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
            원하는 만큼 사진을 한 번에 선택하거나 드래그해 페이지 순서를 구성할 수 있습니다.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">02. 제목과 설명 기록</h3>
          <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
            각 페이지의 사진 아래에 고유한 제목과 당시의 기록을 자유롭게 작성하고 수정하세요.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">03. 넘겨 보기 및 PDF 저장</h3>
          <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
            이전 · 다음 버튼으로 한 장씩 감상한 뒤, 한 쪽에 한 장씩 담긴 고화질 PDF로 내보냅니다.
          </p>
        </div>
      </div>
    </main>
  );
};
