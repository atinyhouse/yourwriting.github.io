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
  padding: var(--spacing-lg) var(--spacing-xl);
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
  gap: var(--spacing-xl);
  align-items: center;
}

.nav-links a {
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
  text-decoration: none;
}

.nav-links a:hover {
  color: var(--color-text-primary);
}

.nav-links a.active {
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .nav-content {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .nav-links {
    gap: var(--spacing-lg);
  }

  .nav-links a {
    font-size: var(--font-size-xs);
  }

  .logo h1 {
    font-size: var(--font-size-base);
  }
}
</style>
