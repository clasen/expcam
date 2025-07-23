<script>
  import { onMount } from 'svelte';
  import { notification } from '../stores/appStore.js';
  
  let visible = false;
  let timeoutId;
  
  $: if ($notification) {
    showNotification();
  }
  
  function showNotification() {
    visible = true;
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Auto-hide after duration
    timeoutId = setTimeout(() => {
      hideNotification();
    }, $notification?.duration || 3000);
  }
  
  function hideNotification() {
    visible = false;
    setTimeout(() => {
      notification.set(null);
    }, 300); // Wait for animation to complete
  }
  
  onMount(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });
</script>

{#if $notification && visible}
  <div 
    class="fixed top-4 left-4 right-4 z-50 animate-slide-up"
    class:notification-success={$notification.type === 'success'}
    class:notification-error={$notification.type === 'error'}
    class:notification-info={$notification.type === 'info'}
  >
    <div class="flex items-center p-4 rounded-lg shadow-lg backdrop-blur-sm">
      <div class="flex-shrink-0 mr-3">
        {#if $notification.type === 'success'}
          <i class="fas fa-check-circle text-xl"></i>
        {:else if $notification.type === 'error'}
          <i class="fas fa-exclamation-circle text-xl"></i>
        {:else}
          <i class="fas fa-info-circle text-xl"></i>
        {/if}
      </div>
      
      <div class="flex-1">
        <p class="font-medium text-white">{$notification.message}</p>
      </div>
      
      <button
        class="flex-shrink-0 ml-3 text-white hover:text-gray-300 transition-colors"
        on:click={hideNotification}
        aria-label="Close notification"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
{/if}

<style>
  .notification-success {
    @apply bg-success-600 bg-opacity-90;
  }
  
  .notification-error {
    @apply bg-error-600 bg-opacity-90;
  }
  
  .notification-info {
    @apply bg-primary-600 bg-opacity-90;
  }
</style>