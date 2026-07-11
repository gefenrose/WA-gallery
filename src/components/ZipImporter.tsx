import { useRef, useState } from "react";
import { t } from "../lib/i18n";

type ZipImporterProps = {
  status: string;
  isLoading: boolean;
  error?: string;
  compact?: boolean;
  onFile: (file: File) => void;
};

export default function ZipImporter({ status, isLoading, error, compact = false, onFile }: ZipImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <section
      className={`importer ${dragging ? "dragging" : ""} ${compact ? "importer-compact" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      {!compact ? (
        <header className="welcome-copy">
          <h1>{t("appName")}</h1>
          <p>{t("appSubtitle")}</p>
          <div className="privacy-banner">{t("privacy")}</div>
        </header>
      ) : null}

      <div className="upload-zone">
        <div className="zip-art" aria-hidden="true">ZIP</div>
        <div className="import-copy">
          <h2>{compact ? t("albumReady") : t("dropZipTitle")}</h2>
          <p>{compact ? status : t("importHelp")}</p>
          <button className="choose-button" onClick={() => inputRef.current?.click()} disabled={isLoading}>
            {compact ? t("chooseAnotherZip") : t("chooseZip")}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
      </div>

      {error || isLoading ? (
        <div className={`status-line ${error ? "status-error" : ""}`}>
          <strong>{error || status}</strong>
        </div>
      ) : null}

      {!compact ? (
        <div className="instructions-card">
          <h2>{t("exportHelpTitle")}</h2>
          <p className="media-export-notice">{t("mediaExportNotice")}</p>
          <ol>
            {t("exportHelpBullets")
              .split("|")
              .map((line) => <li key={line}>{line}</li>)}
          </ol>
          <div className="instructions-note">
            <strong>{t("folderStructureTitle")}</strong>
            <p>{t("folderStructureText")}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
