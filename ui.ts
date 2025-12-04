/**
 * UI Helper Functions
 * Provides toast/alert notifications and loader functionality
 */

let loaderElement: HTMLElement | null = null;
let alertElement: HTMLElement | null = null;

/**
 * Show a loading indicator
 */
export function showLoader(message: string = 'Loading...') {
  // Remove existing loader if any
  hideLoader();

  // Create loader element
  loaderElement = document.createElement('div');
  loaderElement.id = 'app-loader';
  loaderElement.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loaderElement.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg flex flex-col items-center gap-4">
      <div class="spinner w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin"></div>
      <p class="text-gray-700 dark:text-gray-300 font-medium">${message}</p>
    </div>
  `;
  document.body.appendChild(loaderElement);
}

/**
 * Hide the loading indicator
 */
export function hideLoader() {
  if (loaderElement && loaderElement.parentElement) {
    loaderElement.parentElement.removeChild(loaderElement);
    loaderElement = null;
  }
}

/**
 * Show an alert/toast notification
 */
export function showAlert(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  // Remove existing alert if any
  if (alertElement && alertElement.parentElement) {
    alertElement.parentElement.removeChild(alertElement);
  }

  // Create alert element
  alertElement = document.createElement('div');
  alertElement.id = 'app-alert';
  
  // Determine styling based on type
  let bgColor = 'bg-blue-50 dark:bg-blue-900';
  let borderColor = 'border-blue-200 dark:border-blue-700';
  let textColor = 'text-blue-800 dark:text-blue-200';
  let iconColor = 'text-blue-500';
  
  switch (type) {
    case 'success':
      bgColor = 'bg-green-50 dark:bg-green-900';
      borderColor = 'border-green-200 dark:border-green-700';
      textColor = 'text-green-800 dark:text-green-200';
      iconColor = 'text-green-500';
      break;
    case 'warning':
      bgColor = 'bg-yellow-50 dark:bg-yellow-900';
      borderColor = 'border-yellow-200 dark:border-yellow-700';
      textColor = 'text-yellow-800 dark:text-yellow-200';
      iconColor = 'text-yellow-500';
      break;
    case 'error':
      bgColor = 'bg-red-50 dark:bg-red-900';
      borderColor = 'border-red-200 dark:border-red-700';
      textColor = 'text-red-800 dark:text-red-200';
      iconColor = 'text-red-500';
      break;
  }
  
  alertElement.className = `fixed top-4 right-4 max-w-md z-50 ${bgColor} ${borderColor} ${textColor} px-4 py-4 rounded-lg border shadow-lg`;
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };
  
  alertElement.innerHTML = `
    <div class="flex gap-3">
      <div class="flex-shrink-0 text-xl font-bold ${iconColor}">
        ${getIcon()}
      </div>
      <div class="flex-1">
        <h3 class="font-semibold">${title}</h3>
        <p class="text-sm mt-1">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-lg font-bold opacity-50 hover:opacity-100">×</button>
    </div>
  `;
  
  document.body.appendChild(alertElement);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (alertElement && alertElement.parentElement) {
      alertElement.parentElement.removeChild(alertElement);
      alertElement = null;
    }
  }, 5000);
}
