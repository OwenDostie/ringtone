import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../components/HomePage.vue";
import GamePage from "../components/GamePage.vue";
import SongBrowser from "../components/SongBrowser.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/:game",
    name: "game",
    component: GamePage,
  },
  {
    path: "/songbrowser",
    name: "songbrowser",
    component: SongBrowser
  }
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});


export default router;
