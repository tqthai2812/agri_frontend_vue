export const lotStatuses = [
  { value: "available", label: "Khả dụng" },
  { value: "quarantined", label: "Cách ly" },
  { value: "blocked", label: "Bị khóa" },
];

export function quantity(value) {
  return value === null || value === undefined ? "—" : value;
}

export function money(value) {
  if (value === null || value === undefined || value === "") {
    return "Chưa rõ";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 4,
  }).format(amount);
}

export function dateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("vi-VN");
}

export function dateOnly(value) {
  if (!value) {
    return "Không có";
  }

  const raw = String(value).slice(0, 10);
  const parts = raw.split("-");

  return parts.length === 3 ? parts.reverse().join("/") : raw;
}

export function statusLabel(status) {
  return (
    lotStatuses.find((item) => item.value === status)?.label || status || "—"
  );
}

export function stockBadge(status) {
  return (
    {
      available: "badge-active",
      low: "badge-pending",
      out: "badge-inactive",
    }[status] || "badge-gray"
  );
}
