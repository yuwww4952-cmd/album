import { jsPDF } from 'jspdf';
import { AlbumPhoto, AlbumState, PdfExportOptions } from '../types/album';
import { ALBUM_FONTS, AlbumFontConfig, ensureAlbumFontsLoaded } from './albumFonts';
import { ALBUM_THEMES, AlbumThemePalette } from './albumThemes';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오는 중 오류가 발생했습니다.'));
    img.src = src;
  });
}

function makeCanvasFont(
  weight: string,
  baseSizePx: number,
  fontConfig: AlbumFontConfig,
  applyScale = true
): string {
  const scaled = applyScale
    ? Math.round(baseSizePx * fontConfig.canvasSizeScale)
    : baseSizePx;
  return `${weight} ${scaled}px ${fontConfig.cssFamily}`;
}

function wrapTextToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text.trim()) {
    return [];
  }

  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    let currentLine = '';
    const chars = Array.from(paragraph);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        const lastSpaceIndex = currentLine.lastIndexOf(' ');
        if (lastSpaceIndex > currentLine.length * 0.55 && char !== ' ') {
          const linePart = currentLine.slice(0, lastSpaceIndex);
          const carryPart = currentLine.slice(lastSpaceIndex + 1) + char;
          lines.push(linePart);
          currentLine = carryPart;
        } else {
          lines.push(currentLine);
          currentLine = char === ' ' ? '' : char;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function renderCoverCanvas(
  album: Pick<AlbumState, 'albumTitle' | 'albumSubtitle' | 'authorName' | 'albumDate' | 'photos'>,
  palette: AlbumThemePalette,
  fontConfig: AlbumFontConfig,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.paperBg;
  ctx.fillRect(0, 0, width, height);

  const inset = Math.round(Math.min(width, height) * 0.06);
  ctx.strokeStyle = palette.paperBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  const centerX = width / 2;
  const maxTextWidth = width * 0.74;
  const isLandscape = width > height;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = palette.textMuted;
  ctx.font = '500 22px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillText('PHOTO ALBUM', centerX, inset + 76);

  const displayTitle = album.albumTitle.trim() || '나의 포토 앨범';
  const titleFontSize = isLandscape ? 80 : 74;
  const titleLineHeight = Math.round(
    (isLandscape ? 104 : 96) * Math.min(fontConfig.canvasSizeScale, 1.15)
  );
  ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, titleFontSize, fontConfig);
  const titleLines = wrapTextToLines(ctx, displayTitle, maxTextWidth).slice(0, 3);

  const subtitleText = album.albumSubtitle.trim();
  const subFontSize = isLandscape ? 34 : 32;
  const subLineHeight = Math.round(48 * Math.min(fontConfig.canvasSizeScale, 1.15));
  ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, subFontSize, fontConfig);
  const subLines = subtitleText
    ? wrapTextToLines(ctx, subtitleText, maxTextWidth).slice(0, 2)
    : [];

  const totalTitleH = titleLines.length * titleLineHeight;
  const ruleGap = 36;
  const totalSubH = subLines.length > 0 ? subLines.length * subLineHeight + 28 : 0;
  const centerBlockH = totalTitleH + ruleGap + totalSubH;
  let cursorY = height * 0.45 - centerBlockH / 2 + titleLineHeight / 2;

  ctx.fillStyle = palette.textPrimary;
  ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, titleFontSize, fontConfig);
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, centerX, cursorY + idx * titleLineHeight);
  });
  cursorY += (titleLines.length - 1) * titleLineHeight + titleLineHeight / 2;

  const ruleY = cursorY + 26;
  ctx.strokeStyle = palette.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 56, ruleY);
  ctx.lineTo(centerX + 56, ruleY);
  ctx.stroke();

  if (subLines.length > 0) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, subFontSize, fontConfig);
    const subStartY = ruleY + 54;
    subLines.forEach((line, idx) => {
      ctx.fillText(line, centerX, subStartY + idx * subLineHeight);
    });
  }

  const authorText = album.authorName.trim();
  const dateText = album.albumDate.trim();
  const metaYBase = height - inset - (authorText && dateText ? 115 : 88);

  if (authorText) {
    ctx.fillStyle = palette.textPrimary;
    ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, 32, fontConfig);
    ctx.fillText(authorText, centerX, metaYBase);
  }

  if (dateText) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, 26, fontConfig);
    ctx.fillText(dateText, centerX, authorText ? metaYBase + 46 : metaYBase);
  }

  ctx.fillStyle = palette.textMuted;
  ctx.font = '400 18px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillText(`총 ${album.photos.length}장의 기록`, centerX, height - inset - 32);

  return canvas;
}

