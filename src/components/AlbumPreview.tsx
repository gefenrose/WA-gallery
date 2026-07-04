import type { AlbumItem } from "../types";
import AlbumCard from "./AlbumCard";
import { t } from "../lib/i18n";

type AlbumPreviewProps = {
  items: AlbumItem[];
  totalCount: number;
  onCaptionChange: (id: string, caption: string) => void;
  onOpenItem: (id: string) => void;
};

export default function AlbumPreview({ items, totalCount, onCaptionChange, onOpenItem }: AlbumPreviewProps) {
  return (
    <section className="album-preview" aria-live="polite">
      <div className="album-count">
        {totalCount} {t("itemsFound")}
      </div>
      {items.length === 0 ? (
        <div className="empty-state">{t("noItems")}</div>
      ) : (
        <div className="album-grid">
          {items.map((item) => (
            <AlbumCard key={item.id} item={item} onCaptionChange={onCaptionChange} onOpen={() => onOpenItem(item.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
