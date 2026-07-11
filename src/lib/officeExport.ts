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
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        children: [wordText(item.media.type === "video" ? "סרטון" : "תמונה")]
      })
    );

    if (item.media.type === "image" && imageType) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: imageType,
              data: await item.media.blob.arrayBuffer(),
              transformation: { width: 430, height: 320 },
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
          run: { font: WORD_FONT, size: WORD_FONT_SIZE },
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
  titleSlide.background = { color: "F8FBF9" };
  titleSlide.addText(albumTitle, {
    x: 0.7,
    y: 1.7,
    w: 12,
    h: 0.7,
    align: "right",
    fontFace: WORD_FONT,
    fontSize: 12,
    color: "17201A",
    rtlMode: true
  });
  titleSlide.addText(`${items.length} פריטי מדיה`, {
    x: 0.7,
    y: 2.55,
    w: 12,
    h: 0.4,
    align: "right",
    fontFace: WORD_FONT,
    fontSize: 12,
    color: "657168",
    rtlMode: true
  });

  for (const item of items) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    const metadata = buildMetadataLines(item, { ...displayOptions, text: false }).join("\n");

    if (item.media.type === "image" && isPptImage(item.media.filename, item.media.blob.type)) {
      slide.addImage({
        data: await blobToDataUrl(item.media.blob),
        x: 0.65,
        y: 0.45,
        w: 7.55,
        h: 6.2,
        sizing: { type: "contain", x: 0.65, y: 0.45, w: 7.55, h: 6.2 }
      });
    } else if (item.media.type === "video" && isPptVideo(item.media.filename, item.media.blob.type)) {
      slide.addMedia({
        type: "video",
        data: await blobToDataUrl(item.media.blob),
        extn: getExtension(item.media.filename),
        x: 0.65,
        y: 0.45,
        w: 7.55,
        h: 6.2
      });
    } else {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.65,
        y: 0.45,
        w: 7.55,
        h: 6.2,
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

    slide.addText(metadata || " ", {
      x: 8.55,
      y: 0.7,
      w: 4.1,
      h: 1.6,
      align: "right",
      valign: "top",
      fontFace: WORD_FONT,
      fontSize: 12,
      color: "314238",
      breakLine: false,
      fit: "shrink",
      rtlMode: true
    });

    if (displayOptions.text) {
      slide.addText(item.caption || "אין כיתוב", {
        x: 8.55,
        y: 2.55,
        w: 4.1,
        h: 3.45,
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
  const lines: string[] = [];
  if (displayOptions.date) lines.push(`תאריך: ${item.dateRaw || "-"}`);
  if (displayOptions.time) lines.push(`שעה: ${item.timeRaw || "-"}`);
  if (displayOptions.sender) lines.push(`שולח/ת: ${item.sender || "-"}`);
  if (displayOptions.text) lines.push(`כיתוב: ${item.caption || "אין כיתוב"}`);
  return lines;
}

function wordText(text: string) {
  return new TextRun({
    text,
    font: WORD_FONT,
    size: WORD_FONT_SIZE,
    rightToLeft: true
  });
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
