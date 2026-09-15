<script setup lang="ts">
interface Props {
  page: number
  totalPages: number
  total: number
  limit: number
  itemLabel?: string
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  itemLabel: 'items',
  pageSizeOptions: () => [10, 20, 50],
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:limit': [limit: number]
}>()

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const rangeEnd = computed(() => Math.min(props.page * props.limit, props.total))

// How many page numbers to show on each side of the current page — kept
// small so a page count in the hundreds/thousands (e.g. 1836 alarms at 10
// per page = 184 pages) never renders more than ~9 number buttons total
// instead of one per page.
const SIBLING_COUNT = 2

type PaginationItem = { type: 'page', value: number } | { type: 'ellipsis' }

// Always includes page 1 and the last page, plus a window of SIBLING_COUNT
// pages on either side of the current one — gaps bigger than a single page
// collapse into an ellipsis (non-clickable) rather than listing every page.
const pageItems = computed<PaginationItem[]>(() => {
  const total = Math.max(1, props.totalPages)
  const current = props.page

  const pages = new Set<number>()
  pages.add(1)
  pages.add(total)
  for (let p = current - SIBLING_COUNT; p <= current + SIBLING_COUNT; p++) {
    if (p >= 1 && p <= total) pages.add(p)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const items: PaginationItem[] = []
  let previous: number | null = null
  for (const p of sorted) {
    if (previous !== null && p - previous > 1) {
      items.push({ type: 'ellipsis' })
    }
    items.push({ type: 'page', value: p })
    previous = p
  }
  return items
})

function goToPage(page: number) {
  emit('update:page', Math.min(Math.max(1, page), Math.max(1, props.totalPages)))
}

function onLimitChange(event: Event) {
  emit('update:limit', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
    <p class="font-medium text-sm text-slate-500">
      Showing {{ rangeStart }} to {{ rangeEnd }} of {{ total }} {{ itemLabel }}
    </p>

    <div class="flex items-center gap-2">
      <select
        :value="limit"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F1F52] outline-none"
        @change="onLimitChange"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} per page</option>
      </select>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page === 1"
          aria-label="First page"
          @click="goToPage(1)"
        >
          «
        </button>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page === 1"
          aria-label="Previous page"
          @click="goToPage(page - 1)"
        >
          ‹
        </button>
        <template v-for="(item, index) in pageItems" :key="index">
          <span
            v-if="item.type === 'ellipsis'"
            class="flex h-8 w-8 items-center justify-center text-sm font-medium text-slate-400"
          >
            …
          </span>
          <button
            v-else
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors"
            :class="item.value === page
 ? 'bg-[#2F6FED] text-white'
 : 'border border-[#E2E8F0] text-slate-500 hover:border-slate-300'"
            @click="goToPage(item.value)"
          >
            {{ item.value }}
          </button>
        </template>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page === totalPages"
          aria-label="Next page"
          @click="goToPage(page + 1)"
        >
          ›
        </button>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page === totalPages"
          aria-label="Last page"
          @click="goToPage(totalPages)"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>
