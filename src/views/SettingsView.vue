<template>
  <div class="settings-view">
    <div class="container">
      <h1>设置</h1>

      <!-- API 配置 -->
      <div class="section accent-red">
        <h2>DeepSeek API 配置</h2>

        <div class="form-group">
          <label>API Key</label>
          <div class="api-key-input">
            <input
              v-model="settings.deepseekApiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="sk-..."
            />
            <button @click="showApiKey = !showApiKey" class="secondary">
              {{ showApiKey ? '隐藏' : '显示' }}
            </button>
          </div>
          <p class="hint">
            获取 API Key: <a href="https://platform.deepseek.com" target="_blank">https://platform.deepseek.com</a>
            <br />
            API Key 仅保存在您的浏览器本地，不会上传到任何服务器
          </p>
        </div>

        <button @click="saveSettings" :disabled="!hasChanges">保存配置</button>
      </div>

      <!-- 模型参数 -->
      <div class="section">
        <h2>模型参数</h2>

        <div class="form-group">
          <label>Temperature ({{ settings.modelParams.temperature }})</label>
          <div class="range-wrapper">
            <input
              v-model.number="settings.modelParams.temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="custom-range"
            />
          </div>
          <p class="hint">控制输出的随机性。较低值更确定，较高值更有创造性。建议: 0.7</p>
        </div>

        <div class="form-group">
          <label>Max Tokens ({{ settings.modelParams.maxTokens }})</label>
          <div class="range-wrapper">
            <input
              v-model.number="settings.modelParams.maxTokens"
              type="range"
              min="500"
              max="4000"
              step="100"
              class="custom-range"
            />
          </div>
          <p class="hint">每次回复的最大长度。建议: 2000</p>
        </div>

        <button @click="saveSettings" :disabled="!hasChanges">保存参数</button>
      </div>

      <!-- 文风润色 -->
      <div class="section accent-blue">
        <h2>文风润色</h2>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="settings.enableStyleTransfer"
              type="checkbox"
            />
            启用文风润色
          </label>
          <p class="hint">开启后，AI 会根据您的文风库来调整回复风格</p>
        </div>

        <button @click="saveSettings" :disabled="!hasChanges">保存设置</button>
      </div>

      <!-- 数据管理 -->
      <div class="section">
        <h2>数据管理</h2>

        <div class="actions-grid">
          <div>
            <h3>导出数据</h3>
            <p>导出所有数据（不包含 API Key）为 JSON 文件</p>
            <button @click="exportData" class="secondary">导出</button>
          </div>

          <div>
            <h3>导入数据</h3>
            <p>从之前导出的 JSON 文件恢复数据</p>
            <input
              type="file"
              ref="importInput"
              @change="importData"
              accept=".json"
              style="display: none"
            />
            <button @click="$refs.importInput.click()" class="secondary">导入</button>
          </div>

          <div>
            <h3>清除所有数据</h3>
            <p>删除所有本地数据（文风库、对话、设置）</p>
            <button @click="clearAllData" class="delete-btn">清除数据</button>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div class="section">
        <h2>关于</h2>
        <p><strong>AI 文风助手</strong> v1.0</p>
        <p>一个基于个人文风库的智能写作工具</p>
        <p class="mt-sm">
          <a href="https://github.com" target="_blank">GitHub</a> |
          <a href="https://docs.deepseek.com" target="_blank">DeepSeek 文档</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  getSettings,
  saveSettings as saveSettingsStorage,
  exportAllData,
  importAllData,
  clearAllData as clearStorage
} from '../utils/storage'

const settings = ref({
  deepseekApiKey: '',
  modelParams: {
    temperature: 0.7,
    maxTokens: 2000
  },
  enableStyleTransfer: true
})

const originalSettings = ref(null)
const showApiKey = ref(false)
const hasChanges = ref(false)
const importInput = ref(null)

onMounted(async () => {
  settings.value = await getSettings()
  originalSettings.value = JSON.parse(JSON.stringify(settings.value))
})

watch(settings, () => {
  hasChanges.value = JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value)
}, { deep: true })

const saveSettings = async () => {
  try {
    await saveSettingsStorage(settings.value)
    originalSettings.value = JSON.parse(JSON.stringify(settings.value))
    hasChanges.value = false
    alert('设置已保存')
  } catch (error) {
    alert(`保存失败: ${error.message}`)
  }
}

