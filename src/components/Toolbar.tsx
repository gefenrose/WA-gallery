import type { DisplayOptions, FilterMode } from "../types";
import { t } from "../lib/i18n";

type ToolbarProps = {
  filterMode: FilterMode;
  selectedSenders: string[];
  senders: string[];
  displayOptions: DisplayOptions;
  onFilterModeChange: (mode: FilterMode) => void;
  onSelectedSendersChange: (senders: string[]) => void;
  onDisplayOptionsChange: (options: DisplayOptions) => void;
  onExport: () => void;
  canExport: boolean;
  isExporting: boolean;
};

export default function Toolbar({
  filterMode,
  selectedSenders,
  senders,
  displayOptions,
  onFilterModeChange,
  onSelectedSendersChange,
  onDisplayOptionsChange,
  onExport,
  canExport,
  isExporting
}: ToolbarProps) {
  function toggleSender(sender: string) {
    if (selectedSenders.includes(sender)) {
      onSelectedSendersChange(selectedSenders.filter((current) => current !== sender));
      return;
    }
    onSelectedSendersChange([...selectedSenders, sender]);
  }

  function toggleDisplayOption(key: keyof DisplayOptions) {
    onDisplayOptionsChange({ ...displayOptions, [key]: !displayOptions[key] });
  }

  return (
    <section className="toolbar">
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
      <fieldset className="checkbox-panel sender-filter">
        <legend>{t("senderFilter")}</legend>
        {senders.length === 0 ? (
          <span className="muted-control-text">{t("allSenders")}</span>
        ) : (
          <div className="checkbox-list">
            {senders.map((sender) => (
              <label key={sender} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selectedSenders.includes(sender)}
                  onChange={() => toggleSender(sender)}
                />
                <span>{sender}</span>
              </label>
            ))}
          </div>
        )}
        {selectedSenders.length > 0 ? (
          <button className="clear-filter-button" type="button" onClick={() => onSelectedSendersChange([])}>
            {t("allSenders")}
          </button>
        ) : null}
      </fieldset>
      <fieldset className="checkbox-panel display-options">
        <legend>{t("displayFields")}</legend>
        <div className="checkbox-list compact">
          <label className="checkbox-row">
            <input type="checkbox" checked={displayOptions.date} onChange={() => toggleDisplayOption("date")} />
            <span>{t("displayDate")}</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={displayOptions.time} onChange={() => toggleDisplayOption("time")} />
            <span>{t("displayTime")}</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={displayOptions.sender} onChange={() => toggleDisplayOption("sender")} />
            <span>{t("displaySender")}</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={displayOptions.text} onChange={() => toggleDisplayOption("text")} />
            <span>{t("displayText")}</span>
          </label>
        </div>
      </fieldset>
      <button className="export-button" onClick={onExport} disabled={!canExport || isExporting}>
        {isExporting ? t("exportingAlbum") : t("exportAlbum")}
      </button>
    </section>
  );
}
