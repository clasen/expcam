<script>
  import { createEventDispatcher } from 'svelte';
  
  export let options = [];
  export let value = '';
  export let placeholder = 'Select option...';
  export let label = '';
  export let error = '';
  export let searchable = true;
  export let displayKey = 'name';
  export let valueKey = 'id';
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let searchTerm = '';
  let filteredOptions = options;
  let selectedOption = null;
  
  $: {
    // Find selected option
    selectedOption = options.find(opt => 
      (typeof opt === 'string' ? opt : opt[valueKey]) === value
    );
    
    // Filter options based on search
    if (searchTerm) {
      filteredOptions = options.filter(option => {
        const display = typeof option === 'string' ? option : option[displayKey];
        return display.toLowerCase().includes(searchTerm.toLowerCase());
      });
    } else {
      filteredOptions = options;
    }
  }
  
  function selectOption(option) {
    const optionValue = typeof option === 'string' ? option : option[valueKey];
    value = optionValue;
    dispatch('change', optionValue);
    isOpen = false;
    searchTerm = '';
  }
  
  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = '';
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

<div class="relative">
  {#if label}
    <label class="block text-sm font-medium text-dark-200 mb-2">
      {label}
    </label>
  {/if}
  
  <div class="relative">
    <button
      type="button"
      class="input-field text-left flex items-center justify-between w-full"
      class:border-error-500={error}
      on:click={toggleDropdown}
    >
      <span class="truncate">
        {selectedOption ? 
          (typeof selectedOption === 'string' ? selectedOption : selectedOption[displayKey]) : 
          placeholder
        }
      </span>
      <i class="fas fa-chevron-down transition-transform duration-200" 
         class:rotate-180={isOpen}></i>
    </button>
    
    {#if isOpen}
      <div class="absolute z-10 w-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
        {#if searchable}
          <div class="p-3 border-b border-dark-600">
            <input
              type="text"
              placeholder="Search..."
              bind:value={searchTerm}
              class="w-full bg-dark-800 border-dark-600 text-white placeholder-dark-400 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              on:keydown={handleKeydown}
            >
          </div>
        {/if}
        
        <div class="max-h-48 overflow-y-auto">
          {#each filteredOptions as option}
            <button
              type="button"
              class="w-full text-left px-4 py-3 hover:bg-dark-600 transition-colors duration-150 text-white"
              on:click={() => selectOption(option)}
            >
              {typeof option === 'string' ? option : option[displayKey]}
            </button>
          {:else}
            <div class="px-4 py-3 text-dark-400 text-sm">
              No options found
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  {#if error}
    <p class="error-message">{error}</p>
  {/if}
</div>

<!-- Close dropdown when clicking outside -->
{#if isOpen}
  <div 
    class="fixed inset-0 z-0" 
    on:click={() => isOpen = false}
    on:keydown={handleKeydown}
  ></div>
{/if}