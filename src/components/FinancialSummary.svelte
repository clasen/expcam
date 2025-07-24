<script>
  import { expenses, financialSummary, expenseCategories } from '../stores/appStore.js';
  import { tripData } from '../stores/appStore.js';
  import JSZip from 'jszip';
  
  $: categoryTotals = $expenseCategories.map(category => {
    const total = $expenses
      .filter(expense => expense.category === category.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      ...category,
      total
    };
  });
  
  $: grandTotal = $expenses.reduce((sum, expense) => sum + expense.amount, 0);
  $: amountToRefund = grandTotal - $financialSummary.advanceReceived;
  
  function formatCurrency(amount, currency = $financialSummary.selectedCurrency) {
    if (currency === '...') {
      return `... ${amount.toFixed(2)}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  }
  
  function updateAdvance(event) {
    const advance = parseFloat(event.target.value) || 0;
    financialSummary.update(summary => ({
      ...summary,
      advanceReceived: advance,
      amountToRefund: grandTotal - advance
    }));
  }
  
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
      'Tax Amount', 'Created At', 'Updated At'
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
      expense.taxAmount || 0,
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
  <!-- Category Breakdown -->
  <div>
    <h3 class="text-lg font-semibold text-white mb-4">
      <i class="fas fa-chart-pie mr-2 text-primary-500"></i>
      Expense Breakdown
    </h3>
    
    <div class="space-y-3">
      {#each categoryTotals as category}
        <div class="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <i class="fas {category.icon} text-white text-sm"></i>
            </div>
            <span class="text-white">{category.name}</span>
          </div>
          <span class="font-semibold text-accent-500">
            {formatCurrency(category.total)}
          </span>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Financial Summary -->
  <div>
    <h3 class="text-lg font-semibold text-white mb-4">
      <i class="fas fa-calculator mr-2 text-accent-500"></i>
      Financial Summary
    </h3>
    
    <div class="space-y-4">
      <!-- Grand Total -->
      <div class="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-primary-600">
        <span class="text-white font-medium">Grand Total</span>
        <span class="font-bold text-xl text-primary-500">
          {formatCurrency(grandTotal)}
        </span>
      </div>
      
      <!-- Advance Received -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-dark-200">
          Advance Received from Treasury
        </label>
        <input
          type="number"
          step="0.01"
          value={$financialSummary.advanceReceived}
          on:input={updateAdvance}
          placeholder="0.00"
          class="input-field"
        >
      </div>
      
      <!-- Amount to Refund/Reimburse -->
      <div class="flex items-center justify-between p-4 rounded-lg"
           class:bg-success-600={amountToRefund < 0}
           class:bg-error-600={amountToRefund > 0}
           class:bg-dark-700={amountToRefund === 0}>
        <span class="text-white font-medium">
          {amountToRefund > 0 ? 'Amount to be Reimbursed' : 
           amountToRefund < 0 ? 'Amount to be Refunded' : 
           'Balanced'}
        </span>
        <span class="font-bold text-xl text-white">
          {formatCurrency(Math.abs(amountToRefund))}
        </span>
      </div>
    </div>
  </div>
  
  <!-- Currency Settings -->
  <div>
    <h3 class="text-lg font-semibold text-white mb-4">
      <i class="fas fa-exchange-alt mr-2 text-secondary-500"></i>
      Currency Settings
    </h3>
    
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-dark-200 mb-2">
          Report Currency
        </label>
        <select
          bind:value={$financialSummary.selectedCurrency}
          class="input-field"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="JPY">JPY - Japanese Yen</option>
        </select>
      </div>
      
      <div class="p-3 bg-dark-700 rounded-lg">
        <p class="text-sm text-dark-300">
          <i class="fas fa-info-circle mr-2 text-primary-500"></i>
          Currency conversion rates are applied automatically based on expense dates.
        </p>
      </div>
    </div>
  </div>
  
  <!-- Export Summary -->
  <div class="pt-4 border-t border-dark-700">
    <button class="btn-primary w-full">
    <button 
      class="btn-primary w-full"
      on:click={exportFinancialReport}
    >
      <i class="fas fa-file-export mr-2"></i>
      Export Financial Report
    </button>
  </div>
</div>