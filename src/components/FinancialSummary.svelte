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
  
  function exportFinancialReport() {
    const reportData = {
      reportGenerated: new Date().toISOString(),
      tripInformation: $tripData,
      expenseSummary: {
        totalExpenses: $expenses.length,
        grandTotal: grandTotal,
        advanceReceived: $financialSummary.advanceReceived,
        amountToRefund: amountToRefund,
        currency: $financialSummary.selectedCurrency
      },
      categoryBreakdown: categoryTotals.filter(cat => cat.total > 0),
      detailedExpenses: $expenses.map(expense => ({
        id: expense.id,
        merchant: expense.merchant,
        amount: expense.amount,
        currency: expense.currency,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        location: expense.location,
        receiptNumber: expense.receiptNumber,
        paymentMethod: expense.paymentMethod,
        taxAmount: expense.taxAmount
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${$tripData.travelId || 'draft'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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