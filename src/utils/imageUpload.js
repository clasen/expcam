// Utility functions for image upload to server

export async function uploadImageToServer(imageBlob, filename = null) {
  try {
    // Convert blob to base64
    const base64Image = await blobToBase64(imageBlob);
    
    // Generate filename if not provided
    const finalFilename = filename || `receipt-${Date.now()}.jpg`;
    
    // Prepare upload data
    const uploadData = {
      image: base64Image,
      filename: finalFilename,
      contentType: imageBlob.type || 'image/jpeg'
    };

    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Upload to server
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(uploadData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function uploadMultipleImages(imageFiles) {
  const results = [];
  
  for (const file of imageFiles) {
    try {
      const result = await uploadImageToServer(file, file.name);
      results.push({
        filename: file.name,
        ...result
      });
    } catch (error) {
      results.push({
        filename: file.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Helper function to convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper function to compress image before upload
export async function compressImage(file, maxWidth = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}