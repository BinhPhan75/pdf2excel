
export interface TableRow {
  [key: string]: string | number;
}

export interface ExtractedTable {
  tableName: string;
  headers: string[];
  rows: TableRow[];
}

export interface ProcessingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  progress: number;
}

export interface AppState {
  file: File | null;
  tables: ExtractedTable[];
  processing: ProcessingState;
}
