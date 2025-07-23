<script>
  import { appSettings, financialSummary } from '../stores/appStore.js';
  import { clearStorage } from '../utils/storage.js';
  
  let showClearConfirm = false;
  
  function toggleSetting(setting) {
    appSettings.update(settings => ({
      ...settings,
      [setting]: !settings[setting]
    }));
  }
  
  function changeCurrency(event) {
    const currency = event.target.value;
    appSettings.update(settings => ({
      ...settings,
      currency
    }));
    financialSummary.update(summary => ({
      ...summary,
      selectedCurrency: currency
    }));
  }
  
  function confirmClearData() {
    showClearConfirm = true;
  }
  
  function clearAllData() {
    clearStorage();
    location.reload();
  }
  
  function exportData() {
    // TODO: Implement data export
    alert('Export functionality coming soon!');
  }
</script>

<div class="flex flex-col h-full bg-dark-900">
  <!-- Header -->
  <header class="bg-dark-800 border-b border-dark-700 safe-area-top">
    <div class="p-4">
      <h1 class="text-xl font-bold text-white">Settings</h1>
      <p class="text-sm text-dark-300">Manage your preferences</p>
    </div>
  </header>
  
  <!-- Content -->
  <main class="flex-1 overflow-y-auto pb-20">
    <div class="p-4 space-y-6">
      
      <!-- App Preferences -->
      <section class="card">
        <h2 class="text-lg font-semibold text-white mb-4">
          <i class="fas fa-cog mr-2 text-primary-500"></i>
          App Preferences
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-white">Dark Mode</h3>
              <p class="text-sm text-dark-400">Use dark theme</p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              class:bg-primary-600={$appSettings.darkMode}
              class:bg-dark-600={!$appSettings.darkMode}
              on:click={() => toggleSetting('darkMode')}
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                class:translate-x-6={$appSettings.darkMode}
                class:translate-x-1={!$appSettings.darkMode}
              ></span>
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-white">Auto Save</h3>
              <p class="text-sm text-dark-400">Automatically save changes</p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              class:bg-primary-600={$appSettings.autoSave}
              class:bg-dark-600={!$appSettings.autoSave}
              on:click={() => toggleSetting('autoSave')}
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                class:translate-x-6={$appSettings.autoSave}
                class:translate-x-1={!$appSettings.autoSave}
              ></span>
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-white">Notifications</h3>
              <p class="text-sm text-dark-400">Receive app notifications</p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              class:bg-primary-600={$appSettings.notifications}
              class:bg-dark-600={!$appSettings.notifications}
              on:click={() => toggleSetting('notifications')}
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                class:translate-x-6={$appSettings.notifications}
                class:translate-x-1={!$appSettings.notifications}
              ></span>
            </button>
          </div>
        </div>
      </section>
      
      <!-- Currency Settings -->
      <section class="card">
        <h2 class="text-lg font-semibold text-white mb-4">
          <i class="fas fa-dollar-sign mr-2 text-accent-500"></i>
          Currency
        </h2>
        
        <div>
          <label class="block text-sm font-medium text-dark-200 mb-2">
            Default Currency
          </label>
          <select
            class="input-field"
            value={$appSettings.currency}
            on:change={changeCurrency}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
      </section>
      
      <!-- Data Management -->
      <section class="card">
        <h2 class="text-lg font-semibold text-white mb-4">
          <i class="fas fa-database mr-2 text-secondary-500"></i>
          Data Management
        </h2>
        
        <div class="space-y-3">
          <button
            class="btn-secondary w-full"
            on:click={exportData}
          >
            <i class="fas fa-download mr-2"></i>
            Export Data
          </button>
          
          <button
            class="bg-error-600 hover:bg-error-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 active:scale-95 w-full"
            on:click={confirmClearData}
          >
            <i class="fas fa-trash mr-2"></i>
            Clear All Data
          </button>
        </div>
      </section>
      
      <!-- App Info -->
      <section class="card">
        <h2 class="text-lg font-semibold text-white mb-4">
          <i class="fas fa-info-circle mr-2 text-dark-400"></i>
          About
        </h2>
        
        <div class="space-y-2 text-sm text-dark-300">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Build:</strong> Mobile PWA</p>
          <p><strong>Framework:</strong> Svelte + Tailwind CSS</p>
        </div>
      </section>
      
    </div>
  </main>
</div>

<!-- Clear Data Confirmation -->
{#if showClearConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-dark-800 rounded-xl p-6 max-w-sm w-full">
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-4xl text-error-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-white mb-2">Clear All Data?</h3>
        <p class="text-dark-300 mb-6">
          This will permanently delete all your expenses, trip data, and settings. This action cannot be undone.
        </p>
        
        <div class="flex space-x-3">
          <button
            class="btn-secondary flex-1"
            on:click={() => showClearConfirm = false}
          >
            Cancel
          </button>
          <button
            class="bg-error-600 hover:bg-error-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 active:scale-95 flex-1"
            on:click={clearAllData}
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}