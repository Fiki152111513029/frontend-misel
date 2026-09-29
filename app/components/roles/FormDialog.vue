<script setup lang="ts">
import type { CreateRoleInput, Role } from '~/types/role'
import { landingPageOptions } from '~/utils/navMenu'
import { getBuiltInRoleHome } from '~/utils/roleHome'

interface Props {
  modelValue: boolean
  role?: Role | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateRoleInput]
  cancel: []
}>()

const name = ref('')
const description = ref('')
// '' means "leave it unset" — the role then falls back to the built-in
// default for its name rather than a page someone picked by accident.
const landingPath = ref('')
const errors = reactive<{ name?: string }>({})

// Pulled from the sidebar definition, so the dropdown can only ever offer a
// page that actually exists.
const pageOptions = landingPageOptions()
const groupedPageOptions = computed(() => {
  const groups = new Map<string, typeof pageOptions>()
  for (const option of pageOptions) {
    const key = option.group ?? 'General'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(option)
  }
  return [...groups.entries()]
})

function resetFields() {
  name.value = props.role?.name ?? ''
  description.value = props.role?.description ?? ''
  landingPath.value = props.role?.landingPath ?? ''
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.role)

const fallbackPath = computed(() => getBuiltInRoleHome(name.value.trim()))

// Landing somewhere the role cannot open just gets it bounced straight back
// out by the permission middleware, so say so here rather than letting the
// admin find out by logging in as them. Only checkable while editing, since
// permissions are assigned on an existing role.
const permissionWarning = computed(() => {
  if (!landingPath.value || !props.role) return null
  const option = pageOptions.find(page => page.path === landingPath.value)
  if (!option?.permission) return null
  const granted = props.role.permissions.some(entry => entry.permission.code === option.permission)
  if (granted) return null
  return `This role does not have "${option.permission}" yet, so it would be redirected away from that page. Grant it under Manage Permissions.`
})

function validate(): boolean {
  errors.name = undefined
  if (!name.value.trim()) {
    errors.name = 'Name is required'
  }
  return !errors.name
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    // Explicit null (not undefined) so clearing it actually wipes the
    // stored value instead of leaving the old one in place.
    landingPath: landingPath.value || null,
  })
}

function handleCancel() {
  emit('cancel')
}

const selectClass
  = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Role' : 'Add Role'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput v-model="description" label="Description" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Landing Page After Login
        </label>
        <select v-model="landingPath" :class="selectClass">
          <option value="">Default ({{ fallbackPath }})</option>
          <optgroup v-for="[group, options] in groupedPageOptions" :key="group" :label="group">
            <option v-for="option in options" :key="option.path" :value="option.path">
              {{ option.title }}
            </option>
          </optgroup>
        </select>
        <p class="font-medium mt-1.5 text-xs text-slate-400">
          Where someone with this role goes straight after signing in.
        </p>
        <p v-if="permissionWarning" class="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {{ permissionWarning }}
        </p>
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
