<script>
  import { expenses, financialSummary, expenseCategories } from '../stores/appStore.js';
  import { tripData } from '../stores/appStore.js';
  
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
      // Create individual files and download them separately
      const timestamp = new Date().toISOString().split('T')[0];
      const travelId = $tripData.travelId || 'draft';
      
      // 1. Download CSV file with all expenses
      downloadExpensesCSV(timestamp, travelId);
      
      // 2. Download trip information
      downloadTripInfo(timestamp, travelId);
      
      // 3. Download receipt images
      await downloadReceiptImages();
      
      alert('Export completed! Multiple files have been downloaded to your Downloads folder.');
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    }
  }
  
  function downloadExpensesCSV(timestamp, travelId) {
    const headers = [
      'ID', 'Date', 'Merchant', 'Amount', 'Currency', 'Category', 
      'Description', 'Location', 'Receipt Number', 'Payment Method', 
      'Tax Amount', 'Created At', 'Updated At'
    ];
    
    const rows = $expenses.map(expense => [
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
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${travelId}-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  function downloadTripInfo(timestamp, travelId) {
    const info = `TRIP INFORMATION
================

Travel ID: ${$tripData.travelId || 'N/A'}
From Date: ${$tripData.fromDate || 'N/A'}
To Date: ${$tripData.toDate || 'N/A'}
Travel Days: ${$tripData.travelDays || 'N/A'}
Lodging Type: ${$tripData.lodgingType || 'N/A'}
Accounting Code: ${$tripData.accountingCode || 'N/A'}
Expense Type: ${$tripData.expenseType || 'N/A'}
Approving Manager: ${$tripData.approvingManager || 'N/A'}

EXPORT SUMMARY
==============

Report Generated: ${new Date().toISOString()}
Total Expenses: ${$expenses.length}
Grand Total: ${formatCurrency(grandTotal)}
Advance Received: ${formatCurrency($financialSummary.advanceReceived)}
Amount to Refund: ${formatCurrency(amountToRefund)}
Selected Currency: ${$financialSummary.selectedCurrency}

EXPENSE SUMMARY BY CATEGORY
===========================

${categoryTotals.filter(cat => cat.total > 0).map(cat => 
  `${cat.name}: ${formatCurrency(cat.total)}`
).join('\n')}
`;
    
    const blob = new Blob([info], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-info-${travelId}-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  async function downloadReceiptImages() {
    let imageCount = 0;
    
    for (const expense of $expenses) {
      if (expense.imageUrl) {
        try {
          // Convert image URL to blob and download
          const response = await fetch(expense.imageUrl);
          const blob = await response.blob();
          const fileName = `receipt-${expense.id}-${expense.merchant?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}.jpg`;
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          imageCount++;
          
          // Small delay to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.warn(`Failed to download image for expense ${expense.id}:`, error);
        }
      }
    }
    
    if (imageCount === 0) {
      console.log('No receipt images found to download.');
    } else {
      console.log(`Downloaded ${imageCount} receipt images.`);
    }
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