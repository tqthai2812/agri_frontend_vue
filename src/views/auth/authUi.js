export function authError(
  error,
  fallback = "Có lỗi xảy ra. Vui lòng thử lại.",
) {
  const data = error?.response?.data;
  const messages = Object.values(data?.errors || {}).flat();

  if (error?.response?.status === 429) {
    return "Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.";
  }

  if (error?.response?.status === 419) {
    return "Phiên làm việc đã hết hạn. Vui lòng tải lại trang rồi thử lại.";
  }

  return messages[0] || data?.message || fallback;
}

export function defaultDestination(authStore, router) {
  const choices = [
    ["dashboard.view", "admin-dashboard"],
    ["product.view", "admin-products"],
    ["category.view", "admin-categories"],
    ["role.view", "admin-roles"],
  ];

  for (const [permission, name] of choices) {
    if (authStore.hasPermission(permission) && router.hasRoute(name)) {
      return { name };
    }
  }

  return router.hasRoute("profile") ? { name: "profile" } : { path: "/" };
}

export function loginDestination(redirect, authStore, router) {
  const isSafeRedirect =
    typeof redirect === "string" &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    !/[\\\r\n]/.test(redirect);

  if (isSafeRedirect) {
    const target = router.resolve(redirect);

    if (
      target.matched.length &&
      !target.meta.guest &&
      target.name !== "forbidden" &&
      (!target.meta.requiredPermission ||
        authStore.hasPermission(target.meta.requiredPermission))
    ) {
      return target.fullPath;
    }
  }

  return defaultDestination(authStore, router);
}
