import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css' // Tailwind import

// for Advanced form creation and form control 
import Vueform from '@vueform/vueform'
import vueformConfig from './../vueform.config'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vueform, vueformConfig)
app.mount('#app')