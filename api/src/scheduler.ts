import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';

const execPromise = promisify(exec);

// Validate environment for scheduler
const _required = ['SUPABASE_URL', 'SUPABASE_KEY']
const _missing = _required.filter(k => !process.env[k])
if (_missing.length) {
  console.error(`[env] Missing required environment variables for scheduler: ${_missing.join(', ')}`)
  console.error('[env] See api/.env.example and create api/.env before running the scheduler.')
  process.exit(1)
}

console.log(`[env] scheduler environment OK. NODE_ENV=${process.env.NODE_ENV || 'development'}`)

// Initialize supabase admin client used by scheduler (with connection pooling support)
import { getAdminClient } from './lib/supabaseClients'
const adminClient = getAdminClient()

// Function to run the data update script
const runDataUpdate = async () => {
  console.log('Running daily data update at:', new Date().toISOString());
  
  try {
    const { stdout, stderr } = await execPromise('npm run update-data', {
      cwd: process.cwd()
    });
    
    if (stdout) {
      console.log('Update script output:', stdout);
    }
    
    if (stderr) {
      console.error('Update script errors:', stderr);
    }
    
    console.log('Daily data update completed successfully');
  } catch (error) {
    console.error('Failed to run data update:', error);
  }
};

// Schedule daily updates at 9:00 AM (Nepal time is UTC+5:45)
// This would typically be handled by a proper cron job or task scheduler
console.log('Data update scheduler started');

// Run immediately for testing
runDataUpdate();

// Schedule daily updates (in a real implementation, this would be handled by the OS cron)
// For demonstration, we'll run every 24 hours
setInterval(runDataUpdate, 24 * 60 * 60 * 1000);

console.log('Scheduler will run daily updates every 24 hours');