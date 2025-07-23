const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ReceiptData {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  description: string;
  taxAmount: number;
  paymentMethod: string;
  receiptNumber: string;
  location: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    
    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "No image file provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    // Generate mock OCR data (in real implementation, this would call an OCR service)
    const mockData = generateMockReceiptData();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: mockData,
        confidence: 0.85 + Math.random() * 0.1
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing receipt:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to process receipt" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateMockReceiptData(): ReceiptData {
  const merchants = [
    'Hotel Marriott', 'Uber Technologies', 'Delta Airlines', 
    'Starbucks Coffee', 'Shell Gas Station', 'Best Western',
    'McDonald\'s', 'Hertz Car Rental', 'Walmart', 'Target'
  ];
  
  const categories = [
    'lodging', 'transport', 'meals', 'miscellaneous', 'purchases'
  ];
  
  const currencies = ['USD', 'EUR', 'GBP'];
  
  const merchant = merchants[Math.floor(Math.random() * merchants.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const currency = currencies[Math.floor(Math.random() * currencies.length)];
  const amount = parseFloat((Math.random() * 500 + 10).toFixed(2));
  
  // Generate a date within the last 30 days
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  
  return {
    merchant: merchant,
    amount: amount,
    currency: currency,
    date: date.toISOString().split('T')[0],
    category: category,
    description: `Payment at ${merchant}`,
    taxAmount: parseFloat((amount * 0.1).toFixed(2)),
    paymentMethod: 'Credit Card',
    receiptNumber: `RCP-${Math.floor(Math.random() * 999999)}`,
    location: getRandomLocation()
  };
}

function getRandomLocation(): string {
  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
    'London, UK', 'Paris, France', 'Tokyo, Japan',
    'Berlin, Germany', 'Sydney, Australia', 'Toronto, Canada'
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}