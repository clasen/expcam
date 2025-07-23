<script>
  import { onMount } from 'svelte';
  import { currentTab, currentScreen, expenses, tripData } from './stores/appStore.js';
  import { loadStoredData } from './utils/storage.js';
  
  import ExpensesScreen from './screens/ExpensesScreen.svelte';
  import CameraScreen from './screens/CameraScreen.svelte';
  import SettingsScreen from './screens/SettingsScreen.svelte';
  import TripDataScreen from './screens/TripDataScreen.svelte';
  import FinancialSummaryScreen from './screens/FinancialSummaryScreen.svelte';
  import ExpenseFormScreen from './screens/ExpenseFormScreen.svelte';
  import BottomNavigation from './components/BottomNavigation.svelte';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import Notification from './components/Notification.svelte';
  
  let isLoading = true;
  
  onMount(async () => {
    // Load stored data on app start
    await loadStoredData();
    isLoading = false;
  });
  
  // Determine which screen to show
  $: showMainScreens = $currentScreen === 'main';
  $: showTripData = $currentScreen === 'trip-data';
  $: showFinancialSummary = $currentScreen === 'financial-summary';
  $: showExpenseForm = $currentScreen === 'expense-form';
</script>

<div class="app min-h-screen bg-dark-900 text-white flex flex-col">
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  {:else}
    <!-- Main Content Area -->
    <main class="flex-1 overflow-hidden">
      {#if showMainScreens}
        {#if $currentTab === 'expenses'}
          <ExpensesScreen />
        {:else if $currentTab === 'camera'}
          <CameraScreen />
        {:else if $currentTab === 'settings'}
          <SettingsScreen />
        {/if}
      {:else if showTripData}
        <TripDataScreen />
      {:else if showFinancialSummary}
        <FinancialSummaryScreen />
      {:else if showExpenseForm}
        <ExpenseFormScreen extractedData={window.tempExtractedData} />
      {/if}
    </main>
    
    <!-- Bottom Navigation -->
    {#if showMainScreens}
      <BottomNavigation />
    {/if}
  {/if}

  <!-- Global Notification -->
  <Notification />
</div>

<style>
  .app {
    max-width: 100vw;
    position: relative;
  }
  
  @media (min-width: 768px) {
    .app {
      max-width: 480px;
      margin: 0 auto;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
  }
</style>