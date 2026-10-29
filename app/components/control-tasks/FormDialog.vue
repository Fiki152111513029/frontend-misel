<script setup lang="ts">
import type { ControlTask, CreateControlTaskInput } from '~/types/control-task'

interface Props {
  modelValue: boolean
  controlTask?: ControlTask | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  controlTask: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateControlTaskInput]
  cancel: []
}>()

const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()
const activeModelCodeProcesses = computed(() =>
  modelCodeProcesses.value.filter(process => process.isActive),
)
const { production, warehouse, fetchRouteOptions } = useRouteOptions()
// Who may dispatch this task from Custom Task. Only active users are
// offered: assigning a disabled account would put a task in a picker
// nobody can reach.
const { items: users, fetchUsers } = useUsers()
const activeUsers = computed(() => users.value.filter(user => user.isActive))

const code = ref('')
const name = ref('')
const groupName = ref('')
const colorCode = ref('')
const groupColor = ref('')
const modelCodeProcessId = ref('')
const route = ref<string[]>([])
const isActive = ref(true)
const userIds = ref<string[]>([])
const errors = reactive<{
  code?: string
  name?: string
  modelCodeProcessId?: string
  route?: string
  colorCode?: string
  groupColor?: string
}>({})

// The colour picker can only produce valid hex, but the text box beside it
// accepts anything — and the value lands in a style attribute, so the
// server rejects a bad one. Catch it here so the operator is told why
// before they lose the rest of the form.
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

function resetFields() {
  code.value = props.controlTask?.code ?? ''
  name.value = props.controlTask?.name ?? ''
  modelCodeProcessId.value = props.controlTask?.modelCodeProcessId ?? ''
  groupName.value = props.controlTask?.groupName ?? ''
  colorCode.value = props.controlTask?.colorCode ?? ''
  groupColor.value = props.controlTask?.groupColor ?? ''
  route.value = [...(props.controlTask?.route ?? [])]
  isActive.value = props.controlTask?.isActive ?? true
  userIds.value = (props.controlTask?.assignees ?? []).map(a => a.user.id)
  errors.code = undefined
  errors.name = undefined
  errors.modelCodeProcessId = undefined
  errors.route = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetFields()
      fetchModelCodeProcesses({ limit: 100 })
      fetchRouteOptions()
      fetchUsers()
    }
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.controlTask)

function validate(): boolean {
  errors.code = undefined
  errors.name = undefined
  errors.modelCodeProcessId = undefined
  errors.route = undefined
  errors.colorCode = undefined
  errors.groupColor = undefined

  if (!code.value.trim()) {
    errors.code = 'Code is required'
  } else if (code.value.trim().length > 20) {
    errors.code = 'Code must be at most 20 characters'
  }

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!modelCodeProcessId.value) {
    errors.modelCodeProcessId = 'Model Code Process is required'
  }

  if (route.value.length === 0) {
    errors.route = 'Add at least one location to the route'
  }

  // Empty is allowed — that is how a task opts out and keeps the default.
  if (colorCode.value.trim() && !HEX_PATTERN.test(colorCode.value.trim())) {
    errors.colorCode = 'Colour must be a hex value like #01ADEF'
  }

  if (groupColor.value.trim() && !HEX_PATTERN.test(groupColor.value.trim())) {
    errors.groupColor = 'Colour must be a hex value like #F97316'
  }

  return (
    !errors.code
    && !errors.name
    && !errors.modelCodeProcessId
    && !errors.route
    && !errors.colorCode
    && !errors.groupColor
  )
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    code: code.value.trim(),
    name: name.value.trim(),
    // Empty means ungrouped, which the picker shows under "Other" — stored
    // as null rather than "" so the two cannot drift apart.
    groupName: groupName.value.trim() || null,
    colorCode: colorCode.value.trim() || null,
    groupColor: groupColor.value.trim() || null,
    modelCodeProcessId: modelCodeProcessId.value,
    route: route.value,
    isActive: isActive.value,
    userIds: userIds.value,
  })
}


