import JSZip from "jszip";
import type { MediaFile } from "../types";
import { normalizeFilename } from "./parseWhatsAppChat";

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const videoExtensions = new Set(["mp4", "mov"]);
const supportedMediaExtensions = new Set([...imageExtensions, ...videoExtensions, "heic"]);

export type ZipLoadResult = {
  chatText: string;
  mediaFiles: MediaFile[];
  chatFilename: string;
};

export function revokeMediaUrls(mediaFiles: MediaFile[]) {
  for (const file of mediaFiles) {
    URL.revokeObjectURL(file.url);
  }
}

export async function loadWhatsAppZip(file: File): Promise<ZipLoadResult> {
  const zip = await JSZip.loadAsync(file);
  const files = Object.values(zip.files).filter((entry) => !entry.dir);
  const chatEntry =
    files.find((entry) => normalizeFilename(lastPathPart(entry.name)).toLowerCase() === "_chat.txt") ??
    files.find((entry) => entry.name.toLowerCase().endsWith(".txt"));

  if (!chatEntry) {
    throw new Error("NO_CHAT");
  }

  const chatText = await chatEntry.async("string");
  const mediaEntries = files.filter((entry) => {
    const ext = extension(entry.name);
    return ext ? supportedMediaExtensions.has(ext) : false;
  });

  const mediaFiles = await Promise.all(
    mediaEntries.map(async (entry) => {
      const ext = extension(entry.name) ?? "";
      const blob = await entry.async("blob");
      const filename = normalizeFilename(lastPathPart(entry.name));
      const type = imageExtensions.has(ext) ? "image" : videoExtensions.has(ext) ? "video" : "other";
      return {
        filename,
        blob,
        type,
        url: URL.createObjectURL(blob)
      } satisfies MediaFile;
    })
  );

  return { chatText, mediaFiles, chatFilename: chatEntry.name };
}

function extension(path: string) {
  return lastPathPart(path).split(".").pop()?.toLowerCase();
}

function lastPathPart(path: string) {
  return path.split("/").pop() ?? path;
}
