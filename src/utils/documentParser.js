/**
 * 文档解析工具
 * 支持 TXT, MD, DOCX, PDF 格式
 */

import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/**
 * 读取文本文件 (TXT, MD)
 */
export const readTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/**
 * 读取 Word 文档 (.docx)
 */
export const readWordFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    if (result.messages && result.messages.length > 0) {
      console.warn('Word 文档解析警告:', result.messages)
    }

    return result.value || ''
  } catch (error) {
    console.error('Word 文档解析失败:', error)
    throw new Error('Word 文档解析失败: ' + error.message)
  }
}

/**
 * 读取 PDF 文件
 */
export const readPdfFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ''

    // 遍历所有页面
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // 提取文本
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')

      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    console.error('PDF 文件解析失败:', error)
    throw new Error('PDF 文件解析失败: ' + error.message)
  }
}

/**
 * 根据文件类型自动选择解析方法
 */
export const parseDocument = async (file) => {
  const fileName = file.name.toLowerCase()

  // 判断文件类型
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return await readTextFile(file)
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    // .doc 格式较老，mammoth 主要支持 .docx
    if (fileName.endsWith('.doc')) {
      throw new Error('不支持 .doc 格式，请转换为 .docx 格式')
    }
    return await readWordFile(file)
  } else if (fileName.endsWith('.pdf')) {
    return await readPdfFile(file)
  } else {
    throw new Error(`不支持的文件格式: ${fileName}`)
  }
}

/**
 * 获取支持的文件扩展名列表
 */
export const getSupportedExtensions = () => {
  return ['.txt', '.md', '.docx', '.pdf']
}

/**
 * 获取文件选择器的 accept 属性值
 */
export const getAcceptString = () => {
  return '.txt,.md,.docx,.pdf'
}

/**
 * 验证文件大小（默认最大 10MB）
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`文件大小超过限制（最大 ${maxSizeMB}MB）`)
  }
  return true
}
