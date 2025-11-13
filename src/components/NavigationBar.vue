<template>
  <nav class="navbar">
    <div class="container">
      <div class="nav-content">
        <div class="logo">
          <h1>AI 文风助手</h1>
        </div>
        <div class="nav-links">
          <router-link to="/" :class="{ active: $route.path === '/' }">
            对话
          </router-link>
          <router-link to="/style-library" :class="{ active: $route.path === '/style-library' }">
            文风库
          </router-link>
          <router-link to="/settings" :class="{ active: $route.path === '/settings' }">
            设置
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.navbar {
  background-color: var(--color-white);
  border-bottom: 2px solid var(--color-black);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.logo h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  gap: var(--spacing-md);
}

.nav-links a {
  padding: 8px 16px;
  border: 2px solid transparent;
  border-bottom: 2px solid var(--color-gray);
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all var(--transition-normal);
}

.nav-links a:hover {
  border-bottom-color: var(--color-black);
}

.nav-links a.active {
  border-bottom-color: var(--color-red);
  font-weight: 700;
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }

  .nav-links {
    width: 100%;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .nav-links a {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
