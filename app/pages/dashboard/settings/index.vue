<script setup lang="ts">
import { updateAppSettings } from '~/services/app-setting.service'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Settings — Ichii' })

// Wording the floor keeps wanting reworded. Editable here so a rename is
// not a code change and a deploy — see app-setting.keys.ts on the server
// for how a new setting gets added to this list.
const { settings, load: loadSettings } = useAppSettings()
const { hasPermission } = useAuth()
const toast = useToast()

const fullLabel = ref('')
const emptyLabel = ref('')
const finishGoodLabel = ref('')
const saving = ref(false)

async function reload() {
  await loadSettings({ force: true })
  fullLabel.value = settings.value['bin.label.full']
  emptyLabel.value = settings.value['bin.label.empty']
  finishGoodLabel.value = settings.value['bin.label.finishGood']
}

onMounted(reload)

const canEdit = computed(() => hasPermission('setting.update'))
const dirty = computed(
  () =>
    fullLabel.value !== settings.value['bin.label.full']
    || emptyLabel.value !== settings.value['bin.label.empty']
    || finishGoodLabel.value !== settings.value['bin.label.finishGood'],
)

async function save() {
  if (
    !fullLabel.value.trim()
    || !emptyLabel.value.trim()
    || !finishGoodLabel.value.trim()
  ) {
    toast.error('All labels are required')
    return
  }
  saving.value = true
  try {
    settings.value = await updateAppSettings({
      'bin.label.full': fullLabel.value.trim(),
      'bin.label.empty': emptyLabel.value.trim(),
      'bin.label.finishGood': finishGoodLabel.value.trim(),
    })
    toast.success('Settings saved')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Failed to save settings')
  }
  saving.value = false
}
</script>

<template>
  <div class="animate-fade-in mx-auto w-full max-w-2xl">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Settings</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        Wording used across the app, changeable without a release
      </p>
    </div>

    <UiBaseCard class="space-y-5">
      <div>
        <h2 class="text-base font-bold text-[#0F1F52]">Bin Status Labels</h2>
        <p class="mt-1 text-xs leading-relaxed text-slate-500">
          RCS calls a bin holding a rack "full" and one without "empty",
          which reads backwards on the floor — a full bin is one with an
          empty rack standing ready. These are the words Checking Area shows
          instead. They change what is displayed only; nothing about how
          tasks behave.
        </p>
      </div>

      <div>
        <UiBaseInput
          v-model="fullLabel"
          label="Bin holds a rack (RCS: full)"
          placeholder="Rak Kosong Ready"
          :disabled="!canEdit"
        />
        <p class="mt-1 text-xs text-slate-500">nodeStatus 2</p>
      </div>

      <div>
        <UiBaseInput
          v-model="emptyLabel"
          label="Bin has no rack (RCS: empty)"
          placeholder="Rak Kosong Belum Ready"
          :disabled="!canEdit"
        />
        <p class="mt-1 text-xs text-slate-500">nodeStatus 0</p>
      </div>

      <div>
        <UiBaseInput
          v-model="finishGoodLabel"
          label="Finished goods delivered here"
          placeholder="Finish Good Ready"
          :disabled="!canEdit"
        />
        <p class="mt-1 text-xs text-slate-500">
          RCS has no state for this — it still reports the node as empty,
          because its "full" means an empty rack is waiting to be collected.
          Tracked separately so the two are never confused.
        </p>
      </div>

      <div v-if="canEdit" class="flex items-center gap-3">
        <UiBaseButton
          variant="gradient"
          :loading="saving"
          :disabled="!dirty"
          @click="save"
        >
          Save
        </UiBaseButton>
        <UiBaseButton v-if="dirty" variant="secondary" @click="reload">
          Reset
        </UiBaseButton>
      </div>
      <p v-else class="text-xs font-medium text-slate-400">
        You do not have permission to change settings.
      </p>
    </UiBaseCard>
  </div>
</template>