function renderClosingCanvas(
  album: Pick<AlbumState, 'closingTitle' | 'closingMessage' | 'authorName' | 'albumDate'>,
  palette: AlbumThemePalette,
  fontConfig: AlbumFontConfig,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.paperBg;
  ctx.fillRect(0, 0, width, height);

  const inset = Math.round(Math.min(width, height) * 0.06);
  ctx.strokeStyle = palette.paperBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  const centerX = width / 2;
  const maxTextWidth = width * 0.68;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const heading = album.closingTitle.trim() || '마치며';
  ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, 44, fontConfig);
  const headingLines = wrapTextToLines(ctx, heading, maxTextWidth).slice(0, 2);

  const bodyText =
    album.closingMessage.trim() || '함께한 소중한 순간들을 오래도록 기억합니다.';
  ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, 28, fontConfig);
  const bodyLines = wrapTextToLines(ctx, bodyText, maxTextWidth).slice(0, 10);

  const headingLH = Math.round(58 * Math.min(fontConfig.canvasSizeScale, 1.15));
  const bodyLH = Math.round(46 * Math.min(fontConfig.canvasSizeScale, 1.15));
  const gapAfterHeading = 36;
  const totalH =
    headingLines.length * headingLH + gapAfterHeading + bodyLines.length * bodyLH;

  const cursorY = height * 0.46 - totalH / 2 + headingLH / 2;

  ctx.fillStyle = palette.textPrimary;
  ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, 44, fontConfig);
  headingLines.forEach((line, idx) => {
    ctx.fillText(line, centerX, cursorY + idx * headingLH);
  });

  const ruleY = cursorY + (headingLines.length - 1) * headingLH + 42;
  ctx.strokeStyle = palette.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 36, ruleY);
  ctx.lineTo(centerX + 36, ruleY);
  ctx.stroke();

  const bodyY = ruleY + 52;
  ctx.fillStyle = palette.textSecondary;
  ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, 28, fontConfig);
  bodyLines.forEach((line, idx) => {
    if (line !== '') {
      ctx.fillText(line, centerX, bodyY + idx * bodyLH);
    }
  });

  const signatureParts = [album.authorName.trim(), album.albumDate.trim()].filter(Boolean);
  if (signatureParts.length > 0) {
    ctx.fillStyle = palette.textMuted;
    ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, 22, fontConfig);
    ctx.fillText(signatureParts.join('  ·  '), centerX, height - inset - 54);
  }

  return canvas;
}

