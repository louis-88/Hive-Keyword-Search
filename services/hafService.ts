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
  timeRange: string,
  customDateRange: { start: string, end: string },
  author: string | null,
  settings: ConnectionSettings
): Promise<{ posts: HivePost[], debugSql: string }> => {
  
  // Trim the endpoint to remove any accidental whitespace
  const endpoint = settings.endpointUrl?.trim();

  if (!endpoint) {
    throw new Error("No Endpoint configured.");
  }

  // Construct request body
  const body: any = {
    keywords: keywords,
    author: author
  };

  if (timeRange === 'custom') {
    if (!customDateRange.start || !customDateRange.end) {
        throw new Error("Start Date and End Date are required for custom range.");
    }
    body.startDate = customDateRange.start;
    body.endDate = customDateRange.end;
  } else {
    body.days = Number(timeRange);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Explicitly request CORS mode, although it is the default
      mode: 'cors',
      body: JSON.stringify(body)
    });

    let json: SearchResponse | null = null;
    try {
        json = await response.json();
    } catch (e) {
        // Failed to parse JSON (e.g. server timeout/crash returning HTML)
    }

    if (!response.ok || !json || !json.success) {
      const errorMsg = json?.error || `Server responded with status: ${response.status}`;
      const error: any = new Error(errorMsg);
      // Attach debug SQL if available from server
      if (json?.debug?.generatedSql) {
          error.debugSql = json.debug.generatedSql;
      }
      throw error;
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