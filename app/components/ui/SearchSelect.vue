<script setup lang="ts">
import { Check, ChevronDown, Search } from 'lucide-vue-next'

// A dropdown with the search box inside the panel, which a native <select>
// cannot do — it only accepts <option> children, so any filter field has to
// sit outside it. Built as its own component rather than inline so other
// long pickers in this app can move onto it later.
export interface SearchSelectOption {
  value: string
  label: string
  /** Shown greyed beside the label, and searched along with it. */
  hint?: string
}

interface Props {
  modelValue: string | null
  options: SearchSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select…',
  searchPlaceholder: 'Search…',
  emptyText: 'No matches',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const open = ref(false)
const search = ref('')
const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const selected = computed(() =>
  props.options.find(option => option.value === props.modelValue) ?? null,
)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return props.options
  return props.options.filter(option =>
    option.label.toLowerCase().includes(term)
    || (option.hint?.toLowerCase().includes(term) ?? false),
  )
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    // The search box is the whole point of opening it, so put the caret
    // there rather than making the operator click again.
    nextTick(() => searchRef.value?.focus())
  }
}

function close() {
  open.value = false
  // Cleared on close so reopening always starts from the full list, which
  // is less surprising than finding it still narrowed from last time.
  search.value = ''
}

function pick(option: SearchSelectOption) {
  emit('update:modelValue', option.value)
  close()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) close()
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div ref="rootRef" class="relative" @keydown.esc="close">
    <button
      type="button"
      :disabled="disabled"
      class="flex w-full items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-left text-sm text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15 disabled:cursor-not-allowed disabled:opacity-50"
      :class="open ? 'border-[#01ADEF] ring-2 ring-[#01ADEF]/15' : ''"
      @click="toggle"
    >
      <span class="truncate" :class="selected ? '' : 'text-slate-400'">
        <template v-if="selected">
          {{ selected.label }}
          <span v-if="selected.hint" class="ml-1 font-mono text-xs text-slate-400">{{ selected.hint }}</span>
        </template>
        <template v-else>{{ placeholder }}</template>
      </span>
      <ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>

    <div
      v-if="open"
      class="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl shadow-slate-300/50"
    >
      <div class="relative border-b border-[#E2E8F0]">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref="searchRef"
          v-model="search"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full px-4 py-2.5 pl-9 text-sm text-[#0F1F52] outline-none placeholder:text-slate-400"
        >
      </div>

      <ul class="max-h-60 overflow-y-auto py-1">
        <li v-if="filtered.length === 0" class="px-4 py-3 text-center text-xs text-slate-400">
          {{ emptyText }}
        </li>
        <li v-for="option in filtered" :key="option.value">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
            :class="option.value === modelValue ? 'bg-[#01ADEF]/5 font-semibold text-[#0F1F52]' : 'text-[#0F1F52]'"
            @click="pick(option)"
          >
            <span class="min-w-0 truncate">
              {{ option.label }}
              <span v-if="option.hint" class="ml-1 font-mono text-xs text-slate-400">{{ option.hint }}</span>
            </span>
            <Check v-if="option.value === modelValue" class="h-4 w-4 shrink-0 text-[#01ADEF]" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
