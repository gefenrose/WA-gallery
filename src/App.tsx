import { useMemo, useState } from "react";
import AlbumPreview from "./components/AlbumPreview";
import MediaLightbox from "./components/MediaLightbox";
import Toolbar from "./components/Toolbar";
import ZipImporter from "./components/ZipImporter";
import { exportPersonalAlbumZip, inferAlbumTitle } from "./lib/albumExport";
import { buildAlbumItems } from "./lib/buildAlbumItems";
import { t } from "./lib/i18n";
import { parseWhatsAppChat } from "./lib/parseWhatsAppChat";
import { loadWhatsAppZip, revokeMediaUrls } from "./lib/zipUtils";
import type { AlbumItem, FilterMode, MediaFile } from "./types";

export default function App() {
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [senderFilter, setSenderFilter] = useState("");
  const [status, setStatus] = useState(t("ready"));
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [albumTitle, setAlbumTitle] = useState(t("appName"));
  const [activeItemId, setActiveItemId] = useState<string | undefined>();

  const senders = useMemo(
    () => [...new Set(items.map((item) => item.sender).filter((sender): sender is string => Boolean(sender)))].sort(),
    [items]
  );
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (senderFilter && item.sender !== senderFilter) return false;
      if (filterMode === "withCaptions") return item.caption.trim().length > 0;
      if (filterMode === "missingCaptions") return item.caption.trim().length === 0;
      return true;
    });
  }, [filterMode, items, senderFilter]);

  async function handleFile(file: File) {
    setIsLoading(true);
    setError(undefined);
    setStatus(t("loading"));
    revokeMediaUrls(mediaFiles);

    try {
      const result = await loadWhatsAppZip(file);
      if (result.mediaFiles.filter((media) => media.type === "image" || media.type === "video").length === 0) {
        throw new Error("NO_MEDIA");
      }

      const messages = parseWhatsAppChat(result.chatText);
      if (messages.length === 0) {
        throw new Error("NO_MESSAGES");
      }

      setMediaFiles(result.mediaFiles);
      setItems(buildAlbumItems(messages, result.mediaFiles));
      setAlbumTitle(inferAlbumTitle(file.name));
      setFilterMode("all");
      setSenderFilter("");
      setStatus(`${t("parsed")} (${result.chatFilename})`);
    } catch (loadError) {
      setMediaFiles([]);
      setItems([]);
      setActiveItemId(undefined);
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  function handleCaptionChange(id: string, caption: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, caption } : item)));
  }

  async function handleExportAlbum() {
    if (items.length === 0) return;
    setIsExporting(true);
    setStatus(t("exportingAlbum"));
    try {
      await exportPersonalAlbumZip(albumTitle, items);
      setStatus(t("exportedAlbum"));
    } finally {
      setIsExporting(false);
    }
  }

  const activeIndex = activeItemId ? items.findIndex((item) => item.id === activeItemId) : -1;

  return (
    <main className="app-shell" dir="rtl" lang="he">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          P
        </div>
        <div className="brand-text">{t("appName")}</div>
      </header>

      <ZipImporter status={status} isLoading={isLoading} error={error} onFile={handleFile} />

      <Toolbar
        filterMode={filterMode}
        senderFilter={senderFilter}
        senders={senders}
        onFilterModeChange={setFilterMode}
        onSenderFilterChange={setSenderFilter}
        onExport={handleExportAlbum}
        canExport={items.length > 0}
        isExporting={isExporting}
      />

      <AlbumPreview
        items={filteredItems}
        totalCount={items.length}
        onCaptionChange={handleCaptionChange}
        onOpenItem={setActiveItemId}
      />

      {activeIndex >= 0 ? (
        <MediaLightbox
          items={items}
          activeIndex={activeIndex}
          onClose={() => setActiveItemId(undefined)}
          onMove={(nextIndex) => setActiveItemId(items[nextIndex]?.id)}
        />
      ) : null}
    </main>
  );
}

function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "NO_CHAT") return t("noChat");
  if (code === "NO_MEDIA") return t("noMedia");
  if (code === "NO_MESSAGES") return t("noMessages");
  return t("badZip");
}
