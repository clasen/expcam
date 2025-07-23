<script>
  import { onMount } from "svelte";
  import {
    expenses,
    loadingStates,
    currentScreen,
    currentTab,
    appSettings,
    notification,
  } from "../stores/appStore.js";
  import {
    processReceiptImage,
    processBatchImages,
  } from "../utils/ocrSimulator.js";

  import LoadingSpinner from "../components/LoadingSpinner.svelte";

  import SxClient from "shotx/client";
  const sx = new SxClient();
  sx.connect();

  let fileInput;
  let cameraStream;
  let videoElement;
  let canvasElement;
  let showCamera = false;
  let isCameraReady = false;

  onMount(() => {
    // Listen for close camera event from nav
    const handleCloseCamera = () => {
      stopCamera();
    };

    // Listen for initialize camera event
    const handleInitializeCamera = () => {
      initializeCamera();
    };

    // Listen for files selected from bottom navigation (simple mode)
    const handleFilesSelected = async (event) => {
      console.log('Files selected event received:', event.detail);
      const files = event.detail;
      if (files && files.length > 0) {
        if (files.length === 1) {
          console.log('Processing single image:', files[0].name);
          await processImage(files[0]);
        } else {
          console.log('Processing batch images:', files.length);
          await processBatchFiles(files);
        }
      }
    };

    window.addEventListener("closeCamera", handleCloseCamera);
    window.addEventListener("initializeCamera", handleInitializeCamera);
    window.addEventListener("filesSelected", handleFilesSelected);

    return () => {
      stopCamera();
      window.removeEventListener("closeCamera", handleCloseCamera);
      window.removeEventListener("initializeCamera", handleInitializeCamera);
      window.removeEventListener("filesSelected", handleFilesSelected);
    };
  });

  function initializeCamera() {
    // If simple camera mode is enabled, directly open file picker
    if ($appSettings.simpleCameraMode) {
      fileInput?.click();
      return;
    }
    
    showCamera = true;
    // Wait for DOM to update, then start camera
    setTimeout(startCamera, 100);
  }

  async function startCamera() {
    try {
      if (!videoElement) {
        console.error("Video element not found");
        showCamera = false;
        fileInput?.click();
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Camera not supported in this browser. Using file upload instead.",
        );
        showCamera = false;
        fileInput?.click();
        return;
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      videoElement.srcObject = cameraStream;
      await videoElement.play();
      isCameraReady = true;
    } catch (error) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Could not access camera. ";

      if (error.name === "NotAllowedError") {
        errorMessage += "Please allow camera permissions and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (error.name === "NotSupportedError") {
        errorMessage += "Camera not supported in this browser.";
      } else {
        errorMessage += "Please use file upload instead.";
      }

      alert(errorMessage);
      showCamera = false;
      fileInput?.click();
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    showCamera = false;
    isCameraReady = false;
  }

  function capturePhoto() {
    if (!videoElement || !canvasElement) return;

    const context = canvasElement.getContext("2d");
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0);

    canvasElement.toBlob(
      async (blob) => {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        await processImage(file);
      },
      "image/jpeg",
      0.8,
    );
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
    console.log('Starting image processing for:', file.name);
    loadingStates.update((state) => ({ ...state, ocr: true }));

    try {
      // Try server first, fall back to simulator
      let result;
      try {
        result = await sx.send("process_receipt", file);
        console.log('Server result:', result);
      } catch (serverError) {
        console.warn('Server processing failed, using simulator:', serverError);
        result = await processReceiptImage(file);
      }
      
      if (result.success) {
        // Store extracted data globally and navigate to expense form
        window.tempExtractedData = result.data;
        currentScreen.set("expense-form");
      } else {
        alert("Failed to process receipt. Please try again.");
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      alert("An error occurred while processing the receipt.");
    } finally {
      loadingStates.update((state) => ({ ...state, ocr: false }));
      stopCamera();
    }
  }

  async function processBatchFiles(files) {
    console.log('Starting batch processing for:', files.length, 'files');
    loadingStates.update((state) => ({ ...state, ocr: true }));

    try {
      const results = [];
      
      // Process each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i + 1}/${files.length}:`, file.name);
        
        try {
          // Try server first, fall back to simulator
          let result;
          try {
            result = await sx.send("process_receipt", file);
            console.log('Server result for', file.name, ':', result);
          } catch (serverError) {
            console.warn('Server processing failed for', file.name, ', using simulator:', serverError);
            result = await processReceiptImage(file);
          }
          
          if (result.success) {
            results.push({
              fileName: file.name,
              success: true,
              data: result.data,
              confidence: result.confidence
            });
          } else {
            results.push({
              fileName: file.name,
              success: false,
              error: result.error || 'Processing failed'
            });
          }
        } catch (error) {
          console.error('Error processing', file.name, ':', error);
          results.push({
            fileName: file.name,
            success: false,
            error: error.message
          });
        }
      }

      const successfulResults = results.filter((r) => r.success);
      console.log('Batch processing completed:', successfulResults.length, 'successful,', results.length - successfulResults.length, 'failed');

      if (successfulResults.length > 0) {
        // Add all successful extractions as expenses
        const newExpenses = successfulResults.map((result) => ({
          id: Date.now() + Math.random(),
          ...result.data,
          createdAt: new Date().toISOString(),
        }));

        expenses.update((list) => [...list, ...newExpenses]);

        // Show success notification
        notification.set({
          type: 'success',
          message: `Successfully processed ${successfulResults.length} of ${files.length} receipts`,
          duration: 4000
        });

        // Navigate to expenses screen to see the results
        currentScreen.set('main');
        currentTab.set('expenses');
      } else {
        alert("Failed to process any receipts. Please try again.");
      }
    } catch (error) {
      console.error("Batch processing error:", error);
      alert("An error occurred while processing the receipts.");
    } finally {
      loadingStates.update((state) => ({ ...state, ocr: false }));
    }
  }
