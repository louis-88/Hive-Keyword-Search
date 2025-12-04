export interface HivePost {
  author: string;
  permlink: string;
  title: string;
  body: string;
  created: string; // ISO date string
  json_metadata?: string;
  category?: string;
  depth?: number;
  children?: number;
}

export interface SearchConfig {
  keywords: string[];
  days: number;
}

export interface ConnectionSettings {
  endpointUrl: string; 
  useMock: boolean;
  username?: string;
  password?: string;
}

export enum FetchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type HivePlatform = 'peakd' | 'ecency' | 'hive.blog';