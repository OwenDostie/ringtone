<template>
    <div>
      <p>{{ formatTime(time) }}</p>
    </div>
  </template>
  
  <script>
    import moment from "moment";
    export default {
      name: "Timer",
      props: {
        running: {
          type: Boolean,
          default: true,
        },
        startTime: {
          type: Number,
          default: 5 * 1000,
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
        return { time: 0, timer: null, startTimestamp: null };
      },
      methods: {
        stopT() {
          this.time = 0;
          clearInterval(this.timer);
        },
        startT() {
          this.resetT();
          this.startTimestamp = Date.now();  // Record the start time
          this.timer = setInterval(() => {
            const elapsed = Date.now() - this.startTimestamp;
            this.time = Math.max(this.startTime - elapsed, 0); // Calculate the remaining time
  
            if (this.time <= 0) {
              this.stopT();
              this.$emit('stopTimer');
            }
          }, 50);  // Use a smaller interval for more frequent checks
        },
        resetT() {
          this.time = this.startTime;
          this.startTimestamp = Date.now();  // Reset start time as well
        },
        formatTime(milliseconds) {
          return moment.utc(milliseconds).format("HH:mm:ss.SS");
        },
      },
    };
  </script>
  
<style scoped>
p {
  font-weight: bold;
  font-size: x-large;
}
</style>