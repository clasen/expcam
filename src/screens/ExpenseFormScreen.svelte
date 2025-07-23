<script>
  import { currentScreen, editingExpense } from '../stores/appStore.js';
  import ExpenseForm from '../components/ExpenseForm.svelte';
  
  export let extractedData = null;
  
  $: formData = $editingExpense || extractedData;
  
  
  function goBack() {
    editingExpense.set(null);
    currentScreen.set('main');
  }
  
  function handleSaved() {
    editingExpense.set(null);
    currentScreen.set('main');
  }
</script>

<div class="flex flex-col h-full bg-dark-900">
  <!-- Header -->
  <header class="bg-dark-800 border-b border-dark-700 safe-area-top">
    <div class="flex items-center p-4">
      <button
        class="p-2 text-dark-400 hover:text-white transition-colors mr-3"
        on:click={goBack}
        aria-label="Go back"
      >
        <i class="fas fa-arrow-left text-xl"></i>
      </button>
      <div>
        <h1 class="text-xl font-bold text-white">Review Expense</h1>
        <p class="text-sm text-dark-300">Verify and save expense details</p>
      </div>
    </div>
  </header>
  
  <!-- Content -->
  <main class="flex-1 overflow-y-auto p-4 pb-20">
    <ExpenseForm 
      data={formData}
      on:saved={handleSaved}
      on:cancel={goBack}
    />
  </main>
</div>