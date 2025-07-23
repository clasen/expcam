<script>
  import { createEventDispatcher } from 'svelte';
  import { tripData, lodgingTypes, accountingCodes } from '../stores/appStore.js';
  import { validateFormData, validateDateRange } from '../utils/validation.js';
  import SearchableSelect from './SearchableSelect.svelte';
  
  const dispatch = createEventDispatcher();
  
  let formData = { ...$tripData };
  let errors = {};
  
  const validationRules = {
    travelId: { required: true, label: 'Travel ID', type: 'custom', custom: (value) => {
      const numId = parseInt(value);
      if (isNaN(numId) || numId <= 0) {
        return 'Travel ID must be a positive number';
      }
      return null;
    }},
    fromDate: { required: true, label: 'From Date', type: 'date' },
    toDate: { required: true, label: 'To Date', type: 'date' },
    lodgingType: { required: true, label: 'Lodging Type' },
    accountingCode: { required: true, label: 'Accounting Code' }
  };
  
  $: {
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      formData.travelDays = diffDays;
    }
  }
  
  function handleSubmit() {
    errors = validateFormData(formData, validationRules) || {};
    
    // Additional date range validation
    if (formData.fromDate && formData.toDate) {
      const dateRangeError = validateDateRange(formData.fromDate, formData.toDate);
      if (dateRangeError) {
        errors.toDate = dateRangeError;
      }
    }
    
    if (Object.keys(errors).length === 0) {
      tripData.set(formData);
      dispatch('close');
    }
  }
  
  function handleCancel() {
    dispatch('close');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-1 gap-4">
    <!-- Travel ID -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Travel ID <span class="text-error-500">*</span>
      </label>
      <input
        type="number"
        bind:value={formData.travelId}
        placeholder="e.g., 2244"
        class="input-field"
        class:border-error-500={errors.travelId}
      >
      {#if errors.travelId}
        <p class="error-message">{errors.travelId}</p>
      {/if}
    </div>
    
    <!-- Date Range -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-dark-200 mb-2">
          From Date <span class="text-error-500">*</span>
        </label>
        <input
          type="date"
          bind:value={formData.fromDate}
          class="input-field"
          class:border-error-500={errors.fromDate}
        >
        {#if errors.fromDate}
          <p class="error-message">{errors.fromDate}</p>
        {/if}
      </div>
      
      <div>
        <label class="block text-sm font-medium text-dark-200 mb-2">
          To Date <span class="text-error-500">*</span>
        </label>
        <input
          type="date"
          bind:value={formData.toDate}
          class="input-field"
          class:border-error-500={errors.toDate}
        >
        {#if errors.toDate}
          <p class="error-message">{errors.toDate}</p>
        {/if}
      </div>
    </div>
    
    <!-- Travel Days (Auto-calculated) -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Travel Days
      </label>
      <input
        type="number"
        value={formData.travelDays}
        readonly
        class="input-field bg-dark-700 text-dark-300"
      >
    </div>
    
    <!-- Lodging Type -->
    <SearchableSelect
      label="Lodging Type *"
      options={$lodgingTypes}
      bind:value={formData.lodgingType}
      placeholder="Select lodging type..."
      error={errors.lodgingType}
    />
    
    <!-- Accounting Code -->
    <SearchableSelect
      label="Accounting Code *"
      options={$accountingCodes}
      bind:value={formData.accountingCode}
      placeholder="Select accounting code..."
      displayKey="name"
      valueKey="code"
      error={errors.accountingCode}
    />
    
    <!-- Expense Type -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Expense Type
      </label>
      <input
        type="text"
        bind:value={formData.expenseType}
        placeholder="e.g., Board Meeting Expense"
        class="input-field"
      >
    </div>
    
    <!-- Approving Manager -->
    <div>
      <label class="block text-sm font-medium text-dark-200 mb-2">
        Approving Manager
      </label>
      <input
        type="text"
        bind:value={formData.approvingManager}
        placeholder="Manager name and title"
        class="input-field"
      >
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
      Save Trip Data
    </button>
  </div>
</form>