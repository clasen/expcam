<script>
  import { onMount } from "svelte";
  import {
    expenses,
    currentScreen,
    currentTab,
    appSettings,
  } from "../stores/appStore.js";
  import {
    processReceiptImage,
  } from "../utils/ocrSimulator.js";


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
    console.log('Starting processing for:', file.name);
    
    // Create loading placeholder expense
    const tempId = Date.now() + Math.random();
    const loadingExpense = {
      id: tempId,
      merchant: '',
      amount: 0,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      location: '',
      receiptNumber: '',
      paymentMethod: '',
      taxAmount: 0,
      imageUrl: null,
      isLoading: true,
      createdAt: new Date().toISOString()
    };
    
    // Add placeholder to expenses list immediately
    expenses.update(list => [loadingExpense, ...list]);
    
    // Navigate to expenses list
    currentScreen.set('main');
    currentTab.set('expenses');
    stopCamera();
    
    // Process in background
    try {
      // Try server first, fall back to simulator
      let result;
      try {
        // Convert file to buffer for server
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        result = await sx.send("process_receipt", {
          imageData: buffer,
          fileName: file.name
        });
        console.log('Server result:', result);
      } catch (serverError) {
        console.warn('Server processing failed, using simulator:', serverError);
        result = await processReceiptImage(file);
      }
      
      if (result.success) {
        // Update the placeholder with real data
        const processedExpense = {
          id: tempId, // Keep same ID
          ...result.data,
          isLoading: false,
          createdAt: new Date().toISOString()
        };
        
        expenses.update(list => 
          list.map(exp => exp.id === tempId ? processedExpense : exp)
        );
        
      } else {
        // Remove failed placeholder
        expenses.update(list => list.filter(exp => exp.id !== tempId));
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      // Remove failed placeholder
      expenses.update(list => list.filter(exp => exp.id !== tempId));
    }
  }

  async function processBatchFiles(files) {
    console.log('Starting batch processing for:', files.length, 'files');
    
    // Create loading placeholders for all files
    const placeholders = files.map((file, index) => ({
      id: Date.now() + Math.random() + index,
      merchant: '',
      amount: 0,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      location: '',
      receiptNumber: '',
      paymentMethod: '',
      taxAmount: 0,
      imageUrl: null,
      isLoading: true,
      createdAt: new Date().toISOString()
    }));
    
    // Add all placeholders to expenses list immediately
    expenses.update(list => [...placeholders, ...list]);
    
    // Navigate to expenses list
    currentScreen.set('main');
    currentTab.set('expenses');
    
    // Process each file in background
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const placeholder = placeholders[i];
      
      try {
        // Try server first, fall back to simulator
        let result;
        try {
          // Convert file to buffer for server
          const arrayBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          
          result = await sx.send("process_receipt", {
            imageData: buffer,
            fileName: file.name
          });
          console.log('Server result for', file.name, ':', result);
        } catch (serverError) {
          console.warn('Server processing failed for', file.name, ', using simulator:', serverError);
          result = await processReceiptImage(file);
        }
        
        if (result.success) {
          // Update placeholder with real data
          const processedExpense = {
            id: placeholder.id, // Keep same ID
            ...result.data,
            isLoading: false,
            createdAt: new Date().toISOString()
          };
          
          expenses.update(list => 
            list.map(exp => exp.id === placeholder.id ? processedExpense : exp)
          );
        } else {
          // Remove failed placeholder
          expenses.update(list => list.filter(exp => exp.id !== placeholder.id));
        }
      } catch (error) {
        console.error('Error processing', file.name, ':', error);
        // Remove failed placeholder
        expenses.update(list => list.filter(exp => exp.id !== placeholder.id));
      }
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
              <div class="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
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
