<script>
  import { createEventDispatcher } from 'svelte';
  import { expenses, expenseCategories, currencies, editingExpense } from '../stores/appStore.js';
  import { validateFormData } from '../utils/validation.js';
  import SearchableSelect from './SearchableSelect.svelte';
  
  export let data = null;
  
  const dispatch = createEventDispatcher();
  
  let showImageModal = false;
  
  $: isEditing = $editingExpense !== null;
  
  // Make formData reactive to data changes
  $: formData = {
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
    imageUrl: data?.imageUrl || null
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
          imageUrl: formData.imageUrl, // Preserve image URL
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
          imageUrl: formData.imageUrl, // Preserve image URL
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
  
  function openImageModal() {
    showImageModal = true;
  }
  
  function closeImageModal() {
    showImageModal = false;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <!-- Receipt Image Thumbnail -->
  {#if formData.imageUrl}
    <div class="bg-dark-800 rounded-lg p-3">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <img 
            src={formData.imageUrl} 
            alt="Receipt thumbnail" 
            class="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-dark-600"
            on:click={openImageModal}
          />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-dark-200 flex items-center">
            <i class="fas fa-image mr-2 text-primary-500"></i>
            Receipt Image
          </h3>
          <button
            type="button"
            class="text-xs text-dark-400 hover:text-primary-500 transition-colors mt-1"
            on:click={openImageModal}
          >
            <i class="fas fa-search-plus mr-1"></i>
            Click to view
          </button>
        </div>
      </div>
    </div>
  {/if}

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
      {isEditing ? 'Update' : 'Save'}
    </button>
  </div>
</form>

<!-- Image Modal -->
{#if showImageModal && formData.imageUrl}
  <div 
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    on:click={closeImageModal}
  >
    <div class="relative max-w-4xl max-h-full">
      <!-- Close button -->
      <button
        class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors text-xl"
        on:click={closeImageModal}
        aria-label="Close modal"
      >
        <i class="fas fa-times"></i>
      </button>
      
      <!-- Image -->
      <img 
        src={formData.imageUrl} 
        alt="Receipt full size" 
        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        on:click|stopPropagation
      />
      
      <!-- Download/Open button -->
      <div class="absolute -bottom-12 left-0 right-0 flex justify-center space-x-4">
        <button
          type="button"
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          on:click={() => window.open(formData.imageUrl, '_blank')}
        >
          <i class="fas fa-external-link-alt mr-2"></i>
          Open in new tab
        </button>
      </div>
    </div>
  </div>
{/if}