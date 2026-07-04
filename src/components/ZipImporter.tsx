import { useRef, useState } from "react";
import { t } from "../lib/i18n";

type ZipImporterProps = {
  status: string;
  isLoading: boolean;
  error?: string;
  onFile: (file: File) => void;
};

export default function ZipImporter({ status, isLoading, error, onFile }: ZipImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <section
      className={`importer print-hidden ${dragging ? "dragging" : ""}`}
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
      <div className="zip-art" aria-hidden="true">
        ZIP
      </div>
      <div className="import-copy">
        <h1>{t("importTitle")}</h1>
        <p>{t("importHelp")}</p>
        <button className="choose-button" onClick={() => inputRef.current?.click()} disabled={isLoading}>
          {t("chooseZip")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
        <p className="privacy-note">{t("privacy")}</p>
      </div>
      <aside className="privacy-card">
        <strong>{t("privacyTitle")}</strong>
        <ul>
          {t("privacyBullets")
            .split("|")
            .map((line) => (
              <li key={line}>{line}</li>
            ))}
        </ul>
      </aside>
      <div className={`status-line ${error ? "status-error" : ""}`}>
        <strong>{error ? error : status}</strong>
      </div>
    </section>
  );
}
