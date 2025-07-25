import { writable } from 'svelte/store';

// Navigation
export const currentTab = writable('expenses');
export const currentScreen = writable('main'); // main, trip-data, financial-summary, expense-form
export const editingExpense = writable(null);

// Trip Data
export const tripData = writable({
  travelId: '',
  fromDate: '',
  toDate: '',
  travelDays: 0,
  accountingCode: '',
  approvingManager: ''
});

// Expenses
export const expenses = writable([]);

// Categories (can be loaded from API)
export const expenseCategories = writable([
  { id: 'lodging', name: 'Lodging', icon: 'fa-bed' },
  { id: 'transport', name: 'Transport', icon: 'fa-car' },
  { id: 'meals', name: 'Meals', icon: 'fa-utensils' },
  { id: 'miscellaneous', name: 'Miscellaneous', icon: 'fa-ellipsis-h' },
  { id: 'purchases', name: 'Purchases', icon: 'fa-shopping-bag' },
  { id: 'other', name: 'Other', icon: 'fa-question-circle' }
]);

// Currencies
export const currencies = writable([
  { code: '...', name: 'No detectada', symbol: '...', rate: 1.0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.75 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 350.0 }
]);

// Accounting Codes
export const accountingCodes = writable([
  { code: 'CC-PT-SS', name: 'Cost Center - PT - System/Subsystem' },
  { code: 'WP', name: 'Work Package' }
]);

// Financial Summary
export const financialSummary = writable({
  totalAmount: 0,
  advanceReceived: 0,
  amountToRefund: 0,
  selectedCurrency: 'USD'
});

// App Settings
export const appSettings = writable({
  darkMode: true,
  currency: 'USD',
});

// Loading States
export const loadingStates = writable({
  ocr: false,
  saving: false,
  exporting: false
});

