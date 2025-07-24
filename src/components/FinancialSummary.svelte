<script>
  import { expenses, financialSummary, expenseCategories } from '../stores/appStore.js';
  import { tripData } from '../stores/appStore.js';
  import JSZip from 'jszip';
  
  async function exportFinancialReport() {
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      const travelId = $tripData.travelId || 'draft';
      
      // 1. Add CSV file with expenses and trip information
      const csvContent = generateExpensesCSVWithTripInfo();
      zip.file(`expenses-${travelId}-${timestamp}.csv`, csvContent);
      
      // 2. Add receipt images
      await addReceiptImagesToZip(zip);
      
      // 3. Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-export-${travelId}-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Error creating ZIP file. Please try again.');
    }
  }
  
  function generateExpensesCSVWithTripInfo() {
    // Headers include both expense and trip information
    const headers = [
      // Trip Information
      'Travel ID', 'From Date', 'To Date', 'Travel Days', 'Lodging Type', 
      'Accounting Code', 'Expense Type', 'Approving Manager',
      // Expense Information  
      'Expense ID', 'Date', 'Merchant', 'Amount', 'Currency', 'Category', 
      'Description', 'Location', 'Receipt Number', 'Payment Method', 
      'Created At', 'Updated At'
    ];
    
    const rows = $expenses.map(expense => [
      // Trip Information (repeated for each expense)
      $tripData.travelId || '',
      $tripData.fromDate || '',
      $tripData.toDate || '',
      $tripData.travelDays || '',
      $tripData.lodgingType || '',
      $tripData.accountingCode || '',
      $tripData.expenseType || '',
      $tripData.approvingManager || '',
      // Expense Information
      expense.id || '',
      expense.date || '',
      expense.merchant || '',
      expense.amount || 0,
      expense.currency || '',
      expense.category || '',
      expense.description || '',
      expense.location || '',
      expense.receiptNumber || '',
      expense.paymentMethod || '',
      expense.createdAt || '',
      expense.updatedAt || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
  
  async function addReceiptImagesToZip(zip) {
    const imagesFolder = zip.folder('receipt-images');
    let imageCount = 0;
    
    for (const expense of $expenses) {
      if (expense.imageUrl) {
        try {
          // Convert image URL to blob and add to ZIP
          const response = await fetch(expense.imageUrl);
          const blob = await response.blob();
          const fileName = `receipt-${expense.id}-${expense.merchant?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}.jpg`;
          
          imagesFolder.file(fileName, blob);
          imageCount++;
          
        } catch (error) {
          console.warn(`Failed to add image for expense ${expense.id} to ZIP:`, error);
        }
      }
    }
    
    console.log(`Added ${imageCount} receipt images to ZIP.`);
    return imageCount;
  }
</script>

<div class="space-y-6">
  <!-- Info Message -->
  <div class="p-4 bg-dark-700 rounded-lg border border-dark-600">
    <p class="text-sm text-dark-300">
      <i class="fas fa-info-circle mr-2 text-primary-500"></i>
      Export includes all expenses with individual currencies. No totals are calculated due to mixed currencies.
    </p>
  </div>
  
  <!-- Export Summary -->
  <div class="pt-4 border-t border-dark-700">
    <button 
      class="btn-primary w-full"
      on:click={exportFinancialReport}
    >
      <i class="fas fa-file-export mr-2"></i>
      Export Financial Report
    </button>
  </div>
</div>