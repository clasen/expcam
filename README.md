## Project Overview

This is a Svelte-based expense tracking mobile web application called "expcam" that allows users to capture receipts via camera or file upload, process them with OCR simulation, and manage expense data. The app is built with Vite, uses Tailwind CSS for styling, and includes FontAwesome icons and the shotx library.

## Common Development Commands

- **Development server**: `npm run dev` - Starts Vite dev server with hot reload
- **Build for production**: `npm run build` - Creates optimized production build
- **Preview production build**: `npm run preview` - Serves the production build locally

## Architecture Overview

### Core Application Structure

The app follows a screen-based navigation pattern with a main container (`App.svelte`) that manages routing between different screens:

- **Navigation**: Controlled by `currentScreen` and `currentTab` stores
- **State Management**: Centralized in `src/stores/appStore.js` using Svelte stores
- **Storage**: Local storage persistence handled in `src/utils/storage.js`
- **OCR Processing**: Simulated OCR functionality in `src/utils/ocrSimulator.js`

### Key Screens and Components

**Main Screens** (accessible via bottom navigation):
- `ExpensesScreen.svelte` - Expense list and management
- `CameraScreen.svelte` - Receipt capture via camera or file upload  
- `SettingsScreen.svelte` - App configuration

**Modal/Overlay Screens**:
- `TripDataScreen.svelte` - Trip information form
- `FinancialSummaryScreen.svelte` - Expense summaries and export
- `ExpenseFormScreen.svelte` - Individual expense editing

**Reusable Components**:
- `BottomNavigation.svelte` - Main app navigation
- `ExpenseCard.svelte` - Individual expense display
- `LoadingSpinner.svelte` - Loading states
- `SearchableSelect.svelte` - Dropdown with search
- `TripDataForm.svelte` - Trip data input form
- `FinancialSummary.svelte` - Financial calculations display

### State Management

All application state is managed through Svelte stores in `appStore.js`:

- **Navigation**: `currentTab`, `currentScreen`, `editingExpense`
- **Data**: `expenses`, `tripData`, `financialSummary`
- **Configuration**: `expenseCategories`, `currencies`, `lodgingTypes`, `accountingCodes`
- **UI State**: `loadingStates`, `appSettings`

### Camera and OCR Integration

The camera functionality (`CameraScreen.svelte`) handles:
- Native camera access via `getUserMedia` API
- File upload fallback for unsupported browsers
- Integration with `ocrSimulator.js` for receipt processing
- Batch processing of multiple images

### Styling and Theming

- **Framework**: Tailwind CSS with custom color palette
- **Theme**: Dark mode design with custom dark color variants
- **Responsive**: Mobile-first design with desktop fallback (max-width: 480px)
- **Icons**: FontAwesome icons included via CDN

### Data Flow

1. **Receipt Capture**: Camera or file upload → OCR processing → extracted data
2. **Expense Creation**: Extracted data → `ExpenseFormScreen` → validation → store in `expenses`
3. **Data Persistence**: All stores auto-save to localStorage via `storage.js`
4. **Navigation**: Screen transitions managed by updating `currentScreen` store

### Key Utilities

- `storage.js`: Handles localStorage operations and data persistence
- `validation.js`: Form validation utilities

### Development Notes

- The app uses ES modules (`"type": "module"` in package.json)
- No test framework is currently configured
- Uses standard Vite + Svelte configuration without additional build tools