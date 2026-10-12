import { toPng, toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";

const SNAPSHOT_OPTS = {
  pixelRatio: 2,
  backgroundColor: "#ffffff",
  skipFonts: true,
};

// Portrait dimensions (width × height) in inches
const PAPER_SIZES = {
  letter: [8.5, 11],
  "letter-borderless": [8.5, 11],
  "11x14": [11, 14],
  "11x17": [11, 17],
};

/** Landscape PDF: tight margins to match on-screen printable layout (see PrintableBingoPages). */
const PRINT_LAYOUTS = {
  letter: { margin: 0.12, gap: 0.03 },
  "letter-borderless": { margin: 0.08, gap: 0.025 },
  "11x14": { margin: 0.2, gap: 0.05 },
  "11x17": { margin: 0.2, gap: 0.05 },
};

function downloadUrl(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function fitRectInPrintable(imgWpx, imgHpx, printableW, printableH) {
  const aspect = imgWpx / imgHpx;
  let w = printableW;
  let h = w / aspect;
  if (h > printableH) {
    h = printableH;
    w = h * aspect;
  }
  return { w, h };
}

function getPdfPageCount(cardRefs, options = {}) {
  if (options.fullPage) return Math.max(1, cardRefs.length);
  return Math.max(1, Math.ceil(cardRefs.length / 2));
}

export function useExport() {
  function drawPageHeader(doc, header, textX, textY) {
    if (!header?.title) return;
    const title = String(header.title || "").trim();
    if (!title) return;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(title, textX, textY);
  }

  // Renders cardRefs into an existing doc. isFirstSection=false adds a page before the first card.
  async function renderCardsToDoc(doc, cardRefs, paperSize, options = {}, isFirstSection = true) {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const layout = PRINT_LAYOUTS[paperSize] ?? PRINT_LAYOUTS.letter;
    const { margin, gap } = layout;
    const cardsPerPage = 2;
    const header = options.pageHeader || null;
    const headerBand = header?.title ? 0.62 : 0;
    const contentTop = margin + headerBand;
    const printableW = pageW - margin * 2;
    const printableH = pageH - margin - contentTop;
    const total = cardRefs.length;

    if (options.fullPage) {
      for (let i = 0; i < total; i++) {
        if (!isFirstSection || i > 0) doc.addPage();
        const canvas = await toCanvas(cardRefs[i], SNAPSHOT_OPTS);
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
        options.onProgress?.(i + 1, total);
      }
      return;
    }

    for (let i = 0; i < total; i++) {
      if (i % cardsPerPage === 0 && (!isFirstSection || i > 0)) doc.addPage();

      const canvas = await toCanvas(cardRefs[i], SNAPSHOT_OPTS);
      const imgData = canvas.toDataURL("image/png");
      const aspect = canvas.height / canvas.width;

      const maxSlotW = (printableW - gap) / 2;
      let cardW = maxSlotW;
      let cardH = cardW * aspect;

      if (cardH > printableH) {
        const scale = printableH / cardH;
        cardW *= scale;
        cardH = printableH;
      }

      const col = i % 2;
      const rowW = cardW * 2 + gap;
      const x0 = margin + (printableW - rowW) / 2;
      const x = x0 + col * (cardW + gap);
      const y = contentTop + (printableH - cardH) / 2;
      if (i % cardsPerPage === 0) drawPageHeader(doc, header, x0, margin + 0.3);

      doc.addImage(imgData, "PNG", x, y, cardW, cardH, undefined, "FAST");
      options.onProgress?.(i + 1, total);
    }
  }

  async function buildPdfDoc(cardRefs, paperSize = "letter", options = {}) {
    const format = PAPER_SIZES[paperSize] ?? PAPER_SIZES.letter;
    const doc = new jsPDF({ orientation: "landscape", unit: "in", format, compress: true });
    await renderCardsToDoc(doc, cardRefs, paperSize, options, true);
    return doc;
  }

  async function exportPng(cardRefs, baseTitle, options = {}) {
    const title = baseTitle || "bingo-card";

    if (cardRefs.length === 1) {
      const dataUrl = await toPng(cardRefs[0], SNAPSHOT_OPTS);
      downloadUrl(dataUrl, options.fullPage ? `${title}-page-1.png` : `${title}-1.png`);
      return;
    }

    const zip = new JSZip();
    for (let i = 0; i < cardRefs.length; i++) {
      const dataUrl = await toPng(cardRefs[i], SNAPSHOT_OPTS);
      const base64 = dataUrl.split(",")[1];
      const name = options.fullPage ? `${title}-page-${i + 1}.png` : `${title}-${i + 1}.png`;
      zip.file(name, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadUrl(URL.createObjectURL(blob), `${title}-cards.zip`);
  }

  async function exportPdf(cardRefs, baseTitle, paperSize = "letter", options = {}) {
    const title = baseTitle || "bingo-cards";
    const doc = await buildPdfDoc(cardRefs, paperSize, options);
    const pageCount = getPdfPageCount(cardRefs, options);
    doc.save(`${title}-${pageCount}-pages.pdf`);
  }

  async function openPdfForPrint(cardRefs, paperSize = "letter", options = {}) {
    const doc = await buildPdfDoc(cardRefs, paperSize, options);
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }

  /** Builds a PDF in memory; `filename` is safe for `download` on an anchor. */
  async function createPdfBlob(cardRefs, baseTitle, paperSize = "letter", options = {}) {
    const raw = String(baseTitle || "bingo-cards").trim() || "bingo-cards";
    const safe = raw
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    const pageCount = getPdfPageCount(cardRefs, options);
    const filename = `${safe || "bingo-cards"}-${pageCount}-pages.pdf`;
    const doc = await buildPdfDoc(cardRefs, paperSize, options);
    const blob = doc.output("blob");
    return { blob, filename };
  }

  /**
   * Combines all entries into a single PDF, one section per playlist.
   * entries: Array<{ cardRefs: Element[], title: string }>
   */
  async function createZippedPdfBlobs(entries, paperSize = "letter", options = {}) {
    const totalCards = entries.reduce((sum, e) => sum + e.cardRefs.length, 0);

    if (entries.length === 1) {
      return createPdfBlob(entries[0].cardRefs, entries[0].title, paperSize, {
        ...options,
        onProgress: (cur) => options.onProgress?.(cur, totalCards),
      });
    }

    const format = PAPER_SIZES[paperSize] ?? PAPER_SIZES.letter;
    const doc = new jsPDF({ orientation: "landscape", unit: "in", format, compress: true });
    let completedCards = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      await renderCardsToDoc(
        doc,
        entry.cardRefs,
        paperSize,
        {
          ...options,
          pageHeader: entry.title ? { title: entry.title } : options.pageHeader,
          onProgress: (cur) => options.onProgress?.(completedCards + cur, totalCards),
        },
        i === 0,
      );
      completedCards += entry.cardRefs.length;
    }

    const totalPages = entries.reduce((sum, e) => sum + getPdfPageCount(e.cardRefs, options), 0);
    const blob = doc.output("blob");
    return { blob, filename: `batch-print-${entries.length}-playlists-${totalPages}-pages.pdf` };
  }

  return { exportPng, exportPdf, openPdfForPrint, createPdfBlob, createZippedPdfBlobs };
}
