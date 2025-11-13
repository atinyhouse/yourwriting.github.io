<template>
  <div id="app">
    <NavigationBar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import NavigationBar from './components/NavigationBar.vue'
</script>

<style>
#app {
  min-height: 100vh;
  background-color: var(--color-white);
}

main {
  min-height: calc(100vh - 80px);
}
</style>