function toggleUser(id: string) {
  userIds.value = userIds.value.includes(id)
    ? userIds.value.filter(existing => existing !== id)
    : [...userIds.value, id]
}

const selectClass
  = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Control Task' : 'Add Control Task'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiBaseInput
          v-model="code"
          label="Code"
          required
          :error="errors.code"
          placeholder="A"
        />
        <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      </div>

      <div>
        <UiBaseInput
          v-model="groupName"
          label="Group"
          placeholder="WRL23L"
        />
        <p class="mt-1 text-xs text-slate-500">
          Tasks sharing a group are listed together under that heading in
          Custom Task. Leave empty to put this one under "Other".
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Group Colour</label>
        <div class="flex items-center gap-3">
          <input
            :value="groupColor || '#01ADEF'"
            type="color"
            aria-label="Pick group heading colour"
            class="h-11 w-11 flex-shrink-0 cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-1"
            @input="groupColor = ($event.target as HTMLInputElement).value"
          >
          <UiBaseInput v-model="groupColor" placeholder="#F97316" class="flex-1" />
          <button
            v-if="groupColor"
            type="button"
            class="shrink-0 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200"
            @click="groupColor = ''"
          >
            Reset
          </button>
        </div>
        <p v-if="errors.groupColor" role="alert" class="text-xs font-medium text-red-500">
          {{ errors.groupColor }}
        </p>
        <!-- Set on any one member and the whole heading takes it, because a
             group is just a shared name with no row of its own to store it
             on. Saying so here saves wondering why it is asked per task. -->
        <p v-else class="text-xs text-slate-500">
          Colours the whole group heading in Custom Task — setting it on any
          one task in the group is enough.
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Button Colour</label>
        <div class="flex items-center gap-3">
          <input
            :value="colorCode || '#01ADEF'"
            type="color"
            aria-label="Pick button colour"
            class="h-11 w-11 flex-shrink-0 cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-1"
            @input="colorCode = ($event.target as HTMLInputElement).value"
          >
          <UiBaseInput v-model="colorCode" placeholder="#01ADEF" class="flex-1" />
          <button
            v-if="colorCode"
            type="button"
            class="shrink-0 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200"
            @click="colorCode = ''"
          >
            Reset
          </button>
        </div>
        <p v-if="errors.colorCode" role="alert" class="text-xs font-medium text-red-500">
          {{ errors.colorCode }}
        </p>
        <p v-else class="text-xs text-slate-500">
          Colours the task's button in Custom Task. Leave empty to use the
          default blue.
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Model Code Process
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="modelCodeProcessId" :class="selectClass">
          <option value="" disabled>Select a Model Code Process</option>
          <option v-for="process in activeModelCodeProcesses" :key="process.id" :value="process.id">
            {{ process.name }}
          </option>
        </select>
        <p v-if="errors.modelCodeProcessId" class="mt-1 text-xs text-red-500">
          {{ errors.modelCodeProcessId }}
        </p>
      </div>

      <ControlTasksRouteBuilder
        v-model="route"
        :production="production"
        :warehouse="warehouse"
        :error="errors.route"
      />

      <div>
        <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52]">
          Registered Operators
        </label>
        <p class="mb-2 text-xs text-slate-500">
          Only these users will see this task in Custom Task. Leave empty and
          it stays reachable by scanning its QR label, but appears in nobody's
          list.
        </p>
        <div class="max-h-44 overflow-y-auto rounded-xl border border-[#E2E8F0] p-2">
          <p v-if="activeUsers.length === 0" class="px-2 py-3 text-xs text-slate-400">
            No active users
          </p>
          <label
            v-for="user in activeUsers"
            :key="user.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-[#E2E8F0] text-[#01ADEF] focus:ring-[#01ADEF]"
              :checked="userIds.includes(user.id)"
              @change="toggleUser(user.id)"
            >
            <span class="text-sm text-[#0F1F52]">{{ user.fullName }}</span>
            <span class="text-xs text-slate-400">{{ user.username }}</span>
          </label>
        </div>
      </div>

      <UiBaseCheckbox v-model="isActive" label="Active" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
