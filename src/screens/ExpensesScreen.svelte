<script>
  import { onMount } from 'svelte';
  import { expenses, tripData, financialSummary, currentScreen, editingExpense } from '../stores/appStore.js';
  import { autoSave } from '../utils/storage.js';
  
  import ExpenseCard from '../components/ExpenseCard.svelte';
  
  let searchTerm = '';
  let selectedCategory = 'all';
  
  $: filteredExpenses = $expenses.filter(expense => {
    const matchesSearch = expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  $: totalAmount = $expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
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
  
  function openSummaryModal() {
    currentScreen.set('financial-summary');
  }
  
  function formatCurrency(amount, currency = 'USD') {
    if (currency === 'ARS') {
      return `$${amount.toFixed(2)} ARS`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
</script>

<div class="flex flex-col h-full bg-dark-900">
  <!-- Header -->
  <header class="bg-dark-800 border-b border-dark-700 safe-area-top">
    <div class="flex items-center justify-between p-4">
      <div>
        <h1 class="text-xl font-bold text-white">Expenses</h1>
        <p class="text-sm text-dark-300">
          {$expenses.length} expenses • {formatCurrency(totalAmount)}
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
          on:click={openSummaryModal}
          aria-label="Financial Summary"
        >
          <i class="fas fa-chart-bar text-lg"></i>
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
            ? 'Start by taking photos of your receipts using the camera tab'
            : 'Try adjusting your search or filter criteria'
          }
        </p>
        {#if $expenses.length === 0}
          <button class="btn-accent">
            <i class="fas fa-camera mr-2"></i>
            Take Photo
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