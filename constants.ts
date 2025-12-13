
// Automatically detect environment
const isLocal = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Use full URL for local dev (split ports) and relative URL for production (same port)
export const DEFAULT_ENDPOINT = isLocal ? "http://localhost:3000/search" : "/search";

export const MAX_KEYWORDS = 3;
export const SEARCH_DAYS = 3;
export const HIVE_GENESIS_DATE = '2020-03-20';

// Mock posts removed as we are focusing on live data
export const MOCK_POSTS = [];

export const PLATFORMS: Record<string, string> = {
  'peakd': 'https://peakd.com',
  'ecency': 'https://ecency.com',
  'hive.blog': 'https://hive.blog'
};
