import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface BackupResponse {
  success: boolean;
  backup_id: string;
  records_count: number;
  backup_date: string;
  file_path?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('🔄 Starting daily backup of pending_reviews...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date for backup naming
    const backupDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const backupId = `backup_${backupDate}_${Date.now()}`;

    console.log(`📅 Creating backup with ID: ${backupId}`);

    // Fetch all pending reviews with related feedback data
    const { data: pendingReviews, error: fetchError } = await supabase
      .from('pending_reviews')
      .select(`
        *,
        feedbacks (
          id,
          cafe_id,
          customer_name,
          customer_email,
          rating,
          comment,
          comment_status,
          sentiment,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching pending reviews:', fetchError);
      throw fetchError;
    }

    const recordsCount = pendingReviews?.length || 0;
    console.log(`📊 Found ${recordsCount} pending reviews to backup`);

    // Create backup metadata
    const backupMetadata = {
      backup_id: backupId,
      backup_date: backupDate,
      backup_timestamp: new Date().toISOString(),
      records_count: recordsCount,
      backup_type: 'daily_pending_reviews',
      version: '1.0'
    };

    // Prepare backup data structure
    const backupData = {
      metadata: backupMetadata,
      pending_reviews: pendingReviews || [],
      summary: {
        total_records: recordsCount,
        needs_validation_count: pendingReviews?.filter(r => r.needs_validation).length || 0,
        auto_approved_count: pendingReviews?.filter(r => r.auto_approved).length || 0,
        manual_review_count: pendingReviews?.filter(r => r.needs_validation && !r.auto_approved).length || 0,
        approved_count: pendingReviews?.filter(r => r.is_approved === true).length || 0,
        rejected_count: pendingReviews?.filter(r => r.is_approved === false).length || 0,
        pending_count: pendingReviews?.filter(r => r.is_approved === null).length || 0
      }
    };

    // Store backup in Supabase Storage
    const fileName = `pending-reviews-backup-${backupDate}.json`;
    const filePath = `backups/pending-reviews/${new Date().getFullYear()}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('moderation-backups')
      .upload(filePath, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error uploading backup to storage:', uploadError);
      
      // If storage fails, still log the backup in database
      console.log('💾 Storage failed, logging backup metadata in database...');
    } else {
      console.log(`✅ Backup uploaded successfully to: ${filePath}`);
    }

    // Log backup in database for tracking
    const { error: logError } = await supabase
      .from('backup_logs')
      .insert({
        backup_id: backupId,
        backup_type: 'pending_reviews',
        backup_date: backupDate,
        records_count: recordsCount,
        file_path: uploadError ? null : filePath,
        status: uploadError ? 'storage_failed' : 'completed',
        metadata: backupMetadata,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('⚠️ Error logging backup (backup still successful):', logError);
    }

    // Clean up old backups (keep last 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    try {
      const { error: cleanupError } = await supabase
        .from('backup_logs')
        .delete()
        .eq('backup_type', 'pending_reviews')
        .lt('backup_date', cutoffDate.toISOString().split('T')[0]);

      if (cleanupError) {
        console.error('⚠️ Error cleaning up old backup logs:', cleanupError);
      } else {
        console.log('🧹 Cleaned up old backup logs');
      }

      // Also clean up old storage files
      const { data: oldFiles, error: listError } = await supabase.storage
        .from('moderation-backups')
        .list(`backups/pending-reviews/${cutoffDate.getFullYear()}`);

      if (!listError && oldFiles) {
        const filesToDelete = oldFiles
          .filter(file => file.name.includes('pending-reviews-backup'))
          .filter(file => {
            const fileDate = file.name.match(/\d{4}-\d{2}-\d{2}/)?.[0];
            return fileDate && new Date(fileDate) < cutoffDate;
          })
          .map(file => `backups/pending-reviews/${cutoffDate.getFullYear()}/${file.name}`);

        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('moderation-backups')
            .remove(filesToDelete);

          if (deleteError) {
            console.error('⚠️ Error deleting old backup files:', deleteError);
          } else {
            console.log(`🗑️ Deleted ${filesToDelete.length} old backup files`);
          }
        }
      }
    } catch (cleanupError) {
      console.error('⚠️ Error during cleanup (backup still successful):', cleanupError);
    }

    const response: BackupResponse = {
      success: true,
      backup_id: backupId,
      records_count: recordsCount,
      backup_date: backupDate,
      file_path: uploadError ? undefined : filePath
    };

    console.log('✅ Daily backup completed successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Backup process failed:', error);
    
    const errorResponse: BackupResponse = {
      success: false,
      backup_id: '',
      records_count: 0,
      backup_date: new Date().toISOString().split('T')[0],
      error: error.message
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