async function renderPhotoPageCanvas(
  photo: AlbumPhoto,
  pageNumber: number,
  totalPages: number,
  palette: AlbumThemePalette,
  fontConfig: AlbumFontConfig,
  width: number,
  height: number,
  showPageNumbers: boolean
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.paperBg;
  ctx.fillRect(0, 0, width, height);

  const isLandscape = width > height;
  const marginX = Math.round(width * 0.085);
  const marginTop = Math.round(height * 0.075);
  const marginBottom = Math.round(height * 0.065);
  const contentWidth = width - marginX * 2;

  const titleText = photo.title.trim();
  const descText = photo.description.trim();

  const baseTitleSize = isLandscape ? 34 : 36;
  const baseDescSize = isLandscape ? 22 : 23;

  ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, baseTitleSize, fontConfig);
  const titleLines = titleText ? wrapTextToLines(ctx, titleText, contentWidth).slice(0, 2) : [];

  ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, baseDescSize, fontConfig);
  const descLines = descText ? wrapTextToLines(ctx, descText, contentWidth).slice(0, 6) : [];

  const titleLineHeight = Math.round(46 * Math.min(fontConfig.canvasSizeScale, 1.15));
  const descLineHeight = Math.round(35 * Math.min(fontConfig.canvasSizeScale, 1.15));
  const footerReserve = showPageNumbers ? 44 : 16;

  let textBlockHeight = 0;
  if (titleLines.length > 0) {
    textBlockHeight += titleLines.length * titleLineHeight;
  }
  if (descLines.length > 0) {
    textBlockHeight += (titleLines.length > 0 ? 16 : 0) + descLines.length * descLineHeight;
  }

  const gapBetweenImageAndText = textBlockHeight > 0 ? Math.round(height * 0.038) : 0;
  const maxImageHeight = Math.max(
    height * 0.45,
    height - marginTop - marginBottom - footerReserve - textBlockHeight - gapBetweenImageAndText
  );

  const img = await loadImage(photo.dataUrl);
  const imgNaturalW = img.naturalWidth || photo.width || 1;
  const imgNaturalH = img.naturalHeight || photo.height || 1;

  const scale = Math.min(contentWidth / imgNaturalW, maxImageHeight / imgNaturalH);
  const drawW = Math.round(imgNaturalW * scale);
  const drawH = Math.round(imgNaturalH * scale);

  const drawX = Math.round((width - drawW) / 2);
  const drawY = Math.round(marginTop + (maxImageHeight - drawH) / 2);

  ctx.save();
  ctx.shadowColor = palette.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(24, 24, 27, 0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = palette.frameBg;
  ctx.fillRect(drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  ctx.strokeStyle = palette.frameBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(drawX, drawY, drawW, drawH);

  let cursorY = marginTop + maxImageHeight + gapBetweenImageAndText;

  if (titleLines.length > 0) {
    ctx.fillStyle = palette.textPrimary;
    ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, baseTitleSize, fontConfig);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    titleLines.forEach((line, idx) => {
      ctx.fillText(line, marginX, cursorY + idx * titleLineHeight);
    });
    cursorY += titleLines.length * titleLineHeight + 16;
  }

  if (descLines.length > 0) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, baseDescSize, fontConfig);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    descLines.forEach((line, idx) => {
      ctx.fillText(line, marginX, cursorY + idx * descLineHeight);
    });
  }

  if (showPageNumbers) {
    const pageLabel = `${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;
    ctx.fillStyle = palette.textMuted;
    ctx.font = '500 18px "JetBrains Mono", "Plus Jakarta Sans", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(pageLabel, width - marginX, height - marginBottom + 8);
  }

  return canvas;
}

/**
 * Renders the current album page as a PNG matching the live preview sheet (framed mat, top header bar,
 * exact theme colors, and exact font family).
 */
async function renderPreviewExactPhotoCanvas(
  photo: AlbumPhoto,
  photoNumber: number,
  totalPhotos: number,
  palette: AlbumThemePalette,
  fontConfig: AlbumFontConfig,
  isLandscape: boolean
): Promise<HTMLCanvasElement> {
  const width = isLandscape ? 1680 : 1200;
  const padX = 72;
  const padY = 64;
  const headerH = 56;
  const frameBoxH = isLandscape ? 780 : 960;
  const framePad = 36;
  const contentW = width - padX * 2;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;

  const titleText = photo.title.trim();
  const descText = photo.description.trim();

  tempCtx.font = makeCanvasFont(fontConfig.canvasTitleWeight, 40, fontConfig);
  const titleLines = titleText ? wrapTextToLines(tempCtx, titleText, contentW) : [];

  tempCtx.font = makeCanvasFont(fontConfig.canvasBodyWeight, 25, fontConfig);
  const descLines = descText ? wrapTextToLines(tempCtx, descText, contentW) : [];

  const titleLH = Math.round(52 * Math.min(fontConfig.canvasSizeScale, 1.15));
  const descLH = Math.round(38 * Math.min(fontConfig.canvasSizeScale, 1.15));

  const titleBlockH = titleLines.length > 0 ? titleLines.length * titleLH : 0;
  const descBlockH = descLines.length > 0 ? descLines.length * descLH : 0;
  const gapTitleDesc = titleBlockH > 0 && descBlockH > 0 ? 18 : 0;
  const textSectionTopGap = titleBlockH > 0 || descBlockH > 0 ? 44 : 0;

  const height =
    padY +
    headerH +
    28 +
    frameBoxH +
    textSectionTopGap +
    titleBlockH +
    gapTitleDesc +
    descBlockH +
    padY;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background paper matching preview sheet
  ctx.fillStyle = palette.paperBg;
  ctx.fillRect(0, 0, width, height);

  // Subtle sheet border matching preview
  ctx.strokeStyle = palette.paperBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Top metadata row (01 / N · filename) + hairline divider
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const indexLabel = `${String(photoNumber).padStart(2, '0')} / ${String(totalPhotos).padStart(2, '0')}`;
  ctx.fillStyle = palette.textSecondary;
  ctx.font = '500 20px "JetBrains Mono", "Plus Jakarta Sans", monospace';
  ctx.fillText(indexLabel, padX, padY + 14);

  const indexMetrics = ctx.measureText(indexLabel);
  ctx.fillStyle = palette.textMuted;
  ctx.font = '400 20px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillText(`  ·  ${photo.fileName}`, padX + indexMetrics.width, padY + 14);

  const dividerY = padY + headerH;
  ctx.strokeStyle = palette.divider;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, dividerY);
  ctx.lineTo(width - padX, dividerY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Framed Photo Mat Container (matches preview bg-zinc-50 / beige / navy frame box)
  const frameY = dividerY + 28;
  drawRoundedRectPath(ctx, padX, frameY, contentW, frameBoxH, 20);
  ctx.fillStyle = palette.frameBg;
  ctx.fill();
  ctx.strokeStyle = palette.frameBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const img = await loadImage(photo.dataUrl);
  const imgNaturalW = img.naturalWidth || photo.width || 1;
  const imgNaturalH = img.naturalHeight || photo.height || 1;
  const innerW = contentW - framePad * 2;
  const innerH = frameBoxH - framePad * 2;

  const scale = Math.min(innerW / imgNaturalW, innerH / imgNaturalH);
  const drawW = Math.round(imgNaturalW * scale);
  const drawH = Math.round(imgNaturalH * scale);
  const drawX = Math.round(padX + (contentW - drawW) / 2);
  const drawY = Math.round(frameY + (frameBoxH - drawH) / 2);

  ctx.save();
  ctx.shadowColor = palette.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(24, 24, 27, 0.14)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = palette.frameBg;
  ctx.fillRect(drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Title & Description directly underneath
  let cursorY = frameY + frameBoxH + textSectionTopGap;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  if (titleLines.length > 0) {
    ctx.fillStyle = palette.textPrimary;
    ctx.font = makeCanvasFont(fontConfig.canvasTitleWeight, 40, fontConfig);
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, padX, cursorY + idx * titleLH);
    });
    cursorY += titleLines.length * titleLH + gapTitleDesc;
  }

  if (descLines.length > 0) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = makeCanvasFont(fontConfig.canvasBodyWeight, 25, fontConfig);
    descLines.forEach((line, idx) => {
      ctx.fillText(line, padX, cursorY + idx * descLH);
    });
  }

  return canvas;
}

function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function sanitizeFilename(raw: string, fallback: string): string {
  return (raw.trim() || fallback)
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\.(pdf|png)$/i, '');
}

export async function exportAlbumToPdf(
  album: AlbumState,
  options: PdfExportOptions,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (album.photos.length === 0) {
    throw new Error('저장할 사진이 없습니다.');
  }

  const fontKey = album.font ?? 'myeongjo';
  await ensureAlbumFontsLoaded(fontKey);

  const palette = ALBUM_THEMES[album.theme ?? 'white'];
  const fontConfig = ALBUM_FONTS[fontKey];
  const isLandscape = options.orientation === 'landscape';
  const canvasWidth = isLandscape ? 1684 : 1191;
  const canvasHeight = isLandscape ? 1191 : 1684;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfPageW = pdf.internal.pageSize.getWidth();
  const pdfPageH = pdf.internal.pageSize.getHeight();

  const totalSteps =
    album.photos.length +
    (options.includeCover ? 1 : 0) +
    (options.includeClosing ? 1 : 0);
  let completedSteps = 0;
  let isFirstPdfPage = true;

  if (options.includeCover) {
    const coverCanvas = renderCoverCanvas(album, palette, fontConfig, canvasWidth, canvasHeight);
    const coverData = coverCanvas.toDataURL('image/jpeg', 0.94);
    pdf.addImage(coverData, 'JPEG', 0, 0, pdfPageW, pdfPageH, undefined, 'FAST');
    isFirstPdfPage = false;
    completedSteps += 1;
    onProgress?.(completedSteps, totalSteps);
  }

  for (let i = 0; i < album.photos.length; i++) {
    if (!isFirstPdfPage) {
      pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }
    isFirstPdfPage = false;

    const pageCanvas = await renderPhotoPageCanvas(
      album.photos[i],
      i + 1,
      album.photos.length,
      palette,
      fontConfig,
      canvasWidth,
      canvasHeight,
      options.showPageNumbers
    );
    const pageData = pageCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(pageData, 'JPEG', 0, 0, pdfPageW, pdfPageH, undefined, 'FAST');

    completedSteps += 1;
    onProgress?.(completedSteps, totalSteps);

    await new Promise((resolve) => setTimeout(resolve, 12));
  }

  if (options.includeClosing) {
    if (!isFirstPdfPage) {
      pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }
    const closingCanvas = renderClosingCanvas(album, palette, fontConfig, canvasWidth, canvasHeight);
    const closingData = closingCanvas.toDataURL('image/jpeg', 0.94);
    pdf.addImage(closingData, 'JPEG', 0, 0, pdfPageW, pdfPageH, undefined, 'FAST');
    completedSteps += 1;
    onProgress?.(completedSteps, totalSteps);
  }

  const safeBaseName = sanitizeFilename(
    options.fileName || album.albumTitle,
    '포토_모노그래프'
  );
  pdf.save(`${safeBaseName}.pdf`);
}

export async function exportAlbumPageToPng(
  album: AlbumState,
  pageIndex: number
): Promise<void> {
  if (album.photos.length === 0) {
    throw new Error('저장할 사진이 없습니다.');
  }

  const fontKey = album.font ?? 'myeongjo';
  await ensureAlbumFontsLoaded(fontKey);

  const palette = ALBUM_THEMES[album.theme ?? 'white'];
  const fontConfig = ALBUM_FONTS[fontKey];
  const isLandscape = album.orientation === 'landscape';
  const coverWidth = isLandscape ? 1680 : 1200;
  const coverHeight = isLandscape ? 1188 : 1560;

  const baseName = sanitizeFilename(album.albumTitle, '포토_모노그래프');
  const totalPages = album.photos.length + 2;
  const safeIdx = Math.min(Math.max(pageIndex, 0), totalPages - 1);

  if (safeIdx === 0) {
    const canvas = renderCoverCanvas(album, palette, fontConfig, coverWidth, coverHeight);
    downloadCanvasAsPng(canvas, `${baseName}_00_표지.png`);
    return;
  }

  if (safeIdx === totalPages - 1) {
    const canvas = renderClosingCanvas(album, palette, fontConfig, coverWidth, coverHeight);
    downloadCanvasAsPng(
      canvas,
      `${baseName}_${String(album.photos.length + 1).padStart(2, '0')}_마무리.png`
    );
    return;
  }

  const photoIdx = safeIdx - 1;
  const photo = album.photos[photoIdx];
  const canvas = await renderPreviewExactPhotoCanvas(
    photo,
    photoIdx + 1,
    album.photos.length,
    palette,
    fontConfig,
    isLandscape
  );
  const photoTitle = sanitizeFilename(photo.title, `사진_${photoIdx + 1}`);
  downloadCanvasAsPng(
    canvas,
    `${baseName}_${String(photoIdx + 1).padStart(2, '0')}_${photoTitle}.png`
  );
}
