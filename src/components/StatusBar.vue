<template>
  <div class="status-bar">
    <div class="version"><em>V1.0.0</em></div>
  </div>
</template>

<script>
export default {
  name: "StatusBar"
}
</script>

<style scoped>
.status-bar {
  width: 100%;
  height: 30px;
  background: #2c3e50;
  color: white;
  border-radius: 0 0 10px 10px;
  z-index: 999;
}

.version {
  width: 100px;
  height: 30px;
  line-height: 30px;
  font-size: 14px;
  text-align: left;
  text-indent: 10px;
}
</style>