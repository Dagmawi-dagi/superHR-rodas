<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content evidence-modal">
      <div class="modal-header">
        <div>
          <h3>Upload Evidence</h3>
          <p class="subtitle">{{ title }}</p>
        </div>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Drag & Drop Zone -->
        <div 
          class="upload-zone" 
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input 
            type="file" 
            ref="fileInput" 
            multiple 
            @change="handleFileSelect" 
            accept="image/*,.pdf" 
            hidden 
          />
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p><strong>Click to upload</strong> or drag and drop</p>
          <p class="hint">Images or PDF (Max 10MB per file)</p>
        </div>

        <!-- Selected Files List -->
        <div v-if="files.length" class="file-list-container">
          <h4>Selected Files ({{ files.length }})</h4>
          <div class="file-list">
            <div v-for="(file, idx) in files" :key="idx" class="file-item">
              <div class="file-info">
                <div class="file-type-icon">
                  <svg v-if="file.type.includes('pdf')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div class="file-meta">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
              <button @click="removeFile(idx)" class="remove-file-btn" title="Remove file">
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close" :disabled="uploading">Cancel</button>
        <button 
          class="btn-primary" 
          @click="submit" 
          :disabled="!files.length || uploading"
        >
          <span v-if="uploading" class="spinner-sm"></span>
          {{ uploading ? 'Uploading...' : 'Confirm Upload' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  title: string
  uploading: boolean
}>()

const emit = defineEmits(['close', 'upload'])

const files = ref<File[]>([])
const isDragging = ref(false)

const close = () => {
  if (props.uploading) return
  files.value = []
  emit('close')
}

const handleFileSelect = (e: Event) => {
  const selected = (e.target as HTMLInputElement).files
  if (selected) {
    addFiles(Array.from(selected))
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files
  if (dropped) {
    addFiles(Array.from(dropped))
  }
}

const addFiles = (newFiles: File[]) => {
  // Prevent duplicates by name and size
  const filtered = newFiles.filter(nf => 
    !files.value.some(f => f.name === nf.name && f.size === nf.size)
  )
  files.value = [...files.value, ...filtered]
}

const removeFile = (idx: number) => {
  files.value.splice(idx, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const submit = () => {
  emit('upload', files.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.evidence-modal {
  width: 500px;
  max-width: 95%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.upload-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
  background: #fdfdfd;
}

.upload-zone:hover, .upload-zone.is-dragging {
  border-color: #6366f1;
  background: #f8fafc;
}

.upload-icon {
  width: 48px;
  height: 48px;
  background: #eef2ff;
  color: #6366f1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.upload-icon svg {
  width: 24px;
  height: 24px;
}

.upload-zone p {
  margin: 4px 0;
  color: #475569;
}

.hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.file-list-container {
  margin-top: 24px;
}

.file-list-container h4 {
  font-size: 0.875rem;
  margin-bottom: 12px;
  color: #334155;
}

.file-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-type-icon {
  color: #64748b;
}

.file-type-icon svg {
  width: 20px;
  height: 20px;
}

.file-meta {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.75rem;
  color: #94a3b8;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-footer {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary {
  background: #6366f1;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
