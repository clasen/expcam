<script>
  import { createEventDispatcher } from 'svelte';
  import { expenseCategories } from '../stores/appStore.js';
  
  export let expense;
  export let isSelected = false;
  
  const dispatch = createEventDispatcher();
  
  $: category = $expenseCategories.find(cat => cat.id === expense.category);
  $: isLoading = expense.isLoading || false;
  
  // Check if expense is incomplete (missing required fields)
  $: isIncomplete = !isLoading && (
    !expense.merchant || 
    !expense.amount || 
    expense.amount === 0 ||
    !expense.currency || 
    expense.currency === '...' ||
    !expense.date || 
    !expense.category
  );
  
  function editExpense() {
    dispatch('edit', expense);
  }
  
  function handleCheckboxChange(event) {
    event.stopPropagation();
    event.preventDefault();
    dispatch('select', { expense, selected: event.target.checked });
  }
  
  function handleCardClick() {
    if (!isLoading) {
      editExpense();
    }
  }
  
  function formatCurrency(amount, currency = 'USD') {
    if (currency === '...') {
      return `... ${amount.toFixed(2)}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  }
</script>

<div 
  class="card animate-fade-in cursor-pointer hover:bg-dark-750 transition-colors relative"
  class:opacity-75={isLoading}
  class:cursor-not-allowed={isLoading}
  class:hover:bg-dark-800={isLoading}
  class:border-l-2={isIncomplete}
  class:border-l-yellow-500={isIncomplete}
  class:border-opacity-60={isIncomplete}
  on:click={handleCardClick}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3 flex-1 min-w-0">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative" 
           class:bg-primary-600={!isLoading && !isIncomplete}
           class:bg-yellow-600={!isLoading && isIncomplete}
           class:bg-dark-600={isLoading}>
        {#if isLoading}
          <div class="w-4 h-4 border-2 border-dark-400 border-t-primary-500 rounded-full animate-spin"></div>
        {:else}
          <i class="fas {category?.icon || 'fa-receipt'} text-white"></i>
        {/if}
      </div>
      <div class="flex-1 min-w-0">
        {#if isLoading}
          <div class="h-5 bg-dark-600 rounded animate-pulse w-32 mb-1"></div>
          <div class="h-4 bg-dark-700 rounded animate-pulse w-20"></div>
        {:else}
          <h3 class="font-semibold text-white truncate">{expense.merchant}</h3>
          <p class="text-sm text-dark-300">{category?.name || 'Other'}</p>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center space-x-3">
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
      
      {#if !isLoading}
        <div class="flex items-center" on:click|stopPropagation>
          <input
            type="checkbox"
            checked={isSelected}
            on:change={handleCheckboxChange}
            on:click|stopPropagation
            class="w-5 h-5 text-primary-600 bg-transparent border-2 border-gray-400 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
            aria-label="Select expense"
          />
        </div>
      {/if}
    </div>
  </div>
</div>

