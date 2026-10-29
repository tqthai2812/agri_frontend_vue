export default [
  {
    path: "articles/create",
    name: "admin-article-create",
    component: () => import("@/views/ArticleEditor.vue"),
    meta: { title: "Viết bài mới", requiredPermission: "article.create" },
  },
  {
    path: "articles/:id/edit",
    name: "admin-article-edit",
    component: () => import("@/views/ArticleEditor.vue"),
    meta: { title: "Chỉnh sửa bài viết", requiredPermission: "article.update" },
  },
  {
    path: "article-comments",
    name: "admin-news-comments",
    component: () => import("@/views/NewsComments.vue"),
    meta: { title: "Bình luận bài viết", requiredPermission: "article.update" },
  },
];