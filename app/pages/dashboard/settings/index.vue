<script setup lang="ts">
import { updateAppSettings } from '~/services/app-setting.service'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Settings — YAZAKI'})
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
