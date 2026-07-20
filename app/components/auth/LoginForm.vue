<script setup lang="ts">
import type { Ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const { loginSchema } = useValidation()

const emit = defineEmits<{
  submit: [credentials: { identifier: string; password: string; rememberMe: boolean }]
}>()

const { handleSubmit, errors, defineField, isSubmitting } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { identifier: '', password: '', rememberMe: false },
})

const [identifier, identifierAttrs] = defineField('identifier') as unknown as [
  Ref<string>,
  Record<string, unknown>,
]
const [password, passwordAttrs] = defineField('password') as unknown as [
  Ref<string>,
  Record<string, unknown>,
]
const [rememberMe, rememberMeAttrs] = defineField('rememberMe') as unknown as [
  Ref<boolean>,
  Record<string, unknown>,
]

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    identifier: values.identifier,
    password: values.password,
    rememberMe: values.rememberMe ?? false,
  })
})
</script>

<template>
  <form novalidate class="space-y-4" @submit.prevent="onSubmit">
    <UiBaseInput
      v-bind="identifierAttrs"
      v-model="identifier"
      type="text"
      icon="user"
      label="Username"
      placeholder="Username"
      :error="errors.identifier"
      required
    />

    <UiBaseInput
      v-bind="passwordAttrs"
      v-model="password"
      type="password"
      icon="lock"
      label="Password"
      placeholder="Enter your password"
      :error="errors.password"
      required
    />

    <div class="flex items-center justify-between pt-0.5">
      <UiBaseCheckbox
        v-bind="rememberMeAttrs"
        v-model="rememberMe"
        label="Remember me"
      />
    </div>

    <div class="pt-1">
      <UiBaseButton
        type="submit"
        variant="primary"
        class="shadow-blue-glow-sm bg-gradient-to-r from-[#1739B0] to-[#4C8DFF] px-8 py-3.5 text-base hover:from-[#2049C7] hover:to-[#5C9AFF]"
        full-width
        :loading="isSubmitting"
      >
        {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
      </UiBaseButton>
    </div>
  </form>
</template>
