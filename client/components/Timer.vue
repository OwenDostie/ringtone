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
    return { time: 0, timer: null };
  },
  methods: {
    stopT() {
      this.time = 0;
      clearInterval(this.timer);
    },
    startT() {
      this.resetT();
      this.timer = setInterval(() => {
        if (this.time <= 0) {
          this.stopT();
          this.$emit('stopTimer')
          return;
        }
        this.time -= 10;
      }, 10);
    },
    resetT() {
      this.time = this.startTime;
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