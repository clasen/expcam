<script>
  export let size = 'medium'; // small, medium, large
  export let color = 'primary'; // primary, secondary, accent
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'border-t-primary-500',
    secondary: 'border-t-secondary-500',
    accent: 'border-t-accent-500'
  };
</script>

<div class="flex items-center justify-center">
  <div 
    class="loading-spinner {sizeClasses[size]} {colorClasses[color]}"
    role="status"
    aria-label="Loading"
  >
    <span class="sr-only">Loading...</span>
  </div>
</div>