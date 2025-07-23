<script>
  import { createEventDispatcher } from 'svelte';
  import { expenses, expenseCategories, currencies, editingExpense } from '../stores/appStore.js';
  import { validateFormData } from '../utils/validation.js';
  import SearchableSelect from './SearchableSelect.svelte';
  
  export let data = null;
  
  const dispatch = createEventDispatcher();
  
  $: isEditing = $editingExpense !== null;
  
  let formData = {
    merchant: data?.merchant || '',
    amount: data?.amount || '',
    currency: data?.currency || 'USD',
    date: data?.date || new Date().toISOString().split('T')[0],
    category: data?.category || '',
    description: data?.description || '',
    location: data?.location || '',
    receiptNumber: data?.receiptNumber || '',
    paymentMethod: data?.paymentMethod || 'Credit Card',
    taxAmount: data?.taxAmount || '',
    imageUrl: data?.imageUrl || null,
    imagePath: data?.imagePath || null
  };
  
  let errors = {};
  
  const validationRules = {
    merchant: { required: true, label: 'Merchant' },
    amount: { required: true, label: 'Amount', type: 'amount' },
    currency: { required: true, label: 'Currency' },
    date: { required: true, label: 'Date', type: 'date' },
    category: { required: true, label: 'Category' }
  };
  
  function handleSubmit() {
    errors = validateFormData(formData, validationRules) || {};
    
    if (Object.keys(errors).length === 0) {
      if (isEditing) {
        // Update existing expense
        const updatedExpense = {
          ...$editingExpense,
          ...formData,
          amount: parseFloat(formData.amount),
          taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : 0,
          updatedAt: new Date().toISOString()
        };
        
        expenses.update(list => 
          list.map(exp => exp.id === $editingExpense.id ? updatedExpense : exp)
        );
      } else {
        // Create new expense
        const newExpense = {
          id: Date.now() + Math.random(),
          ...formData,
          amount: parseFloat(formData.amount),
          taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : 0,
          createdAt: new Date().toISOString()
        };
        
        expenses.update(list => [...list, newExpense]);
      }
      dispatch('saved');
    }
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="space-y-4">
    <!-- Merchant -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Merchant <span class="text-error-500">*</span>
      </label>
      <input
        type="text"
        bind:value={formData.merchant}
        placeholder="e.g., Hotel Marriott"
        class="input-field"
        class:border-error-500={errors.merchant}
      >
      {#if errors.merchant}
        <p class="error-message">{errors.merchant}</p>
      {/if}
    </div>
    
    <!-- Amount and Currency -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-dark-200 mb-2">
          Amount <span class="text-error-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          bind:value={formData.amount}
          placeholder="0.00"
          class="input-field"
          class:border-error-500={errors.amount}
        >
        {#if errors.amount}
          <p class="error-message">{errors.amount}</p>
        {/if}
      </div>
      
      <SearchableSelect
        label="Currency *"
        options={$currencies}
        bind:value={formData.currency}
        displayKey="code"
        valueKey="code"
        error={errors.currency}
      />
    </div>
    
    <!-- Date -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Date <span class="text-error-500">*</span>
      </label>
      <input
        type="date"
        bind:value={formData.date}
        class="input-field"
        class:border-error-500={errors.date}
      >
      {#if errors.date}
        <p class="error-message">{errors.date}</p>
      {/if}
    </div>
    
    <!-- Category -->
    <SearchableSelect
      label="Category *"
      options={$expenseCategories}
      bind:value={formData.category}
      placeholder="Select category..."
      displayKey="name"
      valueKey="id"
      error={errors.category}
    />
    
    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Description
      </label>
      <textarea
        bind:value={formData.description}
        placeholder="Additional details..."
        rows="3"
        class="input-field resize-none"
      ></textarea>
    </div>
    
    <!-- Location -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Location
      </label>
      <input
        type="text"
        bind:value={formData.location}
        placeholder="e.g., New York, NY"
        class="input-field"
      >
    </div>
    
    <!-- Additional Details -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-dark-200 mb-2">
          Receipt Number
        </label>
        <input
          type="text"
          bind:value={formData.receiptNumber}
          placeholder="Receipt #"
          class="input-field"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-dark-200 mb-2">
          Tax Amount
        </label>
        <input
          type="number"
          step="0.01"
          bind:value={formData.taxAmount}
          placeholder="0.00"
          class="input-field"
        >
      </div>
    </div>
    
    <!-- Payment Method -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Payment Method
      </label>
      <select
        bind:value={formData.paymentMethod}
        class="input-field"
      >
        <option value="Credit Card">Credit Card</option>
        <option value="Debit Card">Debit Card</option>
        <option value="Cash">Cash</option>
        <option value="Bank Transfer">Bank Transfer</option>
        <option value="Other">Other</option>
      </select>
    </div>
  </div>
  
  <!-- Actions -->
  <div class="flex space-x-3 pt-2">
    <button
      type="button"
      class="btn-secondary flex-1"
      on:click={handleCancel}
    >
      Cancel
    </button>
    <button
      type="submit"
      class="btn-primary flex-1"
    >
      {isEditing ? 'Update Expense' : 'Save Expense'}
    </button>
  </div>
</form>