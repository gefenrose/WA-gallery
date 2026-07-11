import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun
} from "docx";
import pptxgen from "pptxgenjs";
import type { AlbumItem, DisplayOptions } from "../types";

type DocxImageType = "jpg" | "png" | "gif" | "bmp";
const WORD_FONT = "Arial";
const WORD_FONT_SIZE = 24; // docx uses half-points: 24 = 12pt

export async function exportWordAlbum(albumTitle: string, items: AlbumItem[], displayOptions: DisplayOptions) {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [wordText(albumTitle)]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      children: [wordText(`${items.length} פריטי מדיה`)]
    })
  ];

  for (const item of items) {
    const imageType = getDocxImageType(item.media.filename, item.media.blob.type);

    if (item.media.type === "image" && imageType) {
      const imageSize = await getImageSize(item.media.blob);
      const fittedSize = fitWithin(imageSize.width, imageSize.height, 430, 320);
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [
            new ImageRun({
              type: imageType,
              data: await item.media.blob.arrayBuffer(),
              transformation: fittedSize,
              altText: {
                title: item.caption || item.media.filename,
                description: item.media.filename,
                name: item.media.filename
              }
            })
          ]
        })
      );
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [wordText(`${item.media.type === "video" ? "קובץ וידאו" : "קובץ מדיה"}: ${item.media.filename}`)]
        })
      );
    }

    for (const line of buildMetadataLines(item, displayOptions)) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          children: [wordText(line)]
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: WORD_FONT,
            size: WORD_FONT_SIZE,
            rightToLeft: true,
            language: { value: "he-IL", bidirectional: "he-IL" }
          },
          paragraph: { alignment: AlignmentType.RIGHT }
        }
      }
    },
    sections: [{ properties: {}, children }]
  });
  downloadBlob(await Packer.toBlob(doc), `${safeDownloadName(albumTitle)}.docx`);
}

export async function exportPowerPointAlbum(albumTitle: string, items: AlbumItem[], displayOptions: DisplayOptions) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "WhatsApp Album Maker";
  pptx.subject = albumTitle;
  pptx.title = albumTitle;
  pptx.company = "";
  pptx.theme = {
    headFontFace: WORD_FONT,
    bodyFontFace: WORD_FONT
  };

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "FBFAF7" };
  titleSlide.addShape(pptx.ShapeType.line, {
    x: 4.65,
    y: 2.55,
    w: 4,
    h: 0,
    line: { color: "20854F", width: 2 }
  });
  titleSlide.addText(albumTitle, {
    x: 1.1,
    y: 2.05,
    w: 11.15,
    h: 0.35,
    align: "center",
    fontFace: WORD_FONT,
    fontSize: 12,
    bold: true,
    color: "17201A",
    rtlMode: true
  });
  titleSlide.addText(`${items.length} פריטי מדיה`, {
    x: 1.1,
    y: 2.78,
    w: 11.15,
    h: 0.3,
    align: "center",
    fontFace: WORD_FONT,
    fontSize: 12,
    color: "657168",
    rtlMode: true
  });

  for (const item of items) {
    const slide = pptx.addSlide();
    slide.background = { color: "FBFAF7" };
    const metadataEntries = buildMetadataEntries(item, { ...displayOptions, text: false });

    slide.addShape(pptx.ShapeType.line, {
      x: 8.42,
      y: 0.55,
      w: 0,
      h: 6.4,
      line: { color: "DED9D0", width: 1 }
    });

    if (item.media.type === "image" && isPptImage(item.media.filename, item.media.blob.type)) {
      const imageSize = await getImageSize(item.media.blob);
      const fittedSize = fitWithin(imageSize.width, imageSize.height, 7.3, 6.05);
      const imageX = 0.65 + (7.3 - fittedSize.width) / 2;
      const imageY = 0.7 + (6.05 - fittedSize.height) / 2;
      slide.addImage({
        data: await blobToDataUrl(item.media.blob),
        x: imageX,
        y: imageY,
        w: fittedSize.width,
        h: fittedSize.height
      });
    } else if (item.media.type === "video" && isPptVideo(item.media.filename, item.media.blob.type)) {
      slide.addMedia({
        type: "video",
        data: await blobToDataUrl(item.media.blob),
        extn: getExtension(item.media.filename),
        x: 0.65,
        y: 0.7,
        w: 7.3,
        h: 6.05
      });
    } else {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.65,
        y: 0.7,
        w: 7.3,
        h: 6.05,
        fill: { color: "F5FAF7" },
        line: { color: "D9E4DC" }
      });
      slide.addText(item.media.type === "video" ? "סרטון" : "קובץ מדיה", {
        x: 0.95,
        y: 2.65,
        w: 6.95,
        h: 0.5,
        align: "center",
        fontFace: WORD_FONT,
        fontSize: 12,
        color: "176A3E",
        rtlMode: true
      });
      slide.addText(item.media.filename, {
        x: 0.95,
        y: 3.25,
        w: 6.95,
        h: 0.5,
        align: "center",
        fontFace: WORD_FONT,
        fontSize: 12,
        color: "657168",
        fit: "shrink",
        rtlMode: true
      });
    }

    let textY = 0.8;
    for (const entry of metadataEntries) {
      slide.addText(
        [
          { text: `${entry.label}: `, options: { bold: true, color: "176A3E" } },
          { text: entry.value, options: { color: "314238" } }
        ],
        {
          x: 8.75,
          y: textY,
          w: 3.9,
          h: 0.38,
          margin: 0,
          align: "right",
          valign: "middle",
          fontFace: WORD_FONT,
          fontSize: 12,
          rtlMode: true,
          fit: "shrink"
        }
      );
      textY += 0.52;
    }

    if (displayOptions.text && item.caption.trim()) {
      if (metadataEntries.length > 0) {
        slide.addShape(pptx.ShapeType.line, {
          x: 8.75,
          y: textY + 0.06,
          w: 3.9,
          h: 0,
          line: { color: "DED9D0", width: 1 }
        });
        textY += 0.35;
      }
      slide.addText("כיתוב", {
        x: 8.75,
        y: textY,
        w: 3.9,
        h: 0.3,
        margin: 0,
        align: "right",
        fontFace: WORD_FONT,
        fontSize: 12,
        bold: true,
        color: "176A3E",
        rtlMode: true
      });
      slide.addText(item.caption, {
        x: 8.75,
        y: textY + 0.42,
        w: 3.9,
        h: Math.max(1, 6.05 - textY),
        margin: 0,
        align: "right",
        valign: "top",
        fontFace: WORD_FONT,
        fontSize: 12,
        color: "17201A",
        fit: "shrink",
        rtlMode: true
      });
    }
  }

  const blob = await pptx.write({ outputType: "blob" });
  downloadBlob(blob as Blob, `${safeDownloadName(albumTitle)}.pptx`);
}

