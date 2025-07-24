<script>
  import { onMount } from "svelte";
  import { expenses } from "../stores/appStore.js";

  import SxClient from "shotx/client";
  const sx = new SxClient();
  sx.connect();

  let fileInput;

  onMount(() => {
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

  function triggerFileUpload() {
    fileInput?.click();
  }

  async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length === 1) {
      await processImage(files[0]);
    } else {
      await processBatchFiles(files);
    }

    // Reset file input
    if (fileInput) {
      fileInput.value = "";
    }
  }

  async function processImage(file) {
    console.log("Starting processing for:", file.name);

    // Create loading placeholder expense
    const tempId = Date.now() + Math.random();
    const loadingExpense = {
      id: tempId,
      merchant: "",
      amount: 0,
      currency: "USD",
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      location: "",
      receiptNumber: "",
      paymentMethod: "",
      taxAmount: 0,
      imageUrl: null,
      isLoading: true,
      createdAt: new Date().toISOString(),
    };

    // Add placeholder to expenses list immediately
    expenses.update((list) => [loadingExpense, ...list]);

    // Stay on current screen - don't navigate

    // Process in background
    try {
      // Try server first, fall back to simulator
      const result = await sx.send("process_receipt", file);

      if (result.success) {
        // Update the placeholder with real data
        const processedExpense = {
          id: tempId, // Keep same ID
          ...result.data,
          isLoading: false,
          createdAt: new Date().toISOString(),
        };

        expenses.update((list) =>
          list.map((exp) => (exp.id === tempId ? processedExpense : exp)),
        );
      } else {
        // Remove failed placeholder
        expenses.update((list) => list.filter((exp) => exp.id !== tempId));
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
      currency: "USD",
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      location: "",
      receiptNumber: "",
      paymentMethod: "",
      taxAmount: 0,
      imageUrl: null,
      isLoading: true,
      createdAt: new Date().toISOString(),
    }));

    // Add all placeholders to expenses list immediately
    expenses.update((list) => [...placeholders, ...list]);

    // Stay on current screen - don't navigate

    // Process each file in background
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const placeholder = placeholders[i];

      try {
        // Try server first, fall back to simulator
        const result = await sx.send("process_receipt", file);
        console.log("Server result for", file.name, ":", result);

        if (result.success) {
          // Update placeholder with real data
          const processedExpense = {
            id: placeholder.id, // Keep same ID
            ...result.data,
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
</script>

<div class="flex flex-col h-full bg-dark-900">
  <!-- Header -->
  <header class="bg-dark-800 border-b border-dark-700 safe-area-top">
    <div class="flex items-center justify-between p-4">
      <div>
        <h1 class="text-xl font-bold text-white">Upload Receipts</h1>
        <p class="text-sm text-dark-300">Select images from your device</p>
      </div>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-1 overflow-hidden relative">
    <!-- Upload Options -->
    <div class="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
      <div class="text-center">
        <i class="fas fa-upload text-6xl text-dark-600 mb-4"></i>
        <h2 class="text-2xl font-bold text-white mb-2">Upload Receipts</h2>
        <p class="text-dark-300">Select images from your device</p>
      </div>

      <div class="w-full max-w-sm space-y-4">
        <button
          class="btn-primary w-full py-4 text-lg"
          on:click={triggerFileUpload}
        >
          <i class="fas fa-upload mr-3"></i>
          Select Images
        </button>

        <input
          bind:this={fileInput}
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          on:change={handleFileSelect}
        />
      </div>

      <div class="text-center text-sm text-dark-400 max-w-xs">
        <p class="mb-2">
          <i class="fas fa-lightbulb mr-2 text-accent-500"></i>
          Tips for better results:
        </p>
        <ul class="space-y-1 text-left">
          <li>• Ensure good lighting</li>
          <li>• Keep receipt flat and straight</li>
          <li>• Include all text and numbers</li>
          <li>• Avoid shadows and glare</li>
        </ul>
      </div>
    </div>
  </main>
</div>
