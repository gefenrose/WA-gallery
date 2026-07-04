import type { AlbumItem, ChatMessage, MediaFile } from "../types";
import { normalizeFilename, stripMediaMarkers } from "./parseWhatsAppChat";

export function buildAlbumItems(messages: ChatMessage[], mediaFiles: MediaFile[]): AlbumItem[] {
  const mediaByName = new Map(mediaFiles.map((file) => [normalizeFilename(file.filename).toLowerCase(), file]));
  const used = new Set<string>();
  const items: AlbumItem[] = [];

  messages.forEach((message, index) => {
    for (const rawName of message.mediaFilenames) {
      const media = mediaByName.get(normalizeFilename(rawName).toLowerCase());
      if (!media || (media.type !== "image" && media.type !== "video")) continue;

      used.add(media.filename.toLowerCase());
      const sameMessageCaption = stripMediaMarkers(message.text);
      const nearby = sameMessageCaption ? undefined : findNearbyCaption(messages, index, message.sender);

      items.push({
        id: `${message.id}-${media.filename}`,
        media,
        dateRaw: message.dateRaw,
        timeRaw: message.timeRaw,
        sender: message.sender,
        caption: sameMessageCaption || nearby?.text || "",
        sourceMessageId: message.id,
        confidence: sameMessageCaption ? "high" : nearby ? "medium" : "low"
      });
    }
  });

  for (const media of mediaFiles) {
    if ((media.type !== "image" && media.type !== "video") || used.has(media.filename.toLowerCase())) continue;
    const inferred = inferDateFromFilename(media.filename);
    items.push({
      id: `unmatched-${media.filename}`,
      media,
      dateRaw: inferred.dateRaw,
      timeRaw: "",
      caption: "",
      confidence: "low"
    });
  }

  return items.sort((a, b) => {
    const aTime = dateKey(a.dateRaw, a.timeRaw);
    const bTime = dateKey(b.dateRaw, b.timeRaw);
    return bTime - aTime;
  });
}

function findNearbyCaption(messages: ChatMessage[], index: number, sender?: string) {
  const offsets = [-1, 1, -2, 2];
  for (const offset of offsets) {
    const candidate = messages[index + offset];
    if (!candidate || candidate.isSystemMessage || candidate.mediaFilenames.length > 0) continue;
    if (sender && candidate.sender !== sender) continue;

    const text = stripMediaMarkers(candidate.text);
    if (text) return { text, id: candidate.id };
  }
  return undefined;
}

function inferDateFromFilename(filename: string) {
  const match = filename.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return { dateRaw: "", timeRaw: "" };
  return { dateRaw: `${match[3]}/${match[2]}/${match[1]}`, timeRaw: "" };
}

function dateKey(dateRaw: string, timeRaw: string) {
  const [day, month, rawYear] = dateRaw.split(/[./-]/).map(Number);
  if (!day || !month || !rawYear) return 0;
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const [hour = 0, minute = 0, second = 0] = timeRaw.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}
