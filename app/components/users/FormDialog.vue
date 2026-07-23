<script setup lang="ts">
import type { Role } from '~/types/role'
import type { User, UserFormValues } from '~/types/user'

interface Props {
  modelValue: boolean
  user?: User | null
  roles: Role[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: UserFormValues]
  cancel: []
}>()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const username = ref('')
const email = ref('')
const password = ref('')
const fullName = ref('')
const roleId = ref('')
const isActive = ref(true)
const priority = ref<UserFormValues['priority']>(6)
const errors = reactive<{
  username?: string
  email?: string
  password?: string
  fullName?: string
  roleId?: string
}>({})

function resetFields() {
  username.value = props.user?.username ?? ''
  email.value = props.user?.email ?? ''
  password.value = ''
  fullName.value = props.user?.fullName ?? ''
  roleId.value = props.user?.roleId ?? props.roles[0]?.id ?? ''
  isActive.value = props.user?.isActive ?? true
  priority.value = props.user?.priority ?? 6
  errors.username = undefined
  errors.email = undefined
  errors.password = undefined
  errors.fullName = undefined
  errors.roleId = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.user)

function validate(): boolean {
  errors.username = undefined
  errors.email = undefined
  errors.password = undefined
  errors.fullName = undefined
  errors.roleId = undefined

  if (!isEditMode.value && !username.value.trim()) {
    errors.username = 'Username is required'
  }

  if (email.value.trim() && !EMAIL_PATTERN.test(email.value.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (!isEditMode.value && !password.value) {
    errors.password = 'Password is required'
  } else if (password.value && password.value.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!fullName.value.trim()) {
    errors.fullName = 'Full name is required'
  }

  if (!roleId.value) {
    errors.roleId = 'Role is required'
  }

  return !Object.values(errors).some(Boolean)
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    username: username.value.trim(),
    email: email.value.trim(),
    password: password.value,
    fullName: fullName.value.trim(),
    roleId: roleId.value,
    isActive: isActive.value,
    priority: priority.value,
  })
}

function handleCancel() {
  emit('cancel')
}

const selectClass =
  'w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#020617] px-4 py-3 text-sm text-[#0F1F52] dark:text-[#F8FAFC] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit User' : 'Add User'"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput
        v-model="username"
        label="Username"
        required
        :disabled="isEditMode"
        :error="errors.username"
      />
      <p v-if="isEditMode" class="font-medium -mt-3 text-xs text-slate-400">
        Username cannot be changed after creation.
      </p>

      <UiBaseInput v-model="email" type="email" label="Email" :error="errors.email" />
      <UiBaseInput v-model="fullName" label="Full Name" required :error="errors.fullName" />

      <UiBaseInput
        v-model="password"
        type="password"
        :label="isEditMode ? 'New Password' : 'Password'"
        :placeholder="isEditMode ? 'Leave blank to keep current password' : undefined"
        :required="!isEditMode"
        :error="errors.password"
      />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Role
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="roleId" :class="selectClass">
          <option v-for="role in roles" :key="role.id" :value="role.id">
            {{ role.name }}
          </option>
        </select>
        <p v-if="errors.roleId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.roleId }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Priority
        </label>
        <select v-model="priority" :class="selectClass">
          <option :value="4">High</option>
          <option :value="6">Medium</option>
          <option :value="8">Low</option>
        </select>
      </div>

      <UiBaseCheckbox v-model="isActive" label="Active" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
