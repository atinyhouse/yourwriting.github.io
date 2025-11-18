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
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) 0;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--spacing-xl);
  padding-right: var(--spacing-xl);
}

.logo h1 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.nav-links a {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
  text-decoration: none;
  letter-spacing: -0.01em;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: calc(100% - var(--spacing-lg) * 2);
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
  transition: transform 0.2s ease;
}

.nav-links a:hover {
  color: var(--color-text-primary);
}

.nav-links a.active {
  color: var(--color-primary);
  font-weight: 600;
}

.nav-links a.active::after {
  transform: translateX(-50%) scaleX(1);
}

@media (max-width: 768px) {
  .nav-content {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .nav-links {
    gap: var(--spacing-xs);
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
