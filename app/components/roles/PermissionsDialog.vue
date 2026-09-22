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

// A write permission does nothing on its own — the backend drops
// create/update/delete for any resource whose own read wasn't granted (see
// resolveEffectivePermissions). Mirrored here so the form can't be saved in
// a state that silently means something else: unticking a resource's read
// unticks its writes too, and ticking a write ticks that read back on.
const WRITE_ACTIONS = ['create', 'update', 'delete']

function actionOf(code: string) {
  return code.slice(code.lastIndexOf('.') + 1)
}

function readPermissionOf(resource: string) {
  return (groupedPermissions.value[resource] ?? []).find(p => actionOf(p.code) === 'read')
}

function onPermissionToggle(permission: Permission, resource: string) {
  const action = actionOf(permission.code)
  const read = readPermissionOf(resource)
  if (!read) return

  if (action === 'read' && !checked[permission.id]) {
    for (const other of groupedPermissions.value[resource] ?? []) {
      if (WRITE_ACTIONS.includes(actionOf(other.code))) checked[other.id] = false
    }
    return
  }
  if (WRITE_ACTIONS.includes(action) && checked[permission.id]) {
    checked[read.id] = true
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
    <p class="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
      Read controls whether the data shows at all; create, update and delete control the
      Add, Edit and Delete buttons. A write permission needs its own read — unticking read
      unticks them too.
    </p>

    <div class="max-h-96 space-y-5 overflow-y-auto pr-1">
      <div v-for="(perms, resource) in groupedPermissions" :key="resource">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
            <span class="text-slate-300">|</span>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600"
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
            @update:model-value="onPermissionToggle(permission, String(resource))"
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
