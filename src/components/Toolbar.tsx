import type { FilterMode } from "../types";
import { t } from "../lib/i18n";

type ToolbarProps = {
  filterMode: FilterMode;
  senderFilter: string;
  senders: string[];
  onFilterModeChange: (mode: FilterMode) => void;
  onSenderFilterChange: (sender: string) => void;
  onPrint: () => void;
  onExport: () => void;
  canExport: boolean;
  isExporting: boolean;
};

export default function Toolbar({
  filterMode,
  senderFilter,
  senders,
  onFilterModeChange,
  onSenderFilterChange,
  onPrint,
  onExport,
  canExport,
  isExporting
}: ToolbarProps) {
  return (
    <section className="toolbar print-hidden">
      <div className="segmented" role="group" aria-label="סינון מדיה">
        <button className={filterMode === "all" ? "active" : ""} onClick={() => onFilterModeChange("all")}>
          {t("allPhotos")}
        </button>
        <button
          className={filterMode === "withCaptions" ? "active" : ""}
          onClick={() => onFilterModeChange("withCaptions")}
        >
          {t("withCaptions")}
        </button>
        <button
          className={filterMode === "missingCaptions" ? "active" : ""}
          onClick={() => onFilterModeChange("missingCaptions")}
        >
          {t("missingCaptions")}
        </button>
      </div>
      <label className="sender-filter">
        <span>{t("sender")}</span>
        <select value={senderFilter} onChange={(event) => onSenderFilterChange(event.target.value)}>
          <option value="">{t("allSenders")}</option>
          {senders.map((sender) => (
            <option key={sender} value={sender}>
              {sender}
            </option>
          ))}
        </select>
      </label>
      <button className="export-button" onClick={onExport} disabled={!canExport || isExporting}>
        {isExporting ? t("exportingAlbum") : t("exportAlbum")}
      </button>
      <button className="print-button" onClick={onPrint}>
        {t("print")}
      </button>
    </section>
  );
}
