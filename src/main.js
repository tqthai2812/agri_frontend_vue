import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";

import App from "./App.vue";
import router from "./router";

import { useAuthStore } from "@/stores/shared/authStore";
import { installAuthSession } from "@/authSession";

const app = createApp(App);

app.use(createPinia());
app.use(router);
installAuthSession(useAuthStore(), router);

app.mount("#app");