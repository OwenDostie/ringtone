import { reactive } from "vue";

export const store = reactive({
  websocket: {},
  setDinosaur(name, description) {
    this.dinosaur.name = name;
    this.dinosaur.description = description;
  },
});
