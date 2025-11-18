<template>
  <nav class="navbar">
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
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.nav-links {
  display: flex;
  gap: 0;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 4px;
  background: var(--color-bg-secondary);
}

.nav-links a {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-xl);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  text-decoration: none;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.nav-links a:hover:not(.active) {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.nav-links a.active {
  color: var(--color-primary);
  background: var(--color-bg-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .nav-content {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .nav-links {
    padding: 3px;
  }

  .nav-links a {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-xs);
  }

  .logo h1 {
    font-size: var(--font-size-base);
  }
}
</style>
