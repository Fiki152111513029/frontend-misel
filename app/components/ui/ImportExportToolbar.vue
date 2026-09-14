<script setup lang="ts">
import { ChevronDown, Download, Upload } from 'lucide-vue-next'
import type { ImportSummary } from '~/types/import-export'

interface Props {
  basePath: string
  filenameStem: string
  entityLabel: string
  canExport?: boolean
  canImport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canExport: true,
  canImport: true,
})

const emit = defineEmits<{
  imported: []
}>()

const { exporting, importing, exportData, importFile } = useImportExport(
  props.basePath,
  props.filenameStem,
)
const toast = useToast()

const showExportMenu = ref(false)
const exportMenuRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const showResultDialog = ref(false)
const lastResult = ref<ImportSummary | null>(null)

function handleOutsideClick(event: MouseEvent) {
  if (exportMenuRef.value && !exportMenuRef.value.contains(event.target as Node)) {
    showExportMenu.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

function handleExport(format: 'csv' | 'xlsx') {
  showExportMenu.value = false
  exportData(format)
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const result = await importFile(file)
  if (!result) return

  lastResult.value = result
  showResultDialog.value = true

  if (result.created > 0 || result.updated > 0) {
    emit('imported')
  }
  if (result.failed === 0) {
    toast.success(
      `Import completed — ${result.created} created, ${result.updated} updated`,
    )
  } else {
    toast.error(
      `Import finished with ${result.failed} error(s) — see details`,
    )
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="canExport" ref="exportMenuRef" class="relative">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F1F52] shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
        :disabled="exporting"
        @click="showExportMenu = !showExportMenu"
      >
        <Download class="h-4 w-4" />
        Export
        <ChevronDown class="h-3.5 w-3.5" />
      </button>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showExportMenu"
          class="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            class="block w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="handleExport('xlsx')"
          >
            Excel (.xlsx)
          </button>
          <button
            type="button"
            class="block w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="handleExport('csv')"
          >
            CSV (.csv)
          </button>
        </div>
      </Transition>
    </div>

    <button
      v-if="canImport"
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F1F52] shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="importing"
      @click="triggerImport"
    >
      <Upload class="h-4 w-4" />
      {{ importing ? 'Importing…' : 'Import' }}
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".csv,.xlsx"
      class="hidden"
      @change="handleFileSelected"
    >

    <UiBaseModal
      v-model="showResultDialog"
      :title="`Import ${entityLabel} — Result`"
      size="md"
    >
      <div v-if="lastResult" class="space-y-4">
        <div class="grid grid-cols-4 gap-3 text-center">
          <div class="rounded-xl bg-slate-50 px-3 py-2.5">
            <p class="text-lg font-bold text-[#0F1F52]">{{ lastResult.totalRows }}</p>
            <p class="text-xs font-medium text-slate-500">Total</p>
          </div>
          <div class="rounded-xl bg-emerald-50 px-3 py-2.5">
            <p class="text-lg font-bold text-emerald-600">{{ lastResult.created }}</p>
            <p class="text-xs font-medium text-slate-500">Created</p>
          </div>
          <div class="rounded-xl bg-blue-50 px-3 py-2.5">
            <p class="text-lg font-bold text-blue-600">{{ lastResult.updated }}</p>
            <p class="text-xs font-medium text-slate-500">Updated</p>
          </div>
          <div class="rounded-xl bg-red-50 px-3 py-2.5">
            <p class="text-lg font-bold text-red-600">{{ lastResult.failed }}</p>
            <p class="text-xs font-medium text-slate-500">Failed</p>
          </div>
        </div>

        <div v-if="lastResult.errors.length" class="max-h-64 overflow-y-auto rounded-xl border border-[#E2E8F0]">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-2">Row</th>
                <th class="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="err in lastResult.errors" :key="err.rowNumber">
                <td class="px-4 py-2 font-medium text-slate-600">{{ err.rowNumber }}</td>
                <td class="px-4 py-2 text-red-600">{{ err.error }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <UiBaseButton variant="secondary" @click="showResultDialog = false">Close</UiBaseButton>
      </template>
    </UiBaseModal>
  </div>
</template>
