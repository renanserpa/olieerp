import { createClient, ApiKeyStrategy } from '@wix/sdk';

// Get Site ID from environment variable or fallback to the one provided by the user
// Using environment variables is better practice for production, but hardcoding for now
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '83120690-5e78-4590-97bf-04ecd24a7fcd';

// Create a Wix client instance
// The 'functions' module from '@wix/functions' is not used for calling Velo http-functions.
// We will use fetch directly in api.ts.
// Keep the client setup in case other Wix SDK modules (e.g., Stores, Bookings) are needed later.
const wixClient = createClient({
  modules: {}, // No specific modules needed for http-function calls via fetch
  auth: ApiKeyStrategy({ siteId: WIX_SITE_ID, apiKey: 'placeholder-api-key-for-public-functions' })
});

export default wixClient;

