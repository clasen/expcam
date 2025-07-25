<script>
  import { onMount } from 'svelte';
  import { expenses, tripData, financialSummary, currentScreen, editingExpense, currentTab } from '../stores/appStore.js';
  import { autoSave } from '../utils/storage.js';
  import JSZip from 'jszip';
  
  import ExpenseCard from '../components/ExpenseCard.svelte';
  
  let searchTerm = '';
  let selectedCategory = 'all';
  
  $: filteredExpenses = $expenses.filter(expense => {
    const matchesSearch = expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Calculate total only if all expenses have the same currency
  $: {
    const currencies = [...new Set($expenses.map(exp => exp.currency).filter(c => c && c !== '...'))];
    const hasSameCurrency = currencies.length <= 1;
    totalAmount = hasSameCurrency ? $expenses.reduce((sum, expense) => sum + expense.amount, 0) : null;
    totalCurrency = hasSameCurrency && currencies.length > 0 ? currencies[0] : null;
  }
  
  let totalAmount = null;
  let totalCurrency = null;
  
  // Count incomplete expenses
  $: incompleteCount = $expenses.filter(expense => {
    const isLoading = expense.isLoading || false;
    return !isLoading && (
      !expense.merchant || 
      !expense.amount || 
      expense.amount === 0 ||
      !expense.currency || 
      expense.currency === '...' ||
      !expense.date || 
      !expense.category
    );
  }).length;
  
  onMount(() => {
    autoSave();
  });
  
  function handleEditExpense(event) {
    const expense = event.detail;
    editingExpense.set(expense);
    currentScreen.set('expense-form');
  }
  
  function handleDeleteExpense(event) {
    const expenseId = event.detail;
    expenses.update(list => list.filter(exp => exp.id !== expenseId));
  }
  
  function openTripModal() {
    currentScreen.set('trip-data');
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
      'Expense ID', 'Date', 'Hour', 'Merchant', 'Amount', 'Currency', 'Category', 
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
      expense.hour || '',
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
  
  function triggerFileUpload() {
    // Create a hidden file input and trigger it
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        // Dispatch a custom event with the selected files
        window.dispatchEvent(new CustomEvent('filesSelected', { detail: files }));
      }
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }
  
  function formatCurrency(amount, currency = 'USD') {
    if (currency === '...') {
      return `... ${amount.toFixed(2)}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  }
</script>

<div class="flex flex-col h-full bg-dark-900">
  <!-- Header -->
  <header class="bg-dark-800 border-b border-dark-700 safe-area-top">
    <div class="flex items-center justify-between p-4">
      <div>
        <h1 class="text-xl font-bold text-white">Expenses</h1>
        <p class="text-sm text-dark-300 flex items-center gap-2">
          <span>
            {$expenses.length} expenses
            {#if totalAmount !== null && totalCurrency}
              • {formatCurrency(totalAmount, totalCurrency)}
            {/if}
          </span>
          {#if incompleteCount > 0}
            <span class="inline-flex items-center gap-1 text-yellow-400 text-xs">
              <i class="fas fa-exclamation-triangle"></i>
              {incompleteCount} incomplete
            </span>
          {/if}
        </p>
      </div>
      <div class="flex space-x-2">
        <button
          class="p-2 text-dark-400 hover:text-white transition-colors"
          on:click={openTripModal}
          aria-label="Trip Settings"
        >
          <i class="fas fa-plane text-lg"></i>
        </button>
        <button
          class="p-2 text-dark-400 hover:text-white transition-colors"
          on:click={exportFinancialReport}
          aria-label="Download Report"
        >
          <i class="fas fa-download text-lg"></i>
        </button>
      </div>
    </div>
    
    <!-- Search and Filter -->
    <div class="px-4 pb-4">
      <div class="flex space-x-3">
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search expenses..."
            bind:value={searchTerm}
            class="input-field text-sm"
          >
        </div>
        <select
          bind:value={selectedCategory}
          class="input-field text-sm w-32"
        >
          <option value="all">All</option>
          <option value="lodging">Lodging</option>
          <option value="transport">Transport</option>
          <option value="meals">Meals</option>
          <option value="miscellaneous">Misc</option>
          <option value="purchases">Purchases</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  </header>
  
  <!-- Content -->
  <main class="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
    {#if filteredExpenses.length === 0}
      <div class="text-center py-12">
        <i class="fas fa-receipt text-4xl text-dark-600 mb-4"></i>
        <h3 class="text-lg font-medium text-dark-300 mb-2">
          {$expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
        </h3>
        <p class="text-dark-400 mb-6">
          {$expenses.length === 0 
            ? 'Start by uploading images of your receipts'
            : 'Try adjusting your search or filter criteria'
          }
        </p>
        {#if $expenses.length === 0}
          <button class="btn-accent" on:click={triggerFileUpload}>
            <i class="fas fa-upload mr-2"></i>
            Upload Image
          </button>
        {/if}
      </div>
    {:else}
      {#each filteredExpenses as expense (expense.id)}
        <ExpenseCard 
          {expense}
          on:edit={handleEditExpense}
          on:delete={handleDeleteExpense}
        />
      {/each}
    {/if}
  </main>
</div>