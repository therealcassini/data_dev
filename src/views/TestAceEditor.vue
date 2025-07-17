<template>
  <div style="padding: 24px;">
    <div>测试 SQL 高亮（textarea + highlight.js）</div>
    <SqlTextareaHighlight v-model="sql" />
  </div>
</template>
<script setup>
import { ref } from 'vue'
import SqlTextareaHighlight from '../components/SqlTextareaHighlight.vue'
const sql = ref('SELECT * FROM users;')
</script> 