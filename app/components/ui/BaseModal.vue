<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onUnmounted(() => {
  if (import.meta.client) document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="close"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="flex max-h-[90vh] w-full flex-col rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-xl"
            :class="{
              'max-w-sm': size === 'sm',
              'max-w-md': size === 'md',
              'max-w-2xl': size === 'lg',
            }"
          >
            <div
              v-if="title"
              class="flex flex-shrink-0 items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] px-6 py-4"
            >
              <h3 class="text-lg font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">
                {{ title }}
              </h3>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Close"
                @click="close"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="overflow-y-auto px-6 py-5">
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="flex flex-shrink-0 items-center justify-end gap-3 border-t border-[#E2E8F0] dark:border-[#1E293B] px-6 py-4"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
