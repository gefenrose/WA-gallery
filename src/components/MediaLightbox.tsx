import { useEffect } from "react";
import type { AlbumItem } from "../types";
import { t } from "../lib/i18n";

type MediaLightboxProps = {
  items: AlbumItem[];
  activeIndex: number;
  onClose: () => void;
  onMove: (index: number) => void;
};

export default function MediaLightbox({ items, activeIndex, onClose, onMove }: MediaLightboxProps) {
  const item = items[activeIndex];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onMove((activeIndex + 1) % items.length);
      if (event.key === "ArrowRight") onMove((activeIndex - 1 + items.length) % items.length);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, items.length, onClose, onMove]);

  if (!item) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={t("viewerTitle")}>
      <button className="lightbox-close" type="button" onClick={onClose} aria-label={t("closeViewer")}>
        ×
      </button>
      <button
        className="lightbox-nav lightbox-next"
        type="button"
        onClick={() => onMove((activeIndex + 1) % items.length)}
        aria-label={t("nextMedia")}
      >
        ›
      </button>
      <figure className="lightbox-figure">
        <div className="lightbox-media-wrap">
          {item.media.type === "video" ? (
            <video className="lightbox-media" src={item.media.url} controls autoPlay preload="metadata" />
          ) : (
            <img className="lightbox-media" src={item.media.url} alt={item.caption || item.media.filename} />
          )}
        </div>
        <figcaption className="lightbox-caption">
          <div className="lightbox-meta">
            <span>{item.dateRaw || "-"}</span>
            <span>{item.timeRaw || "-"}</span>
            <span>{item.sender || "-"}</span>
            <span>
              {activeIndex + 1} / {items.length}
            </span>
          </div>
          <p>{item.caption || t("noCaption")}</p>
        </figcaption>
      </figure>
      <button
        className="lightbox-nav lightbox-prev"
        type="button"
        onClick={() => onMove((activeIndex - 1 + items.length) % items.length)}
        aria-label={t("previousMedia")}
      >
        ‹
      </button>
    </div>
  );
}