function buildMetadataLines(item: AlbumItem, displayOptions: DisplayOptions) {
  return buildMetadataEntries(item, displayOptions).map((entry) => `${entry.label}: ${entry.value}`);
}

function buildMetadataEntries(item: AlbumItem, displayOptions: DisplayOptions) {
  const entries: Array<{ label: string; value: string }> = [];
  if (displayOptions.date) entries.push({ label: "תאריך", value: item.dateRaw || "-" });
  if (displayOptions.time) entries.push({ label: "שעה", value: item.timeRaw || "-" });
  if (displayOptions.sender) entries.push({ label: "שולח/ת", value: item.sender || "-" });
  if (displayOptions.text && item.caption.trim()) entries.push({ label: "כיתוב", value: item.caption });
  return entries;
}

function wordText(text: string) {
  return new TextRun({
    text: `\u200F${text}`,
    font: WORD_FONT,
    size: WORD_FONT_SIZE,
    rightToLeft: true,
    language: { value: "he-IL", bidirectional: "he-IL" }
  });
}

async function getImageSize(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  if (width <= 0 || height <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: width * scale, height: height * scale };
}

function getDocxImageType(filename: string, mimeType: string): DocxImageType | undefined {
  const ext = getExtension(filename);
  if (ext === "jpg" || ext === "jpeg" || mimeType === "image/jpeg") return "jpg";
  if (ext === "png" || mimeType === "image/png") return "png";
  if (ext === "gif" || mimeType === "image/gif") return "gif";
  if (ext === "bmp" || mimeType === "image/bmp") return "bmp";
  return undefined;
}

function isPptImage(filename: string, mimeType: string) {
  return Boolean(getDocxImageType(filename, mimeType));
}

function isPptVideo(filename: string, mimeType: string) {
  const ext = getExtension(filename);
  return ext === "mp4" || ext === "mov" || mimeType === "video/mp4" || mimeType === "video/quicktime";
}

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeDownloadName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim() || "אלבום WhatsApp";
}
