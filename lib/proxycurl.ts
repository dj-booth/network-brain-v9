import axios from 'axios';

const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY;
const BASE_URL = 'https://api.proxycurl.com/api/v2/people';

if (!PROXYCURL_API_KEY) {
  throw new Error('PROXYCURL_API_KEY is not set in environment variables');
}

// Proxycurl profile response interface
export interface ProxycurlProfile {
  linkedin_url?: string;
  full_name?: string;
  occupation?: string;
  company?: {
    name?: string;
  };
  profile_pic_url?: string;
  // Add more fields as needed
}

// Proxycurl search response interface
export interface ProxycurlSearchResult {
  linkedin_url?: string;
  // Add more fields as needed
}
export interface ProxycurlSearchResponse {
  results: ProxycurlSearchResult[];
}

/**
 * Fetches person data from Proxycurl by LinkedIn URL.
 * @param linkedinUrl The LinkedIn profile URL of the person.
 * @returns Proxycurl person data or null if not found.
 */
export async function fetchPersonByLinkedIn(linkedinUrl: string): Promise<ProxycurlProfile | null> {
  try {
    const response = await axios.get(`${BASE_URL}/profile`, {
      params: { url: linkedinUrl },
      headers: {
        Authorization: `Bearer ${PROXYCURL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data as ProxycurlProfile;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetches person data from Proxycurl by name (optional, less reliable than LinkedIn URL).
 * @param name The full name of the person.
 * @returns Proxycurl search results or null if not found.
 */
export async function searchPersonByName(name: string): Promise<ProxycurlSearchResponse | null> {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { query: name },
      headers: {
        Authorization: `Bearer ${PROXYCURL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data as ProxycurlSearchResponse;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
} 