<template>
  <div class="lucide-icon-picker">
    <div class="search-bar">
      <input
        v-model="search"
        type="text"
        placeholder="Search icons..."
        class="search-input"
      />
    </div>
    <div v-if="modelValue" class="current-value">
      <span class="current-label">Selected: <strong>{{ modelValue }}</strong></span>
      <button class="clear-btn" @click="$emit('update:modelValue', null)">Clear</button>
    </div>
    <div class="icon-grid">
      <button
        v-for="icon in filteredIcons"
        :key="icon"
        class="icon-btn"
        :class="{ selected: modelValue === icon }"
        :title="icon"
        @click="$emit('update:modelValue', icon)"
      >
        <span class="icon-name">{{ icon }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue?: string | null
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const search = ref('')

const ICONS = [
  'GraduationCap', 'Heart', 'Star', 'Users', 'Globe', 'Lightbulb',
  'Target', 'Award', 'BookOpen', 'Music', 'Camera', 'Map', 'Leaf',
  'Sun', 'Moon', 'Rocket', 'Shield', 'Zap', 'Flag', 'Home', 'Mail',
  'Phone', 'Calendar', 'Clock', 'FileText', 'Image', 'Video', 'Link',
  'Search', 'Settings', 'ChevronRight', 'ArrowRight', 'Plus', 'Check',
  'X', 'AlertCircle', 'Info', 'Smile', 'ThumbsUp', 'Handshake',
  'Building', 'Trees', 'Pencil', 'Megaphone', 'Gift', 'Sparkles',
  'TrendingUp', 'BarChart', 'PieChart', 'Activity', 'Eye', 'Lock',
  'Unlock', 'Key', 'CreditCard', 'Download', 'Upload', 'Share',
  'ExternalLink', 'MessageCircle', 'Bell', 'Bookmark', 'Tag', 'Layers',
]

const filteredIcons = computed(() =>
  search.value
    ? ICONS.filter(i => i.toLowerCase().includes(search.value.toLowerCase()))
    : ICONS
)
</script>

<style scoped>
.lucide-icon-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--theme--border-color, #e2e8f0);
  border-radius: 6px;
  font-size: 14px;
  background: var(--theme--background, white);
  color: var(--theme--foreground, #1e293b);
}
.current-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--theme--foreground-subdued, #64748b);
}
.clear-btn {
  padding: 2px 8px;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--theme--foreground-subdued, #64748b);
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}
.icon-btn {
  padding: 8px 4px;
  border: 1px solid var(--theme--border-color, #e2e8f0);
  border-radius: 6px;
  background: var(--theme--background, white);
  cursor: pointer;
  font-size: 11px;
  text-align: center;
  word-break: break-all;
  transition: border-color 0.15s, background 0.15s;
  color: var(--theme--foreground, #1e293b);
}
.icon-btn:hover {
  border-color: var(--theme--primary, #128f8b);
  background: var(--theme--primary-background, #f0fafa);
}
.icon-btn.selected {
  border-color: var(--theme--primary, #128f8b);
  background: var(--theme--primary-background, #e6f7f7);
  font-weight: 600;
}
.icon-name {
  display: block;
}
</style>
