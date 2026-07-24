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
          @click="goToPage(page - 1)"
        >
          ‹
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors"
          :class="p === page
 ? 'bg-[#2F6FED] text-white'
 : 'border border-[#E2E8F0] text-slate-500 hover:border-slate-300'"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page === totalPages"
          @click="goToPage(page + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>
