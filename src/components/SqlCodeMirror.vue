<template>
  <div class="sql-codemirror-wrapper">
    <Codemirror
      ref="codemirrorRef"
      v-model:value="modelValueProxy"
      :options="mergedOptions"
      border
      style="width: 100%; height: 100%;"
      @change="$emit('change', $event)"
      @input="$emit('input', $event)"
      @ready="$emit('ready', $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineExpose } from 'vue'
import Codemirror from 'codemirror-editor-vue3'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/sql/sql.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Object,
    default: () => ({})
  }
})
const emits = defineEmits(['update:modelValue', 'change', 'input', 'ready'])

const modelValueProxy = computed({
  get: () => props.modelValue,
  set: v => emits('update:modelValue', v)
})

const mergedOptions = computed(() => ({
  mode: 'text/x-sql',
  lineNumbers: true,
  theme: 'default',
  ...props.options
}))

const codemirrorRef = ref(null)

defineExpose({
  refresh: () => {
    if (codemirrorRef.value && codemirrorRef.value.editor) {
      codemirrorRef.value.editor.refresh()
    }
  }
})
</script>

<style scoped>
.sql-codemirror-wrapper {
  width: 100%;
  height: 500px;
}
:deep(.sql-codemirror-wrapper) {
  width: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
  display: block;
  flex: 1 1 100%;
  align-self: flex-start;
  box-sizing: border-box;
}
:deep(.el-form-item__content) {
  text-align: left;
  justify-content: flex-start;
  align-items: flex-start;
  padding-left: 0;
  margin-left: 0;
  height: 300px;
  min-height: 300px;
  display: block;
  box-sizing: border-box;
}
:deep(.CodeMirror) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border: none;
  background: #fff;
  overflow: visible;
  font-size: 16px;
}
:deep(.CodeMirror-scroll) {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: none;
  background: #fff;
  overflow: auto;
}
:deep(.CodeMirror-lines),
:deep(.CodeMirror pre),
:deep(.CodeMirror-line),
:deep(.CodeMirror-cursor) {
  text-align: left;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
:deep(.CodeMirror-lines) {
  padding-left: 10px;
}
:deep(.CodeMirror-line) {
  line-height: 0.5;
  font-size: 10px;
  padding: 0;
  margin: 0;
}
:deep(.CodeMirror-gutters) {
  width: 0;
  min-width: 0;
  background: #fff;
  border-right: none;
  display: none;
}
</style> 