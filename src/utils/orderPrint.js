import printCss from "@/assets/order-print.css?raw";

export function formatPrintMoney(value) {
  if (value === null || value === undefined || value === "")
    return "Chưa xác định";
  const match = String(value).match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return "Chưa xác định";
  const whole = BigInt(match[1]).toLocaleString("vi-VN");
  const fraction = (match[2] || "").padEnd(2, "0");
  return `${whole}${fraction === "00" ? "" : `,${fraction}`} ₫`;
}

export function formatPrintDate(value, withTime = true) {
  if (!value) return "—";
  if (!withTime && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function escapeText(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

export async function printOrderElement(element, { title, allowed }) {
  const documentElement = element?.querySelector(".order-slip");
  if (!documentElement || !allowed())
    throw new Error("Phiếu đã thay đổi. Vui lòng mở lại.");
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;";
  let timeout;
  const cleanup = () => {
    window.clearTimeout(timeout);
    iframe.remove();
  };
  try {
    await new Promise((resolve, reject) => {
      timeout = window.setTimeout(
        () => reject(new Error("Không tải được bản in. Vui lòng thử lại.")),
        10000,
      );
      iframe.onload = resolve;
      iframe.onerror = () => reject(new Error("Không tải được bản in."));
      iframe.srcdoc = `<!doctype html><html lang="vi"><head><meta charset="UTF-8"><title>${escapeText(title)}</title><style>${printCss}</style></head><body>${documentElement.outerHTML}</body></html>`;
      document.body.appendChild(iframe);
    });
    window.clearTimeout(timeout);
    const printWindow = iframe.contentWindow;
    await printWindow.document.fonts?.ready;
    await new Promise((resolve) =>
      printWindow.requestAnimationFrame(() =>
        printWindow.requestAnimationFrame(resolve),
      ),
    );
    if (!allowed())
      throw new Error(
        "Đơn hoặc quyền truy cập đã thay đổi. Vui lòng mở lại phiếu.",
      );
    printWindow.addEventListener("afterprint", cleanup, { once: true });
    timeout = window.setTimeout(cleanup, 60000);
    printWindow.focus();
    printWindow.print();
  } catch (cause) {
    cleanup();
    throw cause;
  }
}