const exportData = async () => {
  try {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `writing-style-ai-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert(`导出失败: ${error.message}`)
  }
}

const importData = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const content = await readFile(file)
    const data = JSON.parse(content)
    await importAllData(data)
    alert('数据导入成功！页面将刷新。')
    window.location.reload()
  } catch (error) {
    alert(`导入失败: ${error.message}`)
  }

  event.target.value = ''
}

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

const clearAllData = async () => {
  const confirm1 = confirm('确定要删除所有数据吗？此操作不可恢复！')
  if (!confirm1) return

  const confirm2 = confirm('最后确认：真的要删除所有数据吗？')
  if (!confirm2) return

  try {
    await clearStorage()
    alert('数据已清除！页面将刷新。')
    window.location.reload()
  } catch (error) {
    alert(`清除失败: ${error.message}`)
  }
}
</script>

<style scoped>
/* ========== 包豪斯现代风格 - 设置页面 ========== */

.settings-view {
  padding: var(--spacing-3xl) 0;
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
}

.container > h1 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3xl);
  text-align: center;
  position: relative;
}

.container > h1::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent-yellow), var(--color-accent-red));
  border-radius: var(--radius-full);
}

/* 区块样式 */
.section {
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-2xl);
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--color-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-base);
}

.section:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.section:hover::before {
  transform: scaleX(1);
}

/* 强调色区块 */
.section.accent-red::before {
  background: linear-gradient(90deg, var(--color-accent-red), var(--color-accent-yellow));
}

.section.accent-blue::before {
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent-teal));
}

.section h2 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xl);
  position: relative;
  padding-left: var(--spacing-md);
}

.section h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

/* 表单组 */
.form-group {
  margin-bottom: var(--spacing-xl);
  border: none;
  outline: none;
}

.form-group:last-of-type {
  margin-bottom: var(--spacing-lg);
}

label {
  display: block;
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 输入框样式 */
input[type="text"],
input[type="password"] {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  outline: none;
  transition: all var(--transition-fast);
}

input[type="text"]:hover,
input[type="password"]:hover {
  border-color: var(--color-border-hover);
  background: var(--color-bg-primary);
}

input[type="text"]:focus,
input[type="password"]:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-primary);
  box-shadow: 0 0 0 4px var(--color-primary-light);
}

/* 强制覆盖 range 输入的样式 - 移除所有边框 */
input[type="range"] {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

input[type="range"]:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* API Key 输入 */
.api-key-input {
  display: flex;
  gap: var(--spacing-md);
  align-items: stretch;
}

.api-key-input input {
  flex: 1;
}

.api-key-input button {
  padding: var(--spacing-md) var(--spacing-xl);
  white-space: nowrap;
}

/* 复选框 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  text-transform: none;
  font-weight: 500;
  cursor: pointer;
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.checkbox-label:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* 滑块外层容器 - 创建可见轨道 */
.range-wrapper {
  position: relative;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0;
  margin: var(--spacing-lg) 0;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 在wrapper上创建可见的轨道背景 - 包豪斯简洁风格 */
.range-wrapper::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  z-index: 0;
  pointer-events: none;
}

/* 滑块输入框本身 */
.custom-range {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 100%;
  height: 40px;
  background: transparent !important;
  outline: none !important;
  cursor: pointer;
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;
  border: none !important;
  box-shadow: none !important;
}

.custom-range:focus {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}

/* 移除默认轨道样式 */
.custom-range::-webkit-slider-runnable-track {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 100%;
  height: 4px;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.custom-range::-moz-range-track {
  width: 100%;
  height: 4px;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 滑块按钮 - Chrome/Safari - 包豪斯现代风格 */
.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border: none !important;
  outline: none !important;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
  transition: all var(--transition-fast);
  margin-top: -8px;
  position: relative;
}

.custom-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 10px rgba(52, 152, 219, 0.4);
  background: var(--color-primary-hover);
}

.custom-range::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.5);
}

/* 滑块按钮 - Firefox - 包豪斯现代风格 */
.custom-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border: none !important;
  outline: none !important;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
  transition: all var(--transition-fast);
  margin-top: 0;
}

.custom-range::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 10px rgba(52, 152, 219, 0.4);
  background: var(--color-primary-hover);
}

.custom-range::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.5);
}

/* 提示文本 */
.hint {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  background: var(--color-bg-secondary);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.hint a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.hint a:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

/* 按钮样式 */
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  box-shadow: var(--shadow-primary);
}

button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

button:hover:not(:disabled)::before {
  left: 100%;
}

button:hover:not(:disabled) {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

button.secondary {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

button.secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

button.delete-btn {
  background: var(--color-bg-primary);
  color: var(--color-accent-red);
  border: 2px solid var(--color-accent-red);
  box-shadow: var(--shadow-accent-red);
}

button.delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-accent-red) 0%, #c0392b 100%);
  color: white;
  border-color: var(--color-accent-red);
  box-shadow: var(--shadow-lg);
}

/* 操作网格 */
.actions-grid {
  display: grid;
  gap: var(--spacing-xl);
}

.actions-grid > div {
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.actions-grid > div:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.actions-grid h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.actions-grid p {
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

/* 关于部分 */
.section p {
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
}

.section p:last-child {
  margin-bottom: 0;
}

.section p strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.section p a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.section p a:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.mt-sm {
  margin-top: var(--spacing-md);
}

/* 响应式 */
@media (max-width: 768px) {
  .settings-view {
    padding: var(--spacing-2xl) 0;
  }

  .container {
    padding: 0 var(--spacing-md);
  }

  .container > h1 {
    font-size: var(--font-size-2xl);
  }

  .section {
    padding: var(--spacing-xl);
  }

  .api-key-input {
    flex-direction: column;
  }

  .api-key-input button {
    width: 100%;
  }
}
</style>
