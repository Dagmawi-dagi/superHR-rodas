<template>
  <div class="print-container">
    <div class="print-page">
      <div class="print-content">
        <!-- Content specific to different documents will be injected here -->
        <slot>
          <div class="placeholder-content">
            <h1 class="text-2xl font-bold mb-4">Document Title</h1>
            <p>Document content goes here...</p>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component acts as a layout/wrapper for printable documents
</script>

<style scoped>
.print-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
  background-color: #f3f4f6; /* Gray background for screen viewing */
  min-height: 100vh;
}

.print-page {
  width: 210mm; /* A4 width */
  min-height: 297mm; /* A4 height */
  padding: 0; /* Padding moved to content to ensure strict box-sizing */
  background-image: url('@/assets/HEADING_LETTER_HR.png');
  background-size: 100% 100%; /* Stretch to fit exactly */
  background-position: top center;
  background-repeat: no-repeat;
  background-color: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  position: relative;
  box-sizing: border-box;
}

.print-content {
  position: relative;
  z-index: 10;
  height: 100%;
  padding: 45mm 0mm 30mm 0mm; /* Padding to accommodate the image header/footer */
}

.placeholder-content {
  color: #6b7280;
  border: 2px dashed #d1d5db;
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
}

/* Print Specific Styles */
@media print {
  @page {
    size: A4;
    margin: 0; /* Remove default browser margins */
  }

  body {
    margin: 0;
    padding: 0;
    background-color: white;
  }

  .print-container {
    padding: 0;
    background-color: transparent;
    display: block;
  }

  .print-page {
    box-shadow: none;
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 296mm; /* Slightly under 297mm to prevent browser injecting a blank extra page */
    max-height: 296mm;
    page-break-after: always;
    overflow: hidden; /* Prevent content pushing the footer down */
    /* Force background printing in most modern browsers */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Optional: hide other elements on the page when printing */
  :deep(.no-print) {
    display: none !important;
  }
}
</style>
