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
    resetWhenStart: {
      type: Boolean,
      default: false,
    },
    restWhenStop: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Number,
      default: 60 * 8 * 1000, // 8 minutes in milliseconds
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
      clearInterval(this.timer);
      if (this.restWhenStop) this.resetT();
    },
    startT() {
      if (this.resetWhenStart) this.resetT();
      this.time = this.startTime;
      this.timer = setInterval(() => {
        if (this.time <= 0) {
          clearInterval(this.timer);
          return;
        }
        this.time -= 10; // Decrease by 10ms for better accuracy
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
--