import { useState } from "react";
import type { AlbumItem, DisplayOptions } from "../types";
import AlbumCard from "./AlbumCard";
import { t } from "../lib/i18n";

type AlbumPreviewProps = {
  items: AlbumItem[];
  totalCount: number;
  displayOptions: DisplayOptions;
  onCaptionChange: (id: string, caption: string) => void;
  onOpenItem: (id: string) => void;
  onReorder: (sourceId: string, targetId: string) => void;
};

export default function AlbumPreview({
  items,
  totalCount,
  displayOptions,
  onCaptionChange,
  onOpenItem,
  onReorder
}: AlbumPreviewProps) {
  const [draggedId, setDraggedId] = useState<string>();
  const [dragOverId, setDragOverId] = useState<string>();

  function moveByKeyboard(id: string, direction: -1 | 1) {
    const currentIndex = items.findIndex((item) => item.id === id);
    const target = items[currentIndex + direction];
    if (target) onReorder(id, target.id);
  }

  return (
    <section className="album-preview" aria-live="polite">
      <div className="album-heading">
        <div>
          <h2>{t("albumPreview")}</h2>
          <p className="album-count">
            {totalCount} {t("itemsFound")}
          </p>
        </div>
        {items.length > 1 ? <p className="reorder-hint">{t("reorderHint")}</p> : null}
      </div>
      {items.length === 0 ? (
        <div className="empty-state">{t("noItems")}</div>
      ) : (
        <div className="album-grid">
          {items.map((item) => (
            <AlbumCard
              key={item.id}
              item={item}
              displayOptions={displayOptions}
              onCaptionChange={onCaptionChange}
              onOpen={() => onOpenItem(item.id)}
              isDragging={draggedId === item.id}
              isDragTarget={dragOverId === item.id && draggedId !== item.id}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
                setDraggedId(item.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverId(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("text/plain") || draggedId;
                if (sourceId) onReorder(sourceId, item.id);
                setDraggedId(undefined);
                setDragOverId(undefined);
              }}
              onDragEnd={() => {
                setDraggedId(undefined);
                setDragOverId(undefined);
              }}
              onMoveEarlier={() => moveByKeyboard(item.id, -1)}
              onMoveLater={() => moveByKeyboard(item.id, 1)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
