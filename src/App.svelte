<script>
    import { onMount } from "svelte";
    import {
        currentTab,
        currentScreen,
        expenses,
        currencies,
        appSettings,
    } from "./stores/appStore.js";
    import { loadStoredData } from "./utils/storage.js";
    import SxClient from "shotx/client";

    let apiUrl = "https://api.excam.tagnu.com"; // fallback
    let sx = null;

    onMount(async () => {
        // Cargar configuración del servidor
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            apiUrl = config.domainApi;
            console.log('API URL loaded:', apiUrl);
        } catch (error) {
            console.warn('Failed to load config, using fallback:', error);
        }

        // Inicializar SxClient con la URL correcta
        sx = new SxClient(apiUrl);
        sx.connect();

        // Load stored data on app start
        await loadStoredData();
        isLoading = false;

        // Listen for files selected from bottom navigation
        const handleFilesSelected = async (event) => {
            console.log("Files selected event received:", event.detail);
            const files = event.detail;
            if (files && files.length > 0) {
                if (files.length === 1) {
                    console.log("Processing single image:", files[0].name);
                    await processImage(files[0]);
                } else {
                    console.log("Processing batch images:", files.length);
                    await processBatchFiles(files);
                }
            }
        };

        window.addEventListener("filesSelected", handleFilesSelected);

        return () => {
            window.removeEventListener("filesSelected", handleFilesSelected);
        };
    });

    async function processImage(file) {
        console.log("Starting processing for:", file.name);

        // Create loading placeholder expense
        const tempId = Date.now() + Math.random();
        const loadingExpense = {
            id: tempId,
            merchant: "",
            amount: 0,
            currency: "...",
            date: new Date().toISOString().split("T")[0],
            hour: "",
            category: "",
            description: "",
            location: "",
            receiptNumber: "",
            paymentMethod: "",
            imageUrl: null,
            isLoading: true,
            createdAt: new Date().toISOString(),
        };

        // Add placeholder to expenses list immediately
        expenses.update((list) => [loadingExpense, ...list]);

        // Process in background
        try {
            // Try to process image on client side, fallback to original if it fails
            let fileToSend;
            try {
                fileToSend = await processImageFile(file);
                // console.log("Image processed successfully");
            } catch (processingError) {
                // console.warn("Image processing failed, using original file:", processingError);
                fileToSend = file; // Use original file if processing fails
            }
            
            // Try server first, fall back to simulator
            const result = await sx.send("process_receipt", fileToSend);

            if (result.success) {
                // Update the placeholder with real data and validate currency
                const processedExpense = {
                    id: tempId, // Keep same ID
                    ...result.data,
                    currency: validateCurrency(result.data.currency),
                    isLoading: false,
                    createdAt: new Date().toISOString(),
                };

                expenses.update((list) =>
                    list.map((exp) =>
                        exp.id === tempId ? processedExpense : exp,
                    ),
                );
            } else {
                // Remove failed placeholder
                expenses.update((list) =>
                    list.filter((exp) => exp.id !== tempId),
                );
            }
        } catch (error) {
            console.error("OCR processing error:", error);
            // Remove failed placeholder
            expenses.update((list) => list.filter((exp) => exp.id !== tempId));
        }
    }

    async function processBatchFiles(files) {
        // console.log("Starting batch processing for:", files.length, "files");

        // Create loading placeholders for all files
        const placeholders = files.map((file, index) => ({
            id: Date.now() + Math.random() + index,
            merchant: "",
            amount: 0,
            currency: "...",
            date: new Date().toISOString().split("T")[0],
            hour: "",
            category: "",
            description: "",
            location: "",
            receiptNumber: "",
            paymentMethod: "",
            imageUrl: null,
            isLoading: true,
            createdAt: new Date().toISOString(),
        }));

        // Add all placeholders to expenses list immediately
        expenses.update((list) => [...placeholders, ...list]);

        // Process each file in background
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const placeholder = placeholders[i];

            try {
                // Try to process image on client side, fallback to original if it fails
                let fileToSend;
                try {
                    fileToSend = await processImageFile(file);
                    console.log("Batch image processed successfully:", file.name);
                } catch (processingError) {
                    console.warn("Batch image processing failed for", file.name, ", using original file:", processingError);
                    fileToSend = file; // Use original file if processing fails
                }
                
                // Try server first, fall back to simulator
                const result = await sx.send("process_receipt", fileToSend);
                console.log("Server result for", file.name, ":", result);

                if (result.success) {
                    // Update placeholder with real data and validate currency
                    const processedExpense = {
                        id: placeholder.id, // Keep same ID
                        ...result.data,
                        currency: validateCurrency(result.data.currency),
                        isLoading: false,
                        createdAt: new Date().toISOString(),
                    };

                    expenses.update((list) =>
                        list.map((exp) =>
                            exp.id === placeholder.id ? processedExpense : exp,
                        ),
                    );
                } else {
                    // Remove failed placeholder
                    expenses.update((list) =>
                        list.filter((exp) => exp.id !== placeholder.id),
                    );
                }
            } catch (error) {
                console.error("Error processing", file.name, ":", error);
                // Remove failed placeholder
                expenses.update((list) =>
                    list.filter((exp) => exp.id !== placeholder.id),
                );
            }
        }
    }

    // Function to validate and normalize currency
    function validateCurrency(currency) {
        if (!currency) return "...";

        // Get current supported currencies
        let supportedCurrencies = [];
        currencies.subscribe((currencyList) => {
            supportedCurrencies = currencyList.map((c) => c.code);
        })();

        // If currency is supported, return it; otherwise return '...'
        return supportedCurrencies.includes(currency) ? currency : "...";
    }

    // Function to process image on client side (compress and convert to JPG)
    async function processImageFile(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Calculate new dimensions (max 2560px on longest side)
                const maxSize = 2560;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob with compression
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create a new File object with JPG extension
                        const processedFile = new File([blob], 
                            file.name.replace(/\.[^/.]+$/, '.jpg'), 
                            { type: 'image/jpeg' }
                        );
                        resolve(processedFile);
                    } else {
                        reject(new Error('Failed to process image'));
                    }
                }, 'image/jpeg', 0.8); // 80% quality
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    import ExpensesScreen from "./screens/ExpensesScreen.svelte";
    import CameraScreen from "./screens/CameraScreen.svelte";
    import SettingsScreen from "./screens/SettingsScreen.svelte";
    import TripDataScreen from "./screens/TripDataScreen.svelte";
    import FinancialSummaryScreen from "./screens/FinancialSummaryScreen.svelte";
    import ExpenseFormScreen from "./screens/ExpenseFormScreen.svelte";
    import BottomNavigation from "./components/BottomNavigation.svelte";
    import LoadingSpinner from "./components/LoadingSpinner.svelte";

    let isLoading = true;

    // Determine which screen to show
    $: showMainScreens = $currentScreen === "main";
    $: showTripData = $currentScreen === "trip-data";
    $: showFinancialSummary = $currentScreen === "financial-summary";
    $: showExpenseForm = $currentScreen === "expense-form";
    
    // Apply theme based on settings
    $: if (typeof document !== 'undefined') {
        if ($appSettings.darkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }
</script>

<div class="app min-h-screen flex flex-col transition-colors duration-200" 
     class:bg-dark-900={$appSettings.darkMode} 
     class:text-white={$appSettings.darkMode}
     class:bg-gray-100={!$appSettings.darkMode}
     class:text-gray-900={!$appSettings.darkMode}>
    {#if isLoading}
        <div class="flex-1 flex items-center justify-center">
            <LoadingSpinner size="large" />
        </div>
    {:else}
        <!-- Main Content Area -->
        <main class="flex-1 overflow-hidden">
            {#if showMainScreens}
                {#if $currentTab === "expenses"}
                    <ExpensesScreen />
                {:else if $currentTab === "camera"}
                    <CameraScreen />
                {:else if $currentTab === "settings"}
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
