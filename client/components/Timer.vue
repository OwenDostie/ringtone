<template>
  <div>
    <p>{{ formatTime(time) }}</p>
  </div>
</template>

<script>
import moment from "moment";
import { defineComponent } from 'vue';

export default defineComponent({
  name: "Timer",
  props: {
    running: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: Number,
      default: 7 * 60 * 1000,
    },
  },
  watch: {
    running(newVal) {
      if (newVal) this.startT();
      else this.stopT();
    },
  },
  mounted() {
    if (this.running) this.startT();
  },
  data() {
    return {
      time: 0,
      timer: null,
      startTimestamp: null,
    };
  },
  methods: {
    stopT() {
      this.time = 0;
      clearInterval(this.timer);
    },
    startT() {
      this.resetT();
      this.startTimestamp = Date.now();
      this.timer = setInterval(() => {
        const elapsed = Date.now() - this.startTimestamp;
        this.time = Math.max(this.startTime - elapsed, 0); 

        if (this.time <= 0) {
          this.stopT();
          this.$emit('endTimer');
        }
      }, 50); 
    },
    resetT() {
      this.time = this.startTime;
      this.startTimestamp = Date.now(); 
    },
    formatTime(milliseconds) {
      return moment.utc(milliseconds).format("HH:mm:ss.SS");
    },
  },
  expose() {
    return {
      stop: this.stopT,
    };
  }
});
</script>

<style scoped>
p {
  font-weight: bold;
  font-size: x-large;
}
</style>