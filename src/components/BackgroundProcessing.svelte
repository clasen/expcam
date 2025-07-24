<script>
  import { backgroundProcessing } from '../stores/appStore.js';
  
  $: activeTasks = $backgroundProcessing.filter(task => task.status === 'processing');
  $: hasActiveTasks = activeTasks.length > 0;
</script>

{#if hasActiveTasks}
  <div class="fixed top-20 right-4 z-40 bg-dark-800 rounded-lg shadow-lg border border-dark-700 p-3 animate-slide-up">
    <div class="flex items-center space-x-3">
      <div class="flex-shrink-0">
        <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white">
          Processing {activeTasks.length} receipt{activeTasks.length > 1 ? 's' : ''}
        </p>
        <div class="space-y-1 mt-1">
          {#each activeTasks.slice(0, 2) as task}
            <p class="text-xs text-dark-300 truncate">
              {task.fileName}
            </p>
          {/each}
          {#if activeTasks.length > 2}
            <p class="text-xs text-dark-400">
              +{activeTasks.length - 2} more...
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}