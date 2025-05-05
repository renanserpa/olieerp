import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { functions } from '@wix/sdk-react'; // Assuming we might use sdk-react later, but functions are general

// Get Site ID from environment variable or fallback to the one provided by the user
// Using environment variables is better practice for production, but hardcoding for now
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '83120690-5e78-4590-97bf-04ecd24a7fcd';

// Create a Wix client instance
// Since the functions are public, we don't need complex auth strategies for now.
// Using ApiKeyStrategy with a placeholder key, as some strategy is required.
// For public functions, the key isn't actually validated for the call itself.
const wixClient = createClient({
  modules: { functions },
  auth: ApiKeyStrategy({ siteId: WIX_SITE_ID, apiKey: 'placeholder-api-key-for-public-functions' })
});

export default wixClient;

