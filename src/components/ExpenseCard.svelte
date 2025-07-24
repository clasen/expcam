<script>
  import { createEventDispatcher } from 'svelte';
  import { expenseCategories } from '../stores/appStore.js';
  
  export let expense;
  
  const dispatch = createEventDispatcher();
  
  $: category = $expenseCategories.find(cat => cat.id === expense.category);
  $: isLoading = expense.isLoading || false;
  
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

<div class="card animate-fade-in" class:opacity-75={isLoading}>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center" 
           class:bg-primary-600={!isLoading}
           class:bg-dark-600={isLoading}>
        {#if isLoading}
          <div class="w-4 h-4 border-2 border-dark-400 border-t-primary-500 rounded-full animate-spin"></div>
        {:else}
          <i class="fas {category?.icon || 'fa-receipt'} text-white"></i>
        {/if}
      </div>
      <div>
        {#if isLoading}
          <div class="h-5 bg-dark-600 rounded animate-pulse w-32 mb-1"></div>
          <div class="h-4 bg-dark-700 rounded animate-pulse w-20"></div>
        {:else}
          <h3 class="font-semibold text-white">{expense.merchant}</h3>
          <p class="text-sm text-dark-300">{category?.name || 'Other'}</p>
        {/if}
      </div>
    </div>
    <div class="text-right flex-shrink-0">
      {#if isLoading}
        <div class="h-6 bg-dark-600 rounded animate-pulse w-20 mb-1"></div>
        <div class="h-3 bg-dark-700 rounded animate-pulse w-16"></div>
      {:else}
        <p class="font-bold text-lg text-accent-500">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        <p class="text-xs text-dark-400">{expense.date}</p>
      {/if}
    </div>
  </div>
  
  <div class="flex space-x-2 mt-3">
    <button
      class="btn-secondary flex-1 py-2 text-sm"
      disabled={isLoading}
      class:opacity-50={isLoading}
      class:cursor-not-allowed={isLoading}
      on:click={editExpense}
    >
      <i class="fas fa-edit mr-2"></i>
      Edit
    </button>
    <button
      class="bg-error-600 hover:bg-error-700 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 active:scale-95"
      disabled={isLoading}
      class:opacity-50={isLoading}
      class:cursor-not-allowed={isLoading}
      on:click={deleteExpense}
    >
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>