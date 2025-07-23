<script>
  import { currentTab } from '../stores/appStore.js';
  import { onMount } from 'svelte';
  
  let showCameraClose = false;
  
  // Listen for camera state changes
  onMount(() => {
    const checkCameraState = () => {
      // Check if camera is active by looking for video element
      const videoElement = document.querySelector('video');
      showCameraClose = videoElement && videoElement.srcObject;
    };
    
    // Check periodically
    const interval = setInterval(checkCameraState, 500);
    
    return () => clearInterval(interval);
  });
  
  const tabs = [
    { id: 'expenses', icon: 'fas fa-receipt', label: 'Expenses' },
    { id: 'camera', icon: 'fas fa-camera', label: 'Camera' },
    { id: 'settings', icon: 'fas fa-cog', label: 'Settings' }
  ];
  
  function switchTab(tabId) {
    currentTab.set(tabId);
  }
  
  function closeCamera() {
    // Dispatch custom event to close camera
    window.dispatchEvent(new CustomEvent('closeCamera'));
  }
</script>

<nav class="bg-dark-800 border-t border-dark-700 safe-area-bottom">
  <div class="flex justify-around items-center py-2 px-4">
    {#each tabs as tab}
      <button
        class="nav-tab {$currentTab === tab.id ? 'active' : ''}"
        on:click={() => {
          if (tab.id === 'camera' && showCameraClose) {
            closeCamera();
          } else {
            switchTab(tab.id);
          }
        }}
        aria-label={tab.label}
      >
        {#if tab.id === 'camera' && showCameraClose}
          <i class="fas fa-times text-2xl text-dark-400"></i>
        {:else}
          <i class="{tab.icon} text-2xl"></i>
        {/if}
      </button>
    {/each}
  </div>
</nav>

<style>
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
  }
  
  @media (min-width: 768px) {
    nav {
      position: relative;
    }
  }
</style>