<script setup lang="ts">
import jsQR from 'jsqr'

// Decodes the same QR labels this app prints (see UiQrCodeModal — trolley
// code, location code), using an ordinary phone camera, so a handheld
// barcode scanner isn't required to run a Trolley Task.
interface Props {
  modelValue: boolean
  title?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Scan QR Code',
  hint: 'Point the camera at the QR label',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  scanned: [value: string]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const errorMessage = ref<string | null>(null)
const starting = ref(false)

let stream: MediaStream | null = null
let frameHandle: number | null = null
let canvas: HTMLCanvasElement | null = null

// jsQR is pure JS, so decoding a full-resolution frame every tick costs far
// more than the scan needs — the frame is downscaled to this width first.
const DECODE_WIDTH = 480

async function start() {
  errorMessage.value = null

  // getUserMedia only exists on a secure origin (https, or localhost). Over
  // plain http on a LAN IP the browser hides it entirely — by far the most
  // common reason "the camera doesn't work on my phone", so it's called out
  // specifically rather than lumped in with a generic failure.
  if (!navigator.mediaDevices?.getUserMedia) {
    errorMessage.value = window.isSecureContext
      ? 'This browser does not support camera access.'
      : 'Camera access needs a secure connection (HTTPS). Open this page over HTTPS, or scan with a handheld scanner / type the code instead.'
    return
  }

  starting.value = true
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    const video = videoRef.value
    if (!video) return
    video.srcObject = stream
    await video.play()
    canvas = document.createElement('canvas')
    frameHandle = requestAnimationFrame(tick)
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    errorMessage.value =
      name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow it in the browser settings, then try again.'
        : name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : 'Could not start the camera.'
  } finally {
    starting.value = false
  }
}

function tick() {
  const video = videoRef.value
  if (!video || !canvas) return

  if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
    const width = DECODE_WIDTH
    const height = Math.round((video.videoHeight / video.videoWidth) * width)
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context) {
      context.drawImage(video, 0, 0, width, height)
      const frame = context.getImageData(0, 0, width, height)
      const result = jsQR(frame.data, width, height, {
        inversionAttempts: 'dontInvert',
      })
      const value = result?.data?.trim()
      if (value) {
        emit('scanned', value)
        emit('update:modelValue', false)
        return
      }
    }
  }

  frameHandle = requestAnimationFrame(tick)
}

function stop() {
  if (frameHandle !== null) {
    cancelAnimationFrame(frameHandle)
    frameHandle = null
  }
  // Releases the camera — without this the phone keeps the capture LED on
  // and holds the device busy for other tabs/apps.
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  canvas = null
  if (videoRef.value) videoRef.value.srcObject = null
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) start()
    else stop()
  },
)

onBeforeUnmount(stop)
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-3">
      <div v-if="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        {{ errorMessage }}
      </div>

      <template v-else>
        <div class="relative overflow-hidden rounded-2xl bg-slate-900">
          <video
            ref="videoRef"
            class="h-64 w-full object-cover"
            playsinline
            muted
          />
          <!-- Aiming frame — purely visual, jsQR reads the whole frame. -->
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div class="h-40 w-40 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          <p v-if="starting" class="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/80">
            Starting camera…
          </p>
        </div>
        <p class="text-center text-xs font-medium text-slate-500">{{ hint }}</p>
      </template>
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('update:modelValue', false)">Close</UiBaseButton>
    </template>
  </UiBaseModal>
</template>
