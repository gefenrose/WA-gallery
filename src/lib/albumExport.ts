import JSZip from "jszip";
import type { AlbumItem } from "../types";

export async function exportPersonalAlbumZip(albumTitle: string, items: AlbumItem[]) {
  const zip = new JSZip();
  const mediaFolder = zip.folder("media");
  const filenameById = new Map<string, string>();

  items.forEach((item, index) => {
    const mediaName = `${String(index + 1).padStart(3, "0")}-${safeAssetName(item.media.filename)}`;
    filenameById.set(item.id, `media/${mediaName}`);
    mediaFolder?.file(mediaName, item.media.blob);
  });

  zip.file("index.html", buildAlbumHtml(albumTitle, items, filenameById));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${safeDownloadName(albumTitle)}.zip`);
}

export function inferAlbumTitle(zipFilename: string) {
  const withoutExtension = zipFilename.replace(/\.zip$/i, "").trim();
  const whatsappMatch = withoutExtension.match(/WhatsApp Chat (?:with|עם) (.+)$/i);
  const exportedMatch = withoutExtension.match(/(.+?)\s*-\s*WhatsApp/i);
  return (whatsappMatch?.[1] ?? exportedMatch?.[1] ?? withoutExtension || "אלבום WhatsApp").trim();
}

function buildAlbumHtml(albumTitle: string, items: AlbumItem[], filenameById: Map<string, string>) {
  const cards = items
    .map((item, index) => {
      const src = filenameById.get(item.id) ?? "";
      const media =
        item.media.type === "video"
          ? `<video class="media" src="${escapeAttribute(src)}" controls preload="metadata"></video>`
          : `<img class="media" src="${escapeAttribute(src)}" alt="${escapeAttribute(item.caption || item.media.filename)}" loading="lazy" />`;
      return `<article class="card" data-index="${index}">
        ${media}
        <div class="meta"><span>${escapeHtml(item.dateRaw || "-")}</span><span>${escapeHtml(item.timeRaw || "-")}</span></div>
        <div class="sender">${escapeHtml(item.sender || "-")}</div>
        <p class="caption">${escapeHtml(item.caption || "")}</p>
      </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(albumTitle)}</title>
  <style>
    :root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #17201a; background: #fff; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fbf9; }
    main { max-width: 1200px; margin: 0 auto; padding: 24px; }
    header { margin-bottom: 24px; }
    h1 { margin: 0 0 8px; font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.08; }
    .subtitle { color: #657168; margin: 0; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
    .card { break-inside: avoid; page-break-inside: avoid; display: grid; gap: 10px; padding: 10px; border: 1px solid #d9e4dc; border-radius: 8px; background: #fff; box-shadow: 0 10px 26px rgba(34, 64, 43, 0.08); }
    .media { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 7px; background: #e9f0ec; }
    .meta { display: flex; justify-content: space-between; gap: 10px; color: #657168; }
    .sender { padding-top: 8px; border-top: 1px solid #d9e4dc; font-weight: 800; }
    .caption { margin: 0; line-height: 1.55; white-space: pre-wrap; }
    @media print {
      body { background: #fff; }
      main { padding: 0; }
      .grid { grid-template-columns: repeat(2, 1fr); gap: 12mm; }
      .card { box-shadow: none; border-color: #ccc; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(albumTitle)}</h1>
      <p class="subtitle">${items.length} פריטי מדיה</p>
    </header>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>`;
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

function safeAssetName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, "_").trim() || "media";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
