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
      default: false,
    },
    turnLength: {
      type: Number,
      default: 7 * 60 * 1000,
    },
  },
  watch: {
    running(newVal) {
      if (newVal) {
        this.startT();
      }
      else this.stopT();
    }
  },
  mounted() {
    console.log("Timer mounted")
    if (this.running) {
      this.startT();
    }
  },
  data() {
    return {
      time: 0,
      timer: null,
      localStartTimestamp: null,
    };
  },
  methods: {
    stopT() {
      console.log("stoping tinmer")
      this.time = 0;
      clearInterval(this.timer);
    },
    startT() {
      this.resetT();
      this.timer = setInterval(() => {
        const elapsed = new Date().getTime() - this.localStartTimestamp;
        this.time = Math.max(this.turnLength - elapsed, 0); 

        if (this.time <= 0) {
          this.stopT();
          this.$emit('endTimer');
        }
      }, 50); 
    },
    resetT() {
      this.time = this.turnLength;
      this.localStartTimestamp = new Date().getTime(); 
    },
    formatTime(milliseconds) {
      return moment.utc(milliseconds).format("HH:mm:ss.SS");
    },
  },
  expose() {
    return {
      stopT: this.stopT,
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