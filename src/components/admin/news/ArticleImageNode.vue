<script setup>
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import { ref, onBeforeUnmount } from "vue";
const props = defineProps(nodeViewProps);
const editable = ref(props.editor.isEditable);
function syncEditable() {
  editable.value = props.editor.isEditable;
}
props.editor.on("update", syncEditable);
onBeforeUnmount(() => props.editor.off("update", syncEditable));
function remove() {
  if (!props.editor.isEditable) return;
  props.deleteNode();
  props.editor.commands.focus();
}
function caption(event) {
  if (!props.editor.isEditable || event.isComposing) return;
  const value = event.target.value;
  if (value !== (props.node.attrs.caption || "")) {
    props.updateAttributes({ caption: value });
  }
}
</script>

<template>
  <NodeViewWrapper
    as="figure"
    class="news-image-node"
    :class="{ 'is-selected': selected }"
    :style="{ width: node.attrs.width ? `${node.attrs.width}px` : '100%' }"
    contenteditable="false"
  >
    <img
      :src="node.attrs.src"
      :alt="node.attrs.alt || ''"
      :width="node.attrs.width || undefined"
      data-drag-handle
    />
    <button
      v-if="editable"
      type="button"
      class="news-image-remove"
      aria-label="Xóa ảnh khỏi nội dung"
      title="Xóa ảnh khỏi nội dung"
      @pointerdown.stop.prevent
      @click.stop.prevent="remove"
    >
      ×
    </button>
    <figcaption
      v-if="editable || node.attrs.caption"
      class="news-image-caption"
    >
      <input
        v-if="editable"
        type="text"
        class="news-image-caption-input"
        :value="node.attrs.caption || ''"
        maxlength="500"
        aria-label="Chú thích ảnh"
        placeholder="Nhập chú thích ảnh…"
        autocomplete="off"
        @input="caption"
        @compositionend="caption"
        @pointerdown.stop
        @click.stop
        @keydown.stop
        @keydown.enter.prevent
      />
      <span v-else>{{ node.attrs.caption }}</span>
    </figcaption>
  </NodeViewWrapper>
</template>