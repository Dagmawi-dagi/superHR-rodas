<template>
  <div class="py-16">
    <Switch
      @click="toggleDarkMode"
      v-model="enabled"
      :class="enabled ? 'bg-teal-900' : 'bg-teal-700'"
      class="relative inline-flex h-[38px] w-[74px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
    >
      <span class="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        :class="enabled ? 'translate-x-9' : 'translate-x-0'"
        class="pointer-events-none inline-block h-[34px] w-[34px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
      />
    </Switch>
  </div>

  <h1 class="text-3xl font-bold underline bg-red-200 dark:bg-gray-200 text-yellow-200  dark:text-red-200">
    Hello world!
  </h1>

</template>

<script setup>
import { ref } from 'vue'
import { Switch } from '@headlessui/vue'


function toggleDarkMode() {
  const html = document.documentElement; // <html>
  html.classList.toggle('dark');
}

const enabled = ref(false)
</script>
