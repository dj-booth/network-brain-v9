import axios from 'axios';

const PDL_API_KEY = process.env.PEOPLEDATALABS_API_KEY;
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5/person/enrich';

if (!PDL_API_KEY) {
  throw new Error('PEOPLEDATALABS_API_KEY is not set in environment variables');
}

/**
 * Validates and normalizes a LinkedIn profile URL.
 * @param url The LinkedIn profile URL to validate.
 * @returns The normalized LinkedIn URL if valid, otherwise null.
 */
export function validateLinkedInUrl(url: string): string | null {
  if (!url) return null;
  // Robust regex for LinkedIn profile URLs
  const regex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?(\?.*)?$/i;
  const match = url.match(regex);
  if (!match) return null;
  // Normalize: remove query params, enforce https, remove trailing slash
  let normalized = url.split('?')[0];
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (!normalized.startsWith('https://')) {
    normalized = 'https://' + normalized.replace(/^https?:\/\//, '');
  }
  return normalized;
}

/**
 * Fetches person data from People Data Labs by LinkedIn URL.
 * @param linkedinUrl The LinkedIn profile URL of the person.
 * @returns PDL person data or null if not found.
 */
export async function fetchPersonByLinkedIn(linkedinUrl: string) {
  const validUrl = validateLinkedInUrl(linkedinUrl);
  if (!validUrl) return null;
  try {
    const response = await axios.post(
      PDL_BASE_URL,
      { profile: validUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': PDL_API_KEY,
        },
      }
    );
    if (response.data && Object.keys(response.data).length > 0) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
} 