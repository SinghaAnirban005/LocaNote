export interface Note {
  filePath: string;
  fileName: string;
  content: string;
  frontMatter?: Record<string, any>;
  title?: string;
  lastModified?: Date;
  size?: number;
}

export interface SearchResult {
  note: Note;
  relevance: number;
  matches: string[];
  context?: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  minRelevance?: number;
  includeContent?: boolean;
}

export interface NoteSummary {
  fileName: string;
  title?: string;
  wordCount: number;
  tags?: string[];
  lastModified: Date;
  summary?: string;
}