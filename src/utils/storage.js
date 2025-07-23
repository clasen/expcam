import { 
  tripData, 
  expenses, 
  financialSummary, 
  appSettings 
} from '../stores/appStore.js';
import { get } from 'svelte/store';

const STORAGE_KEYS = {
  TRIP_DATA: 'expense_app_trip_data',
  EXPENSES: 'expense_app_expenses',
  FINANCIAL_SUMMARY: 'expense_app_financial_summary',
  APP_SETTINGS: 'expense_app_settings'
};

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return defaultValue;
  }
}

export function clearStorage() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

export async function loadStoredData() {
  // Load trip data
  const storedTripData = loadFromStorage(STORAGE_KEYS.TRIP_DATA);
  if (storedTripData) {
    tripData.set(storedTripData);
  }
  
  // Load expenses
  const storedExpenses = loadFromStorage(STORAGE_KEYS.EXPENSES, []);
  expenses.set(storedExpenses);
  
  // Load financial summary
  const storedFinancialSummary = loadFromStorage(STORAGE_KEYS.FINANCIAL_SUMMARY);
  if (storedFinancialSummary) {
    financialSummary.set(storedFinancialSummary);
  }
  
  // Load app settings
  const storedSettings = loadFromStorage(STORAGE_KEYS.APP_SETTINGS);
  if (storedSettings) {
    appSettings.set(storedSettings);
  }
}

export function autoSave() {
  // Auto-save trip data
  tripData.subscribe(data => {
    saveToStorage(STORAGE_KEYS.TRIP_DATA, data);
  });
  
  // Auto-save expenses
  expenses.subscribe(data => {
    saveToStorage(STORAGE_KEYS.EXPENSES, data);
  });
  
  // Auto-save financial summary
  financialSummary.subscribe(data => {
    saveToStorage(STORAGE_KEYS.FINANCIAL_SUMMARY, data);
  });
  
  // Auto-save app settings
  appSettings.subscribe(data => {
    saveToStorage(STORAGE_KEYS.APP_SETTINGS, data);
  });
}