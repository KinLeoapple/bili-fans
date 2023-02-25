<script setup>
import SideBar from "@/components/SideBar.vue";
</script>

<template>
  <side-bar/>
</template>

<script>


export default {
  name: 'App',
}
</script>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 0;
  margin: 0;

}

#app {
  display: inline-flex;
  flex-direction: row;
}
</style>
