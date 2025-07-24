<script>
    import { onMount } from "svelte";
    import {
        currentTab,
        currentScreen,
        expenses,
        tripData,
        currencies,
    } from "./stores/appStore.js";
    import { loadStoredData } from "./utils/storage.js";
    import SxClient from "shotx/client";

    const sx = new SxClient();
    sx.connect();

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

    import ExpensesScreen from "./screens/ExpensesScreen.svelte";
    import CameraScreen from "./screens/CameraScreen.svelte";
    import SettingsScreen from "./screens/SettingsScreen.svelte";
    import TripDataScreen from "./screens/TripDataScreen.svelte";
    import FinancialSummaryScreen from "./screens/FinancialSummaryScreen.svelte";
    import ExpenseFormScreen from "./screens/ExpenseFormScreen.svelte";
    import BottomNavigation from "./components/BottomNavigation.svelte";
    import LoadingSpinner from "./components/LoadingSpinner.svelte";

    let isLoading = true;

    onMount(async () => {
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
            // Try server first, fall back to simulator
            const result = await sx.send("process_receipt", file);

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
        console.log("Starting batch processing for:", files.length, "files");

        // Create loading placeholders for all files
        const placeholders = files.map((file, index) => ({
            id: Date.now() + Math.random() + index,
            merchant: "",
            amount: 0,
            currency: "...",
            date: new Date().toISOString().split("T")[0],
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
                // Try server first, fall back to simulator
                const result = await sx.send("process_receipt", file);
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

    // Determine which screen to show
    $: showMainScreens = $currentScreen === "main";
    $: showTripData = $currentScreen === "trip-data";
    $: showFinancialSummary = $currentScreen === "financial-summary";
    $: showExpenseForm = $currentScreen === "expense-form";
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
