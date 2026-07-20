<script setup lang="ts">
import type { Permission } from '~/types/permission'
import type { Role } from '~/types/role'

interface Props {
  modelValue: boolean
  role: Role | null
  allPermissions: Permission[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [permissionIds: string[]]
  cancel: []
}>()

const checked = reactive<Record<string, boolean>>({})

function resetChecked() {
  for (const key of Object.keys(checked)) delete checked[key]
  const currentIds = new Set(props.role?.permissions.map((p) => p.permissionId) ?? [])
  for (const permission of props.allPermissions) {
    checked[permission.id] = currentIds.has(permission.id)
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetChecked()
  },
  { immediate: true },
)

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}
  for (const permission of props.allPermissions) {
    const resource = permission.code.split('.')[0] ?? permission.code
    if (!groups[resource]) groups[resource] = []
    groups[resource].push(permission)
  }
  return groups
})

function toggleGroup(resource: string, value: boolean) {
  for (const permission of groupedPermissions.value[resource] ?? []) {
    checked[permission.id] = value
  }
}

function handleSubmit() {
  const permissionIds = Object.entries(checked)
    .filter(([, isChecked]) => isChecked)
    .map(([id]) => id)
  emit('submit', permissionIds)
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="`Manage Permissions — ${role?.name ?? ''}`"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="max-h-96 space-y-5 overflow-y-auto pr-1">
      <div v-for="(perms, resource) in groupedPermissions" :key="resource">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {{ resource }}
          </h4>
          <div class="flex items-center gap-2 text-xs">
            <button
              type="button"
              class="text-[#01ADEF] hover:text-[#0095D4]"
              @click="toggleGroup(resource, true)"
            >
              Select all
            </button>
            <span class="text-slate-300 dark:text-slate-600">|</span>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              @click="toggleGroup(resource, false)"
            >
              Clear
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <UiBaseCheckbox
            v-for="permission in perms"
            :key="permission.id"
            v-model="checked[permission.id]"
            :label="permission.code"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
