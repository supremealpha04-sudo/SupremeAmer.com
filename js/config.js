// Supabase Configuration - These should be in .env in production
// For demo, you'll need to replace with your actual Supabase credentials
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',  // Replace with your Supabase URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY'  // Replace with your Supabase anon key
};

// App Configuration
const APP_CONFIG = {
    name: 'SupremeAmer',
    version: '1.0.0',
    minInvestment: 1000,
    expectedROI: 34
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, APP_CONFIG };
}
