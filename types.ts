export interface InputOption {
  id: string;
  label: string;
  icon: string;
}

export interface FileState {
  file: File | null;
  name: string;
  size: number;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  popular?: boolean;
}