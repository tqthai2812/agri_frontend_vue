export const adminSections = [
  {
    title: "TỔNG QUAN",
    items: [
      ["admin-dashboard", "Bảng điều khiển", "solar:home-2-bold-duotone"],
      ["admin-orders", "Đơn hàng", "solar:cart-large-2-bold-duotone"],
      ["admin-products", "Sản phẩm", "solar:bag-bold-duotone"],
      ["admin-categories", "Danh mục", "solar:sort-bold-duotone"],
      ["admin-discounts", "Voucher", "solar:tag-price-bold-duotone"],
    ],
  },
  {
    title: "KHO HÀNG",
    items: [
      ["admin-inventory", "Hàng tồn kho", "solar:box-bold-duotone"],
      ["admin-suppliers", "Nhà cung cấp", "solar:delivery-bold-duotone"],
      [
        "admin-inventory-documents",
        "Phiếu kho",
        "solar:clipboard-list-bold-duotone",
      ],
      [
        "admin-inventory-report",
        "Báo cáo kho",
        "solar:chart-square-bold-duotone",
      ],
      [
        "admin-delivery-methods",
        "Phương thức giao hàng",
        "solar:delivery-bold-duotone",
      ],
    ],
  },
  {
    title: "NỘI DUNG & HỖ TRỢ",
    items: [
      ["admin-articles", "Bài viết", "solar:notes-bold-duotone"],
      [
        "admin-news-comments",
        "Bình luận bài viết",
        "solar:chat-round-dots-bold-duotone",
      ],
      ["admin-gallery", "Trưng bày", "solar:gallery-bold-duotone"],
      ["admin-reviews", "Đánh giá", "solar:star-bold-duotone"],
      ["admin-contacts", "Liên hệ", "solar:chat-round-line-bold-duotone"],
    ],
  },
  {
    title: "CHI PHÍ & BÁO CÁO",
    items: [
      ["admin-expenses", "Chi phí", "solar:wallet-money-bold-duotone"],
      [
        "admin-expense-categories",
        "Danh mục chi phí",
        "solar:folder-bold-duotone",
      ],
      [
        "admin-profit-report",
        "Báo cáo lợi nhuận",
        "solar:chart-2-bold-duotone",
      ],
      ["admin-data-exports", "Tệp đã xuất", "mdi:file-excel-outline"],
    ],
  },
  {
    title: "TIỆN ÍCH NHÀ NÔNG",
    items: [
      ["admin-crops", "Cây trồng", "solar:leaf-bold-duotone"],
      [
        "admin-usage-guides",
        "Hướng dẫn sử dụng",
        "solar:document-text-bold-duotone",
      ],
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      [
        "admin-artisans",
        "Người dùng",
        "solar:users-group-rounded-bold-duotone",
      ],
      ["admin-settings", "Cài đặt", "solar:settings-bold-duotone"],
    ],
  },
];

export const accessLinks = [
  ["admin-roles", "Quản lý vai trò", "solar:shield-bold-duotone"],
  ["admin-permissions", "Danh sách quyền", "solar:key-bold-duotone"],
  [
    "admin-user-access",
    "Phân quyền tài khoản",
    "solar:users-group-rounded-bold-duotone",
  ],
];

export function canVisit(auth, route) {
  const permission = route?.meta?.requiredPermission;
  return (
    !!route &&
    (!permission ||
      (Array.isArray(permission)
        ? permission.every((p) => auth.hasPermission(p))
        : auth.hasPermission(permission)))
  );
}

export function allowedNavigation(router, auth) {
  const records = new Map(router.getRoutes().map((r) => [r.name, r]));
  return adminSections
    .map((section) => ({
      ...section,
      items: section.items.filter(([name]) =>
        canVisit(auth, records.get(name)),
      ),
    }))
    .filter((section) => section.items.length);
}

export function firstDestination(auth, router) {
  const records = new Map(router.getRoutes().map((r) => [r.name, r]));
  for (const [name] of [
    ...adminSections.flatMap((s) => s.items),
    ...accessLinks,
  ]) {
    if (canVisit(auth, records.get(name))) return { name };
  }
  return router.hasRoute("profile") ? { name: "profile" } : { name: "home" };
}