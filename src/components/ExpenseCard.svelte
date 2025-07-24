<script>
  import { createEventDispatcher } from 'svelte';
  import { expenseCategories } from '../stores/appStore.js';
  
  export let expense;
  
  const dispatch = createEventDispatcher();
  
  $: category = $expenseCategories.find(cat => cat.id === expense.category);
  $: isLoading = expense.isLoading || false;
  
  let showMenu = false;
  
  function editExpense() {
    showMenu = false;
    dispatch('edit', expense);
  }
  
  function deleteExpense() {
    showMenu = false;
    dispatch('delete', expense.id);
  }
  
  function toggleMenu(event) {
    event.stopPropagation();
    showMenu = !showMenu;
  }
  
  function handleCardClick() {
    if (!isLoading) {
      editExpense();
    }
  }
  
  function closeMenu() {
    showMenu = false;
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

<div 
  class="card animate-fade-in cursor-pointer hover:bg-dark-750 transition-colors relative"
  class:opacity-75={isLoading}
  class:cursor-not-allowed={isLoading}
  class:hover:bg-dark-800={isLoading}
  on:click={handleCardClick}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3 flex-1 min-w-0">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
           class:bg-primary-600={!isLoading}
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
        <div class="relative">
          <button
            class="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-full transition-colors"
            on:click={toggleMenu}
            aria-label="More options"
          >
            <i class="fas fa-ellipsis-v text-sm"></i>
          </button>
          
          {#if showMenu}
            <div 
              class="absolute right-0 top-full mt-1 bg-dark-700 rounded-lg shadow-lg border border-dark-600 py-1 z-10 min-w-32"
              on:click|stopPropagation
            >
              <button
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-600 transition-colors flex items-center"
                on:click={editExpense}
              >
                <i class="fas fa-edit mr-3 text-primary-500"></i>
                Edit
              </button>
              <button
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-600 transition-colors flex items-center"
                on:click={deleteExpense}
              >
                <i class="fas fa-trash mr-3 text-error-500"></i>
                Delete
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

{#if showMenu}
  <div 
    class="fixed inset-0 z-0" 
    on:click={closeMenu}
  ></div>
{/if}