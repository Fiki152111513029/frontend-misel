<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { fetchPlcDevices } from '~/services/plc.service'
import type { CreatePlcTagInput, PlcDevice, PlcTag } from '~/types/plc'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'PLC Tags — YAZAKI' })

const route = useRoute()
const { hasPermission } = useAuth()
const { items, meta, loading, fetchTags, createTag, updateTag, deleteTag }
  = usePlcTags()

// The device list is only needed for the picker and the filter, so it is
// read once rather than kept in sync — a device added in another tab shows
// up on the next visit.
const devices = ref<PlcDevice[]>([])

// Arriving from the Devices page via its Tags button, already narrowed to
// that device. Kept in the URL so the filtered view can be bookmarked and
// a reload does not throw it away.
const deviceFilter = ref<string>(
  typeof route.query.deviceId === 'string' ? route.query.deviceId : '',
)

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editing = ref<PlcTag | null>(null)
const deletingTag = ref<PlcTag | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(async () => {
  try {
    const result = await fetchPlcDevices({ limit: 200 })
    devices.value = result.items
  } catch {
    // The table still works; only the picker and the filter are short of
    // options, and the page says so through its empty states.
    devices.value = []
  }
  await fetchTags({ deviceId: deviceFilter.value || undefined, page: 1 })
})

const selectedDevice = computed(() =>
  devices.value.find(device => device.id === deviceFilter.value) ?? null,
)

async function applyDeviceFilter() {
  await navigateTo({
    path: '/dashboard/plc-tags',
    query: deviceFilter.value ? { deviceId: deviceFilter.value } : {},
  })
  await fetchTags({ deviceId: deviceFilter.value || undefined, page: 1 })
}

function openCreate() {
  editing.value = null
  showFormDialog.value = true
}

function openEdit(tag: PlcTag) {
  editing.value = tag
  showFormDialog.value = true
}

function openDelete(tag: PlcTag) {
  deletingTag.value = tag
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreatePlcTagInput) {
  submitting.value = true
  const ok = editing.value
    ? await updateTag(editing.value.id, input)
    : await createTag(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingTag.value) return
  deleting.value = true
  const ok = await deleteTag(deletingTag.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function goToPage(page: number) {
  fetchTags({ page })
}

function handleLimitChange(limit: number) {
  fetchTags({ limit, page: 1 })
}

const selectClass
  = 'rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">PLC Tags</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          <template v-if="selectedDevice">
            Registers read from {{ selectedDevice.name }}
          </template>
          <template v-else>
            Registers this system reads, from your PLC tag list
          </template>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <select v-model="deviceFilter" :class="selectClass" @change="applyDeviceFilter">
          <option value="">All devices</option>
          <option v-for="device in devices" :key="device.id" :value="device.id">
            {{ device.name }}
          </option>
        </select>

        <button
          v-if="hasPermission('plc.create')"
          type="button"
          :disabled="devices.length === 0"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0] disabled:cursor-not-allowed disabled:opacity-40"
          @click="openCreate"
        >
          <Plus class="h-4 w-4" />
          Add Tag
        </button>
      </div>
    </div>

    <!-- A tag cannot exist without a device, so say that rather than
         leaving a disabled button with no explanation. -->
    <p
      v-if="devices.length === 0 && !loading"
      class="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
    >
      Add a PLC device first — a tag belongs to one.
      <NuxtLink to="/dashboard/plc-devices" class="underline">Go to Devices</NuxtLink>
    </p>

    <PlcTagsTable
      :items="items"
      :loading="loading"
      :can-update="hasPermission('plc.update')"
      :can-delete="hasPermission('plc.delete')"
      :show-device="!deviceFilter"
      @edit="openEdit"
      @delete="openDelete"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="tags"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <PlcTagsFormDialog
      v-model="showFormDialog"
      :tag="editing"
      :devices="devices"
      :default-device-id="deviceFilter || null"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <PlcTagsDeleteDialog
      v-model="showDeleteDialog"
      :tag="deletingTag"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
