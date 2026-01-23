/**
 * Extracts store slug from subdomain if present
 * e.g., "mystore.happy2buy.in" returns "mystore"
 * Returns null for main domain, www, or non-matching hostnames
 */
export function getStoreSlugFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Match pattern: storename.happy2buy.in
  const match = hostname.match(/^([^.]+)\.happy2buy\.in$/);
  
  if (match && match[1] !== 'www') {
    return match[1];
  }
  
  return null;
}

/**
 * Checks if we're on the main domain (not a store subdomain)
 */
export function isMainDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === 'happy2buy.in' ||
    hostname === 'www.happy2buy.in' ||
    hostname === 'localhost' ||
    hostname.includes('lovable.app')
  );
}
