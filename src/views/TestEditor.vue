<template>
  <div class="editor-container">
    <div v-if="!isEditorReady" class="loading-message">
      编辑器加载中...
    </div>
    <div v-else-if="editor && isEditorInitialized" class="tiptap-editor">
      <editor
        :editor="editor"
        :model-value="content"
        @update:model-value="handleUpdate"
      />
    </div>
    <div v-else-if="editor" class="loading-message">
      编辑器初始化中...
      <p>编辑器实例状态: {{ JSON.stringify(editor) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

// 响应式状态
const content = ref('');
const isEditorReady = ref(false);
const isEditorInitialized = ref(false);
const editor = ref(null);
let Editor = null;
let StarterKit = null;

// 动态导入 tiptap 编辑器
onMounted(async () => {
  try {
    console.log('开始加载 tiptap 编辑器依赖...');
    // 动态导入编辑器组件
    const editorImport = await import('@tiptap/vue-3');
    Editor = editorImport.Editor;

    // 动态导入 StarterKit
    const starterKitImport = await import('@tiptap/starter-kit');
    StarterKit = starterKitImport.default;

    isEditorReady.value = true;
    console.log('tiptap 编辑器依赖加载成功');
  } catch (error) {
    console.error('加载 tiptap 编辑器依赖失败:', error);
  }
});

// 监视 isEditorReady 状态变化，创建编辑器实例
watch(isEditorReady, (newValue) => {
  if (newValue && !editor.value) {
    createEditor();
  }
});

// 监视编辑器实例，检查其状态
watch(editor, (newValue) => {
  if (newValue) {
    console.log('编辑器实例已更新:', newValue);
    // 检查编辑器实例是否有 isInitialized 属性
    console.log('编辑器 isInitialized 属性:', newValue.isInitialized);
    // 尝试直接检查编辑器是否已初始化
    if (newValue.view) {
      console.log('编辑器视图已创建');
      isEditorInitialized.value = true;
    }
  }
});

// 创建编辑器实例
function createEditor() {
  if (!Editor || !StarterKit) {
    console.error('编辑器依赖未加载完成，无法创建编辑器实例');
    return;
  }

  // 清理旧的编辑器实例
  if (editor.value) {
    editor.value.destroy();
    editor.value = null;
    isEditorInitialized.value = false;
  }

  // 创建新的编辑器实例
  try {
    editor.value = new Editor({
      content: content.value || '<p>请输入内容...</p>',
      extensions: [StarterKit],
      onUpdate: ({ editor }) => {
        content.value = editor.getHTML();
      },
      onInit: () => {
        console.log('编辑器已完成初始化');
        isEditorInitialized.value = true;
      }
    });
    console.log('编辑器实例创建成功');
  } catch (error) {
    console.error('创建编辑器实例失败:', error);
  }
}

// 处理内容更新
const handleUpdate = (newContent) => {
  content.value = newContent;
  console.log('内容更新:', newContent);
};

// 组件卸载时清理编辑器实例
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
    editor.value = null;
    isEditorInitialized.value = false;
    console.log('编辑器实例已销毁');
  }
});
</script>

<style scoped>
.editor-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-message {
  padding: 20px;
  text-align: center;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.tiptap-editor {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

/* 自定义 tiptap 编辑器样式 */
.tiptap {
  padding: 10px;
  min-height: 300px;
  outline: none;
}

.tiptap p {
  margin: 0 0 10px 0;
}
</style>
