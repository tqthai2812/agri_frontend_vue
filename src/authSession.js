import { canVisit } from "@/router/adminAccess";

export function installAuthSession(auth, router) {
  let refreshTimer;
  async function reflectRoute() {
    const route = router.currentRoute.value;
    if (route.meta.requiresAuth && !auth.isLoggedIn)
      await router.replace({
        name: "login",
        query: { redirect: route.fullPath },
      });
    else if (auth.isLoggedIn && !canVisit(auth, route))
      await router.replace({ name: "forbidden" });
  }
  async function refresh() {
    if (document.visibilityState === "hidden") return;
    try {
      await auth.fetchUser();
      await reflectRoute();
    } catch {
      /* Keep current UI; server still authorizes every operation. */
    }
  }
  const stale = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 100);
  };
  const unauthorized = () => {
    auth.clearAuthData();
    void reflectRoute();
  };
  const storage = (event) => {
    if (event.key === "auth_sync") stale();
  };
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("auth:unauthorized", unauthorized);
  window.addEventListener("auth:permissions-stale", stale);
  window.addEventListener("auth:changed", reflectRoute);
  window.addEventListener("storage", storage);
  const timer = setInterval(() => {
    if (auth.isLoggedIn) void refresh();
  }, 60_000);
  return () => {
    clearInterval(timer);
    clearTimeout(refreshTimer);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
    window.removeEventListener("auth:unauthorized", unauthorized);
    window.removeEventListener("auth:permissions-stale", stale);
    window.removeEventListener("auth:changed", reflectRoute);
    window.removeEventListener("storage", storage);
  };
}