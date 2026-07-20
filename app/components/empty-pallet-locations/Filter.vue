<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { EmptyPalletLocationQuery } from '~/types/empty-pallet-location'

interface Props {
  filters: EmptyPalletLocationQuery
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [patch: Partial<EmptyPalletLocationQuery>]
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
