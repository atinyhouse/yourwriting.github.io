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
          <input
            v-model.number="settings.modelParams.temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
          />
          <p class="hint">控制输出的随机性。较低值更确定，较高值更有创造性。建议: 0.7</p>
        </div>

        <div class="form-group">
          <label>Max Tokens ({{ settings.modelParams.maxTokens }})</label>
          <input
            v-model.number="settings.modelParams.maxTokens"
            type="range"
            min="500"
            max="4000"
            step="100"
          />
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
.settings-view {
  padding: var(--spacing-lg) 0;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:last-of-type {
  margin-bottom: var(--spacing-md);
}

label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 14px;
}

.api-key-input {
  display: flex;
  gap: var(--spacing-sm);
}

.api-key-input input {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-transform: none;
  font-weight: 500;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.hint {
  margin-top: var(--spacing-xs);
  font-size: 12px;
  color: var(--color-gray-dark);
  line-height: 1.5;
}

.hint a {
  color: var(--color-blue);
  border-bottom-color: var(--color-blue);
}

input[type="range"] {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
}

.actions-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.actions-grid > div {
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-gray);
}

.actions-grid > div:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.actions-grid h3 {
  margin-bottom: var(--spacing-xs);
  font-size: 16px;
}

.actions-grid p {
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-dark);
  font-size: 14px;
}

.delete-btn {
  background-color: var(--color-white);
  color: var(--color-red);
  border-color: var(--color-red);
}

.delete-btn:hover {
  background-color: var(--color-red);
  color: var(--color-white);
}
</style>
