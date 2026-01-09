// Test database connection and check if project tables exist
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    
    if (error) {
      console.error('❌ Projects table error:', error.message);
      
      // Check if table exists by trying other tables
      const { data: goalsData, error: goalsError } = await supabase.from('goals').select('count').limit(1);
      if (goalsError) {
        console.error('❌ Goals table error:', goalsError.message);
      }
      
      const { data: tasksData, error: tasksError } = await supabase.from('project_tasks').select('count').limit(1);
      if (tasksError) {
        console.error('❌ Project tasks table error:', tasksError.message);
      }
      
      console.log('\n💡 Solution: Apply the migrations from database/migrations/ folder:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Run migrations 001-005 in order');
      console.log('3. Or use the SQL execution function from migration 006');
      
    } else {
      console.log('✅ Projects table exists and is accessible');
      console.log('✅ Database connection working');
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
