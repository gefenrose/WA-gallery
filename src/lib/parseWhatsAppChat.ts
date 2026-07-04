import type { ChatMessage } from "../types";

const invisibleMarks = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const timestampPattern =
  /^\[?(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s*(?:[-–—]\s*)?(.*)$/i;
const mediaRegex = /(?:<attached:\s*)?([^\s<>:"/\\|?*\n\r]+\.(?:jpe?g|png|webp|gif|mp4|mov|heic))(?:>)?/gi;
const omittedRegex = /(image omitted|video omitted|media omitted|התמונה לא נכללה|הסרטון לא נכלל|מדיה לא נכללה|תמונה הושמטה|וידאו הושמט)/i;

export function normalizeFilename(value: string) {
  return value.replace(invisibleMarks, "").trim();
}

export function extractMediaFilenames(text: string) {
  const names = new Set<string>();
  for (const match of text.matchAll(mediaRegex)) {
    names.add(normalizeFilename(match[1]));
  }
  return [...names];
}

export function stripMediaMarkers(text: string) {
  return text
    .replace(mediaRegex, "")
    .replace(omittedRegex, "")
    .replace(/<attached:\s*>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWhatsAppChat(chatText: string): ChatMessage[] {
  const normalized = chatText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const messages: ChatMessage[] = [];
  let current: ChatMessage | undefined;

  for (const line of lines) {
    const parsed = parseMessageStart(line);
    if (parsed) {
      if (current) messages.push(finalizeMessage(current));
      current = parsed;
      continue;
    }

    if (current) {
      current.text = `${current.text}\n${line}`.trim();
    }
  }

  if (current) messages.push(finalizeMessage(current));
  return messages;
}

function parseMessageStart(line: string): ChatMessage | undefined {
  const match = line.replace(invisibleMarks, "").match(timestampPattern);
  if (!match) return undefined;

  const [, dateRaw, timeRaw, body] = match;
  const senderSplit = splitSender(body);
  const id = `${dateRaw}-${timeRaw}-${body}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    dateRaw,
    timeRaw,
    timestamp: parseTimestamp(dateRaw, timeRaw),
    sender: senderSplit?.sender,
    text: senderSplit?.text ?? body.trim(),
    mediaFilenames: [],
    isSystemMessage: !senderSplit
  };
}

function splitSender(body: string) {
  const clean = body.replace(invisibleMarks, "").trim();
  const colonIndex = clean.indexOf(":");
  if (colonIndex <= 0) return undefined;

  const sender = clean.slice(0, colonIndex).trim();
  const text = clean.slice(colonIndex + 1).trim();
  if (!sender || sender.length > 80) return undefined;
  return { sender, text };
}

function finalizeMessage(message: ChatMessage): ChatMessage {
  const mediaFilenames = extractMediaFilenames(message.text);
  return {
    ...message,
    mediaFilenames,
    isSystemMessage: message.isSystemMessage || (!message.sender && mediaFilenames.length === 0)
  };
}

function parseTimestamp(dateRaw: string, timeRaw: string) {
  const dateParts = dateRaw.split(/[./-]/).map(Number);
  const meridiem = timeRaw.match(/\b(AM|PM)\b/i)?.[1].toUpperCase();
  const timeParts = timeRaw.replace(/\s?(AM|PM)/i, "").split(":").map(Number);
  if (dateParts.length < 3 || timeParts.length < 2) return undefined;

  let [day, month, rawYear] = dateParts;
  if (day > 31) {
    [rawYear, month, day] = dateParts;
  }
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  let hour = timeParts[0];
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return new Date(year, month - 1, day, hour, timeParts[1], timeParts[2] ?? 0);
}
