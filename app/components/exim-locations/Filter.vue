<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { EximLocationQuery } from '~/types/exim-location'

interface Props {
  filters: EximLocationQuery
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [patch: Partial<EximLocationQuery>]
}>()

const searchText = ref(props.filters.search ?? '')

watch(
  () => props.filters.search,
  (value) => {
    searchText.value = value ?? ''
  },
)

const emitSearch = useDebounceFn((value: string) => {
  emit('change', { search: value })
}, 400)

watch(searchText, (value) => emitSearch(value))
</script>

<template>
  <div class="w-full min-w-[200px] flex-1 sm:max-w-xs">
    <UiBaseInput v-model="searchText" placeholder="Search by name..." />
  </div>
</template>
