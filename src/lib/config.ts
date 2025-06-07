// Configuration helper for environment variables
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  
  // Check if all required environment variables are set
  isConfigured: function() {
    return !!(this.supabase.url && this.supabase.anonKey);
  },
  
  // Get configuration errors
  getConfigErrors: function() {
    const errors: string[] = [];
    
    if (!this.supabase.url) {
      errors.push('VITE_SUPABASE_URL is not set');
    }
    
    if (!this.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is not set');
    }
    
    return errors;
  },
  
  // Log configuration status
  logStatus: function() {
    if (this.isConfigured()) {
      console.log('✅ Configuration loaded successfully');
    } else {
      console.error('❌ Configuration errors:');
      this.getConfigErrors().forEach(error => console.error(`  - ${error}`));
      console.error('\nPlease create a .env file in your project root with:');
      console.error('VITE_SUPABASE_URL=your_supabase_project_url');
      console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    }
  }
};

// Log configuration status on import
config.logStatus(); 