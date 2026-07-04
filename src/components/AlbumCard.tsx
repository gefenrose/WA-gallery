import type { AlbumItem } from "../types";
import CaptionEditor from "./CaptionEditor";
import { t } from "../lib/i18n";

type AlbumCardProps = {
  item: AlbumItem;
  onCaptionChange: (id: string, caption: string) => void;
  onOpen: () => void;
};

export default function AlbumCard({ item, onCaptionChange, onOpen }: AlbumCardProps) {
  const missingCaption = item.caption.trim().length === 0;

  return (
    <article className={`album-card ${missingCaption ? "album-card-missing" : ""}`}>
      <button className="media-frame media-open-button" type="button" onClick={onOpen} aria-label={t("viewerTitle")}>
        {item.media.type === "video" ? (
          <video className="album-media" src={item.media.url} preload="metadata" muted />
        ) : (
          <img className="album-media" src={item.media.url} alt={item.caption || item.media.filename} loading="lazy" />
        )}
        <span className="media-kind">{item.media.type === "video" ? t("mediaKindVideo") : t("mediaKindImage")}</span>
      </button>
      <div className="album-meta">
        <span>{item.dateRaw || "-"}</span>
        <span>{item.timeRaw || "-"}</span>
      </div>
      <div className="sender-line">{item.sender || "-"}</div>
      <label className="caption-label" htmlFor={`caption-${item.id}`}>
        {t("caption")}
      </label>
      <CaptionEditor
        id={`caption-${item.id}`}
        value={item.caption}
        placeholder={t("addCaption")}
        onChange={(caption) => onCaptionChange(item.id, caption)}
      />
      <div className={`confidence confidence-${item.confidence}`}>
        {t("confidence")}: {t(item.confidence)}
      </div>
    </article>
  );
}
