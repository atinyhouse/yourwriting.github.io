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
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-sm);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
}

.logo h1 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.nav-links {
  display: flex;
  gap: var(--spacing-xs);
}

.nav-links a {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  background: transparent;
}

.nav-links a:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.nav-links a.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .nav-links {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .logo h1 {
    font-size: var(--font-size-base);
  }
}
</style>
