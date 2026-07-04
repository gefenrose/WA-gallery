import type { ChatMessage } from "../types";

const invisibleMarks = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const timestampPatterns = [
  /^(\[?)(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?\s+-\s+(.*)$/,
  /^(\[?)(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?\s+-\s+(.*)$/
];
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
  for (const pattern of timestampPatterns) {
    const match = line.match(pattern);
    if (!match) continue;

    const [, , dateRaw, timeRaw, body] = match;
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
  return undefined;
}

function splitSender(body: string) {
  const clean = body.replace(invisibleMarks, "").trim();
  const colonIndex = clean.indexOf(": ");
  if (colonIndex <= 0) return undefined;

  const sender = clean.slice(0, colonIndex).trim();
  const text = clean.slice(colonIndex + 2).trim();
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
  const timeParts = timeRaw.split(":").map(Number);
  if (dateParts.length < 3 || timeParts.length < 2) return undefined;

  const [day, month, rawYear] = dateParts;
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  return new Date(year, month - 1, day, timeParts[0], timeParts[1], timeParts[2] ?? 0);
}
