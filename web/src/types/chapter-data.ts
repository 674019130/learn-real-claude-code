export interface KeyFile {
  path: string;
  filename: string;
  loc: number;
  source?: string;
  exports?: string[];
  imports?: string[];
}

export interface AnnotatedSnippet {
  filePath: string;
  startLine: number;
  endLine: number;
  source: string;
  annotation: string;
  annotationZh?: string;
}

export interface ChapterData {
  id: string;
  keyFiles: KeyFile[];
  snippets: AnnotatedSnippet[];
}

export interface SourceIndex {
  totalFiles: number;
  totalLoc: number;
  files: {
    path: string;
    loc: number;
    directory: string;
  }[];
}

export interface SimStep {
  type: "user_message" | "assistant_text" | "tool_call" | "tool_result" | "system_event";
  content: string;
  toolName?: string;
  annotation?: string;
  annotationZh?: string;
}

export interface Scenario {
  chapter: string;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  steps: SimStep[];
}
