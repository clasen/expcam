<script>
  import { createEventDispatcher } from 'svelte';
  import { expenseCategories } from '../stores/appStore.js';
  
  export let expense;
  
  const dispatch = createEventDispatcher();
  
  $: category = $expenseCategories.find(cat => cat.id === expense.category);
  
  function editExpense() {
    dispatch('edit', expense);
  }
  
  function deleteExpense() {
    dispatch('delete', expense.id);
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

<div class="card animate-fade-in">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
        <i class="fas {category?.icon || 'fa-receipt'} text-white"></i>
      </div>
      <div>
        <h3 class="font-semibold text-white">{expense.merchant}</h3>
        <p class="text-sm text-dark-300">{category?.name || 'Other'}</p>
      </div>
    </div>
    <div class="text-right flex-shrink-0">
      <p class="font-bold text-lg text-accent-500">
        {formatCurrency(expense.amount, expense.currency)}
      </p>
      <p class="text-xs text-dark-400">{expense.date}</p>
    </div>
  </div>
  
  <div class="flex space-x-2 mt-3">
    <button
      class="btn-secondary flex-1 py-2 text-sm"
      on:click={editExpense}
    >
      <i class="fas fa-edit mr-2"></i>
      Edit
    </button>
    <button
      class="bg-error-600 hover:bg-error-700 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 active:scale-95"
      on:click={deleteExpense}
    >
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>