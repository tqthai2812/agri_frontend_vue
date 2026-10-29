<script setup>
import { useEditor, EditorContent, VueNodeViewRenderer } from "@tiptap/vue-3";
import ArticleImageNode from "./ArticleImageNode.vue";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { ref, watch, onBeforeUnmount } from "vue";
const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: Boolean,
});
const emit = defineEmits(["update:modelValue", "image"]);
const editorRoot = ref();
const stickyTop = ref(80);
let headerObserver;
watch(
  editorRoot,
  (root) => {
    headerObserver?.disconnect();
    if (!root) return;
    // AppLayout renders its fixed Header next to main. Measure the real height
    // so browser zoom, responsive layout and later header changes stay aligned.
    const header = root
      .closest("main")
      ?.parentElement?.querySelector(":scope > header");
    const positionToolbar = () => {
      stickyTop.value = header
        ? Math.max(0, header.getBoundingClientRect().bottom) + 8
        : 8;
    };
    positionToolbar();
    if (header && typeof ResizeObserver !== "undefined") {
      headerObserver = new ResizeObserver(positionToolbar);
      headerObserver.observe(header);
    }
  },
  { flush: "post" },
);
const ArticleImage = Image.extend({
  addNodeView() {
    return VueNodeViewRenderer(ArticleImageNode);
  },
  addAttributes() {
    const img = (el) =>
      el.tagName === "FIGURE" ? el.querySelector("img") : el;
    return {
      src: { default: null, parseHTML: (el) => img(el)?.getAttribute("src") },
      alt: {
        default: "",
        parseHTML: (el) => img(el)?.getAttribute("alt") || "",
      },
      width: {
        default: null,
        parseHTML: (el) => img(el)?.getAttribute("width"),
      },
      caption: {
        default: "",
        parseHTML: (el) =>
          el.tagName === "FIGURE"
            ? el.querySelector("figcaption")?.textContent || ""
            : "",
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (el) => (el.querySelector("img") ? null : false),
      },
      { tag: "img[src]" },
    ];
  },
  renderHTML({ HTMLAttributes: a }) {
    const image = [
      "img",
      { src: a.src, alt: a.alt, ...(a.width ? { width: a.width } : {}) },
    ];
    return a.caption
      ? ["figure", {}, image, ["figcaption", {}, a.caption]]
      : ["figure", {}, image];
  },
});
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: { openOnClick: false },
      codeBlock: false,
    }),
    ArticleImage,
    TableKit,
  ],
  onUpdate: ({ editor }) => emit("update:modelValue", editor.getHTML()),
  editorProps: {
    attributes: {
      "aria-label": "Nội dung bài viết",
      role: "textbox",
      "aria-multiline": "true",
    },
  },
});
watch(
  () => props.modelValue,
  (v) => {
    if (editor.value && v !== editor.value.getHTML())
      editor.value.commands.setContent(v, { emitUpdate: false });
  },
);
watch(
  () => props.disabled,
  (v) => editor.value?.setEditable(!v),
  { immediate: true },
);
function run(command) {
  editor.value?.chain().focus()[command]().run();
}
function captionImage() {
  const caption = window.prompt(
    "Chú thích ảnh:",
    editor.value.getAttributes("image").caption || "",
  );
  if (caption !== null)
    editor.value.chain().focus().updateAttributes("image", { caption }).run();
}
function link() {
  const href = window.prompt(
    "Đường dẫn https:// hoặc mailto:",
    editor.value.getAttributes("link").href || "https://",
  );
  if (href === null) return;
  if (!href.trim()) {
    editor.value.chain().focus().unsetLink().run();
    return;
  }
  if (!/^(https?:\/\/|mailto:)/i.test(href)) {
    window.alert("Chỉ hỗ trợ http, https hoặc mailto.");
    return;
  }
  editor.value.chain().focus().setLink({ href }).run();
}
defineExpose({
  insertImage: (src, alt = "", caption = "") =>
    editor.value?.chain().focus().setImage({ src, alt, caption }).run(),
});
onBeforeUnmount(() => {
  headerObserver?.disconnect();
  editor.value?.destroy();
});
const buttons = [
  ["Đậm", "toggleBold", "bold"],
  ["Nghiêng", "toggleItalic", "italic"],
  ["Gạch chân", "toggleUnderline", "underline"],
  ["• Danh sách", "toggleBulletList", "bulletList"],
  ["1. Danh sách", "toggleOrderedList", "orderedList"],
  ["Trích dẫn", "toggleBlockquote", "blockquote"],
];
</script>
<template>
  <div
    v-if="editor"
    ref="editorRoot"
    class="news-editor-shell"
    :style="{ '--news-editor-sticky-top': `${stickyTop}px` }"
  >
    <div class="news-editor-toolbar-dock">
      <div class="toolbar" role="toolbar" aria-label="Định dạng bài viết">
        <select
          aria-label="Kiểu đoạn"
          :disabled="disabled"
          @change="
            Number($event.target.value)
              ? editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number($event.target.value) })
                  .run()
              : editor.chain().focus().setParagraph().run()
          "
        >
          <option value="0">Đoạn văn</option>
          <option value="2">Tiêu đề mục H2</option>
          <option value="3">Tiêu đề mục H3</option>
        </select>
        <button
          v-for="b in buttons"
          :key="b[1]"
          type="button"
          :class="{ active: editor.isActive(b[2]) }"
          :aria-pressed="editor.isActive(b[2])"
          :disabled="disabled"
          @click="run(b[1])"
        >
          {{ b[0] }}
        </button>
        <button type="button" :disabled="disabled" @click="link">
          Liên kết</button
        ><button type="button" :disabled="disabled" @click="emit('image')">
          Chèn ảnh</button
        ><button
          type="button"
          :disabled="disabled"
          @click="
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          "
        >
          Bảng
        </button>
        <template v-if="editor.isActive('table')"
          ><button type="button" @click="run('addRowAfter')">+ Hàng</button
          ><button type="button" @click="run('addColumnAfter')">+ Cột</button
          ><button type="button" @click="run('deleteRow')">Xóa hàng</button
          ><button type="button" @click="run('deleteColumn')">Xóa cột</button
          ><button type="button" @click="run('deleteTable')">
            Xóa bảng
          </button></template
        >
        <button
          type="button"
          :disabled="!editor.can().undo() || disabled"
          @click="run('undo')"
        >
          Hoàn tác</button
        ><button
          type="button"
          :disabled="!editor.can().redo() || disabled"
          @click="run('redo')"
        >
          Làm lại
        </button>
      </div>
      <div
        v-if="editor.isActive('image')"
        class="toolbar"
        role="toolbar"
        aria-label="Định dạng ảnh"
      >
        <button
          type="button"
          @click="editor.commands.updateAttributes('image', { width: null })"
        >
          Ảnh rộng
        </button>
        <button
          type="button"
          @click="editor.commands.updateAttributes('image', { width: 360 })"
        >
          Ảnh nhỏ
        </button>
        <button type="button" @click="captionImage">Sửa chú thích</button>
      </div>
    </div>
    <div class="editor nf-article"><EditorContent :editor="editor" /></div>
  </div>
</template>