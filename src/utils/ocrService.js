// OCR service that communicates with server-side functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';

export async function processReceiptImage(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-receipt`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process receipt image');
  }
}

export async function processBatchImages(imageFiles) {
  try {
    const formData = new FormData();
    
    // Add each file with a unique key
    imageFiles.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-batch-receipts`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.results || [];
  } catch (error) {
    console.error('Batch OCR processing error:', error);
    throw new Error('Failed to process receipt images');
  }
}