</script>

<div class="flex flex-col h-full bg-dark-900">
  <!-- Header -->
  <header
    class="bg-dark-800 border-b border-dark-700 safe-area-top"
    class:hidden={showCamera}
  >
    <div class="flex items-center justify-between p-4">
      <div>
        <h1 class="text-xl font-bold text-white">Camera</h1>
        <p class="text-sm text-dark-300">Capture receipt photos</p>
      </div>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-1 overflow-hidden relative" class:h-screen={showCamera}>
    {#if $loadingStates.ocr}
      <div
        class="absolute inset-0 bg-dark-900 bg-opacity-75 flex items-center justify-center z-10"
      >
        <div class="text-center">
          <LoadingSpinner size="large" />
          <p class="text-white mt-4">Processing receipt...</p>
        </div>
      </div>
    {/if}

    {#if showCamera}
      <!-- Camera View -->
      <div class="relative h-full w-full">
        <video
          bind:this={videoElement}
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover bg-black"
        ></video>

        {#if isCameraReady}
          <!-- Camera Controls -->
          <div class="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              class="w-16 h-16 bg-transparent rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-lg"
              on:click={capturePhoto}
            >
              <div class="w-8 h-8 bg-white rounded-full opacity-80"></div>
            </button>
          </div>
        {:else}
          <!-- Loading camera -->
          <div
            class="absolute inset-0 bg-dark-900 bg-opacity-75 flex items-center justify-center"
          >
            <div class="text-center">
              <LoadingSpinner size="large" />
              <p class="text-white mt-4">Starting camera...</p>
            </div>
          </div>
        {/if}
      </div>

      <canvas bind:this={canvasElement} class="hidden"></canvas>
    {:else}
      <!-- Camera Options -->
      <div
        class="flex-1 flex flex-col items-center justify-center p-8 space-y-8"
      >
        <div class="text-center">
          <i class="fas fa-camera text-6xl text-dark-600 mb-4"></i>
          <h2 class="text-2xl font-bold text-white mb-2">Capture Receipts</h2>
          <p class="text-dark-300">
            {$appSettings.simpleCameraMode ? 'Select images from your device' : 'Take photos or upload existing images'}
          </p>
        </div>

        <div class="w-full max-w-sm space-y-4">
          <button
            class="btn-primary w-full py-4 text-lg"
            on:click={initializeCamera}
          >
            <i class="fas fa-camera mr-3"></i>
            {$appSettings.simpleCameraMode ? 'Select Image' : 'Take Photo'}
          </button>

          {#if !$appSettings.simpleCameraMode}
            <button
              class="btn-secondary w-full py-4 text-lg"
              on:click={() => fileInput.click()}
            >
              <i class="fas fa-upload mr-3"></i>
              Upload Image
            </button>
          {/if}

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
    {/if}
  </main>
</div>
