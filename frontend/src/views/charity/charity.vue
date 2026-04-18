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
      <Vueform> 
      <TextElement name="hello_world" label="Hello" placeholder="World" />
    </Vueform>

     <Vueform
    size="md"
    :display-errors="false"
    add-class="vf-create-account"
  >
    <StaticElement
      name="register_title"
      content="Create account"
      tag="h1"
    />
    <StaticElement
      name="divider"
      tag="hr"
    />
    <GroupElement
      name="container"
      description="Make sure it matches your legal name"
    >
      <TextElement
        name="first_name"
        placeholder="First name"
        :columns="{
          container: 6,
          label: 12,
          wrapper: 12,
        }"
        field-name="First name"
        :rules="[
          'required',
          'max:255',
        ]"
      />
      <TextElement
        name="last_name"
        placeholder="Last name"
        :columns="{
          container: 6,
          label: 12,
          wrapper: 12,
        }"
        field-name="Last name"
        :rules="[
          'required',
          'max:255',
        ]"
      />
    </GroupElement>
    <CheckboxElement
      name="marketing_emails"
      text="I want to recieve marketing emails"
    />
    <StaticElement
      name="divider_1"
      tag="hr"
    />
    <ButtonElement
      name="register"
      :submits="true"
      button-label="Create account"
      :full="true"
      size="lg"
    />
  </Vueform>

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
