export type ChatMessage = {
  id: string;
  dateRaw: string;
  timeRaw: string;
  timestamp?: Date;
  sender?: string;
  text: string;
  mediaFilenames: string[];
  isSystemMessage?: boolean;
};

export type MediaFile = {
  filename: string;
  blob: Blob;
  url: string;
  type: "image" | "video" | "other";
};

export type AlbumItem = {
  id: string;
  media: MediaFile;
  dateRaw: string;
  timeRaw: string;
  sender?: string;
  caption: string;
  sourceMessageId?: string;
  confidence: "high" | "medium" | "low";
};

export type FilterMode = "all" | "withCaptions" | "missingCaptions";

export type DisplayOptions = {
  date: boolean;
  time: boolean;
  sender: boolean;
  text: boolean;
};
