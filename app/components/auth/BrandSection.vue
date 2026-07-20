<script setup lang="ts">
const features = [
  { label: 'Enterprise-grade security' },
  { label: 'Real-time dashboard & analytics' },
  { label: 'Multi-platform access, anytime' },
]
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden"
  >
    <!-- Background -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-[#01ADEF] via-[#ffffff] to-[#014B8A]"
    />

    <!-- Pattern -->
    <div
      class="absolute inset-0 opacity-10"
      style="
        background-image: radial-gradient(
          circle at 1px 1px,
          white 1px,
          transparent 0
        );
        background-size: 30px 30px;
      "
    />

    <!-- Decorative blur -->
    <div
      class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
    />
    <div
      class="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#014B8A]/50 blur-3xl"
    />

    <!-- Content -->
    <div
      class="relative z-10 flex max-w-md flex-col items-center px-6 text-center text-white"
    >
      <!-- Logo -->
      <div
        class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md shadow-xl"
      >
        <img
          src="assets/images/profile.jpg"
          alt="Company Logo"
          class="h-16 w-16 object-contain"
          loading="lazy"
        />
      </div>

      <!-- Company Name -->
      <h1 class="text-5xl font-bold tracking-tight">
        Misel
      </h1>

      <!-- Tagline -->
      <p class="font-medium mt-3 text-white/80">
        Digital Solution<br>
        for Better Future
      </p>

      <!-- Divider -->
      <div class="my-8 h-px w-32 bg-white/20" />

      <!-- Features -->
      <div class="w-full space-y-3">
        <div
          v-for="feature in features"
          :key="feature.label"
          class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
        >
          <div
            class="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"
          >
            ✓
          </div>

          <span class="text-sm">
            {{ feature.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>