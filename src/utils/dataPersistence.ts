// Data persistence and debugging utilities

// Store data in localStorage with expiration
export const persistData = (key: string, data: any, expirationMinutes: number = 60) => {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (expirationMinutes * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
    console.log(`Data persisted: ${key}`, data);
  } catch (error) {
    console.error(`Failed to persist data for key ${key}:`, error);
  }
};

// Retrieve data from localStorage with expiration check
export const retrieveData = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      console.log(`Expired data removed: ${key}`);
      return null;
    }

    console.log(`Data retrieved: ${key}`, parsed.data);
    return parsed.data;
  } catch (error) {
    console.error(`Failed to retrieve data for key ${key}:`, error);
    return null;
  }
};

// Clear expired data from localStorage
export const clearExpiredData = () => {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;

    keys.forEach(key => {
      if (key.startsWith('app_data_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (Date.now() > parsed.expiresAt) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          } catch (error) {
            // Remove invalid items
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      }
    });

    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired data items`);
    }
  } catch (error) {
    console.error('Failed to clear expired data:', error);
  }
};

// Monitor data fetching operations
export const createDataMonitor = (operationName: string) => {
  const startTime = Date.now();
  
  return {
    success: (data: any) => {
      const duration = Date.now() - startTime;
      console.log(`✅ ${operationName} completed in ${duration}ms`, data);
      
      // Persist successful data
      persistData(`app_data_${operationName}`, data, 30);
    },
    error: (error: any) => {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
      
      // Try to retrieve fallback data
      const fallback = retrieveData(`app_data_${operationName}`);
      if (fallback) {
        console.log(`🔄 Using fallback data for ${operationName}:`, fallback);
        return fallback;
      }
      
      throw error;
    },
    loading: () => {
      console.log(`⏳ ${operationName} in progress...`);
    }
  };
};

// Check if user is online
export const isOnline = () => {
  return navigator.onLine;
};

// Network status monitoring
export const createNetworkMonitor = () => {
  const handleOnline = () => {
    console.log('🌐 Network: Online');
    // Trigger data refresh when coming back online
    window.dispatchEvent(new CustomEvent('network-online'));
  };

  const handleOffline = () => {
    console.log('📡 Network: Offline');
    // Show offline indicator
    window.dispatchEvent(new CustomEvent('network-offline'));
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Debounce function for API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Initialize data persistence utilities
export const initializeDataPersistence = () => {
  // Clear expired data on app start
  clearExpiredData();
  
  // Set up network monitoring
  const cleanupNetworkMonitor = createNetworkMonitor();
  
  // Clean up expired data every 5 minutes
  const cleanupInterval = setInterval(clearExpiredData, 5 * 60 * 1000);
  
  return () => {
    cleanupNetworkMonitor();
    clearInterval(cleanupInterval);
  };
};