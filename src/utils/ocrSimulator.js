// Simulates OCR processing of receipt images
export async function processReceiptImage(imageFile) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  
  // Generate mock OCR data
  const mockData = generateMockReceiptData();
  
  return {
    success: true,
    data: mockData,
    confidence: 0.85 + Math.random() * 0.1
  };
}

export async function processBatchImages(imageFiles) {
  const results = [];
  
  for (const file of imageFiles) {
    try {
      const result = await processReceiptImage(file);
      results.push({
        file: file.name,
        ...result
      });
    } catch (error) {
      results.push({
        file: file.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

function generateMockReceiptData() {
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
  const amount = (Math.random() * 500 + 10).toFixed(2);
  
  // Generate a date within the last 30 days
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  
  return {
    merchant: merchant,
    amount: parseFloat(amount),
    currency: currency,
    date: date.toISOString().split('T')[0],
    category: category,
    description: `Payment at ${merchant}`,
    taxAmount: (amount * 0.1).toFixed(2),
    paymentMethod: 'Credit Card',
    receiptNumber: `RCP-${Math.floor(Math.random() * 999999)}`,
    location: getRandomLocation()
  };
}

function getRandomLocation() {
  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
    'London, UK', 'Paris, France', 'Tokyo, Japan',
    'Berlin, Germany', 'Sydney, Australia', 'Toronto, Canada'
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}