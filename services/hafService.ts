import { ConnectionSettings, HivePost } from '../types';

interface SearchResponse {
  success: boolean;
  data: HivePost[];
  error?: string;
  debug?: {
    generatedSql: string;
    rowCount: number;
  };
}

/**
 * Fetches posts based on keywords by calling the local middleware server.
 */
export const fetchPostsByKeywords = async (
  keywords: string[],
  settings: ConnectionSettings
): Promise<{ posts: HivePost[], debugSql: string }> => {
  
  // Trim the endpoint to remove any accidental whitespace
  const endpoint = settings.endpointUrl?.trim();

  if (!endpoint) {
    throw new Error("No Endpoint configured.");
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Explicitly request CORS mode, although it is the default
      mode: 'cors',
      body: JSON.stringify({
        keywords: keywords,
        days: 3
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const json: SearchResponse = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Unknown server error");
    }

    // Map the body_preview from server to body property for the UI
    const mappedPosts = json.data.map((p: any) => ({
      ...p,
      body: p.body_preview || p.body // Handle cases where server sends full body or preview
    }));

    return {
      posts: mappedPosts,
      debugSql: json.debug?.generatedSql || "SQL generated on server"
    };
    
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};