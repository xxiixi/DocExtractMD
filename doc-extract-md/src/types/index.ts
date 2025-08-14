export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  markdown?: string;
  error?: string;
}

export interface ParseResponse {
  success: boolean;
  markdown?: string;
  error?: string;
}
