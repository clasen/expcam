<script>
  import { currentTab } from '../stores/appStore.js';
  
  const tabs = [
    { id: 'expenses', icon: 'fas fa-receipt', label: 'Expenses' },
    { id: 'camera', icon: 'fas fa-upload', label: 'Upload' },
    { id: 'settings', icon: 'fas fa-cog', label: 'Settings' }
  ];
  
  function switchTab(tabId) {
    // If camera tab is clicked, trigger file picker and navigate to expenses
    if (tabId === 'camera') {
      currentTab.set('expenses');
      triggerFileUpload();
    } else {
      currentTab.set(tabId);
    }
  }
  
  function triggerFileUpload() {
    console.log('Triggering file upload from bottom navigation');
    // Create a hidden file input and trigger it
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
      const files = Array.from(event.target.files);
      console.log('Files selected in bottom nav:', files.length);
      if (files.length > 0) {
        // Dispatch a custom event with the selected files
        console.log('Dispatching filesSelected event');
        window.dispatchEvent(new CustomEvent('filesSelected', { detail: files }));
      }
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }
</script>

<nav class="bg-dark-800 border-t border-dark-700 safe-area-bottom">
  <div class="flex justify-around items-center py-2 px-4">
    {#each tabs as tab}
      <button
        class="nav-tab {$currentTab === tab.id ? 'active' : ''}"
        on:click={() => switchTab(tab.id)}
        aria-label={tab.label}
      >
        <i class="{tab.icon} text-2xl"></i>
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