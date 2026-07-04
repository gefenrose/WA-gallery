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
  const dashMatch = withoutExtension.match(/^WhatsApp Chat\s*-\s*(.+)$/i);
  const hebrewMatch = withoutExtension.match(/^צ[׳']?אט WhatsApp (?:עם|-)\s*(.+)$/i);
  const exportedMatch = withoutExtension.match(/(.+?)\s*-\s*WhatsApp/i);
  return (
    (whatsappMatch?.[1] ?? dashMatch?.[1] ?? hebrewMatch?.[1] ?? exportedMatch?.[1] ?? withoutExtension) ||
    "אלבום WhatsApp"
  ).trim();
}

function buildAlbumHtml(albumTitle: string, items: AlbumItem[], filenameById: Map<string, string>) {
  const cards = items
    .map((item, index) => {
      const src = filenameById.get(item.id) ?? "";
      const media =
        item.media.type === "video"
          ? `<video class="media" src="${escapeAttribute(src)}" preload="metadata" muted></video>`
          : `<img class="media" src="${escapeAttribute(src)}" alt="${escapeAttribute(item.caption || item.media.filename)}" loading="lazy" />`;
      return `<article class="card">
        <button class="media-button" type="button" data-index="${index}" aria-label="פתיחת מדיה">
          ${media}
        </button>
        <div class="meta"><span>${escapeHtml(item.dateRaw || "-")}</span><span>${escapeHtml(item.timeRaw || "-")}</span></div>
        <div class="sender">${escapeHtml(item.sender || "-")}</div>
        <p class="caption">${escapeHtml(item.caption || "")}</p>
      </article>`;
    })
    .join("\n");
  const serializedItems = JSON.stringify(
    items.map((item) => ({
      src: filenameById.get(item.id) ?? "",
      type: item.media.type,
      filename: item.media.filename,
      caption: item.caption,
      dateRaw: item.dateRaw,
      timeRaw: item.timeRaw,
      sender: item.sender
    }))
  ).replace(/</g, "\\u003c");

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
    .card { display: grid; gap: 10px; padding: 10px; border: 1px solid #d9e4dc; border-radius: 8px; background: #fff; box-shadow: 0 10px 26px rgba(34, 64, 43, 0.08); }
    .media-button { display: block; width: 100%; padding: 0; border: 0; background: transparent; cursor: pointer; text-align: inherit; }
    .media-button:focus-visible { outline: 3px solid rgba(32, 133, 79, 0.32); outline-offset: 3px; border-radius: 8px; }
    .media { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 7px; background: #e9f0ec; }
    .meta { display: flex; justify-content: space-between; gap: 10px; color: #657168; }
    .sender { padding-top: 8px; border-top: 1px solid #d9e4dc; font-weight: 800; }
    .caption { margin: 0; line-height: 1.55; white-space: pre-wrap; }
    .viewer { position: fixed; z-index: 10; inset: 0; display: none; grid-template-columns: minmax(52px, 84px) minmax(0, 1fr) minmax(52px, 84px); align-items: center; gap: 12px; padding: 24px; background: rgba(12, 22, 16, 0.92); color: #fff; }
    .viewer.open { display: grid; }
    .viewer-figure { min-width: 0; max-width: 1080px; max-height: calc(100vh - 48px); margin: 0 auto; display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 14px; }
    .viewer-media-wrap { min-height: 0; display: grid; place-items: center; }
    .viewer-media { display: block; max-width: 100%; max-height: calc(100vh - 210px); border-radius: 8px; object-fit: contain; background: #050806; }
    .viewer-caption { border: 1px solid rgba(255,255,255,.16); border-radius: 8px; background: rgba(255,255,255,.08); padding: 14px 16px; }
    .viewer-caption p { margin: 8px 0 0; color: #f7fbf8; font-size: 1.05rem; line-height: 1.55; white-space: pre-wrap; }
    .viewer-meta { display: flex; flex-wrap: wrap; gap: 10px 18px; color: #cce4d4; font-weight: 700; }
    .viewer-close, .viewer-nav { border: 1px solid rgba(255,255,255,.22); border-radius: 8px; background: rgba(255,255,255,.1); color: #fff; font-weight: 800; cursor: pointer; }
    .viewer-close { position: absolute; top: 18px; inset-inline-end: 18px; width: 46px; height: 46px; font-size: 1.8rem; line-height: 1; }
    .viewer-nav { width: 100%; min-height: 88px; font-size: 3rem; }
    .viewer-close:hover, .viewer-nav:hover { background: rgba(255,255,255,.2); }
    @media (max-width: 760px) {
      main { padding: 14px; }
      .viewer { grid-template-columns: 1fr 1fr; grid-template-rows: minmax(0, 1fr) auto; padding: 14px; }
      .viewer-figure { grid-column: 1 / -1; width: 100%; max-height: calc(100vh - 28px); }
      .viewer-media { max-height: calc(100vh - 260px); }
      .viewer-nav { min-height: 52px; font-size: 2rem; }
      .viewer-next { grid-column: 1; }
      .viewer-prev { grid-column: 2; }
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
  <div class="viewer" role="dialog" aria-modal="true" aria-label="תצוגת מדיה">
    <button class="viewer-close" type="button" aria-label="סגירת תצוגה">×</button>
    <button class="viewer-nav viewer-next" type="button" aria-label="המדיה הבאה">›</button>
    <figure class="viewer-figure">
      <div class="viewer-media-wrap"></div>
      <figcaption class="viewer-caption">
        <div class="viewer-meta"></div>
        <p></p>
      </figcaption>
    </figure>
    <button class="viewer-nav viewer-prev" type="button" aria-label="המדיה הקודמת">‹</button>
  </div>
  <script>
    const albumItems = ${serializedItems};
    let activeIndex = 0;
    const viewer = document.querySelector(".viewer");
    const mediaWrap = document.querySelector(".viewer-media-wrap");
    const meta = document.querySelector(".viewer-meta");
    const caption = document.querySelector(".viewer-caption p");
    function renderViewer(index) {
      activeIndex = (index + albumItems.length) % albumItems.length;
      const item = albumItems[activeIndex];
      mediaWrap.innerHTML = "";
      const media = document.createElement(item.type === "video" ? "video" : "img");
      media.className = "viewer-media";
      media.src = item.src;
      if (item.type === "video") {
        media.controls = true;
        media.autoplay = true;
        media.preload = "metadata";
      } else {
        media.alt = item.caption || item.filename;
      }
      mediaWrap.append(media);
      meta.textContent = "";
      [item.dateRaw || "-", item.timeRaw || "-", item.sender || "-", String(activeIndex + 1) + " / " + albumItems.length].forEach((value) => {
        const span = document.createElement("span");
        span.textContent = value;
        meta.append(span);
      });
      caption.textContent = item.caption || "אין כיתוב";
      viewer.classList.add("open");
    }
    document.querySelectorAll(".media-button").forEach((button) => {
      button.addEventListener("click", () => renderViewer(Number(button.dataset.index || 0)));
    });
    document.querySelector(".viewer-close").addEventListener("click", () => viewer.classList.remove("open"));
    document.querySelector(".viewer-next").addEventListener("click", () => renderViewer(activeIndex + 1));
    document.querySelector(".viewer-prev").addEventListener("click", () => renderViewer(activeIndex - 1));
    document.addEventListener("keydown", (event) => {
      if (!viewer.classList.contains("open")) return;
      if (event.key === "Escape") viewer.classList.remove("open");
      if (event.key === "ArrowLeft") renderViewer(activeIndex + 1);
      if (event.key === "ArrowRight") renderViewer(activeIndex - 1);
    });
  </script>
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
