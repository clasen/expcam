import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const formData = await req.formData()
    const files: File[] = []
    
    // Extract all image files from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No image files provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const results = []
    
    for (const file of files) {
      try {
        // Simulate OCR processing delay for each file
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))
        
        const mockData = generateMockReceiptData()
        
        results.push({
          file: file.name,
          success: true,
          data: mockData,
          confidence: 0.85 + Math.random() * 0.1
        })
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Batch OCR processing error:", error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to process receipts" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

function generateMockReceiptData() {
  const merchants = [
    'Hotel Marriott', 'Uber Technologies', 'Delta Airlines', 
    'Starbucks Coffee', 'Shell Gas Station', 'Best Western',
    'McDonald\'s', 'Hertz Car Rental', 'Walmart', 'Target'
  ]
  
  const categories = [
    'lodging', 'transport', 'meals', 'miscellaneous', 'purchases'
  ]
  
  const currencies = ['USD', 'EUR', 'GBP']
  
  const merchant = merchants[Math.floor(Math.random() * merchants.length)]
  const category = categories[Math.floor(Math.random() * categories.length)]
  const currency = currencies[Math.floor(Math.random() * currencies.length)]
  const amount = (Math.random() * 500 + 10).toFixed(2)
  
  // Generate a date within the last 30 days
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 30))
  
  return {
    merchant: merchant,
    amount: parseFloat(amount),
    currency: currency,
    date: date.toISOString().split('T')[0],
    category: category,
    description: `Payment at ${merchant}`,
    taxAmount: (parseFloat(amount) * 0.1).toFixed(2),
    paymentMethod: 'Credit Card',
    receiptNumber: `RCP-${Math.floor(Math.random() * 999999)}`,
    location: getRandomLocation()
  }
}

function getRandomLocation() {
  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
    'London, UK', 'Paris, France', 'Tokyo, Japan',
    'Berlin, Germany', 'Sydney, Australia', 'Toronto, Canada'
  ]
  
  return locations[Math.floor(Math.random() * locations.length)]
}