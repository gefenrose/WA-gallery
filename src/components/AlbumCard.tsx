import type { DragEvent } from "react";
import type { AlbumItem, DisplayOptions } from "../types";
import CaptionEditor from "./CaptionEditor";
import { t } from "../lib/i18n";

type AlbumCardProps = {
  item: AlbumItem;
  displayOptions: DisplayOptions;
  onCaptionChange: (id: string, caption: string) => void;
  onOpen: () => void;
  isDragging: boolean;
  isDragTarget: boolean;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onMoveEarlier: () => void;
  onMoveLater: () => void;
};

export default function AlbumCard({
  item,
  displayOptions,
  onCaptionChange,
  onOpen,
  isDragging,
  isDragTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveEarlier,
  onMoveLater
}: AlbumCardProps) {
  const missingCaption = item.caption.trim().length === 0;
  const showMeta = displayOptions.date || displayOptions.time;

  return (
    <article
      className={`album-card ${missingCaption ? "album-card-missing" : ""} ${isDragging ? "is-dragging" : ""} ${isDragTarget ? "is-drag-target" : ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="card-order-controls">
        <button
          className="drag-handle"
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onMoveEarlier();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              onMoveLater();
            }
          }}
          aria-label={t("dragItem")}
          title={t("dragItem")}
        >
          <span aria-hidden="true">⠿</span>
          {t("drag")}
        </button>
      </div>
      <button className="media-frame media-open-button" type="button" onClick={onOpen} aria-label={t("viewerTitle")}>
        {item.media.type === "video" ? (
          <video className="album-media" src={item.media.url} preload="metadata" muted />
        ) : (
          <img className="album-media" src={item.media.url} alt={item.caption || item.media.filename} loading="lazy" />
        )}
        <span className="media-kind">{item.media.type === "video" ? t("mediaKindVideo") : t("mediaKindImage")}</span>
      </button>
      {showMeta ? (
        <div className="album-meta">
          {displayOptions.date ? <span>{item.dateRaw || "-"}</span> : null}
          {displayOptions.time ? <span>{item.timeRaw || "-"}</span> : null}
        </div>
      ) : null}
      {displayOptions.sender ? <div className="sender-line">{item.sender || "-"}</div> : null}
      {displayOptions.text ? (
        <>
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
        </>
      ) : null}
    </article>
  );
}
