import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UploadRequest {
  image: string; // base64 encoded image
  filename: string;
  contentType: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { image, filename, contentType }: UploadRequest = await req.json()

    if (!image || !filename) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: image, filename' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Convert base64 to blob
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const uniqueFilename = `receipt-${timestamp}-${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(uniqueFilename, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(uniqueFilename)

    return new Response(
      JSON.stringify({
        success: true,
        filename: uniqueFilename,
        path: data.path,
        publicUrl: urlData.publicUrl,
        message: 'Image uploaded successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Upload function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})