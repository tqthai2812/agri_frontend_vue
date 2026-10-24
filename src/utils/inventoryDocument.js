export const documentTypes = {
  supplier_receipt: "Nhập nhà cung cấp",
  sale_issue: "Xuất bán",
  adjustment: "Điều chỉnh",
  opening_balance: "Tồn đầu kỳ",
};
export const documentStatuses = {
  draft: "Nháp",
  posted: "Đã ghi sổ",
  cancelled: "Đã hủy",
};
export const lotStatuses = {
  available: "Có thể bán",
  quarantined: "Cách ly",
  blocked: "Khóa",
};
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const errorText = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Không thể thực hiện thao tác.";
export const fieldErrors = (error) =>
  Object.entries(error?.response?.data?.errors || {}).flatMap(
    ([field, messages]) =>
      (Array.isArray(messages) ? messages : [messages]).map(
        (message) => `${field}: ${message}`,
      ),
  );
export function cents(value) {
  if (value === null || value === undefined || value === "") return null;
  const match = String(value).match(/^(-?)(\d{1,16})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  return (
    (match[1] ? -1n : 1n) *
    (BigInt(match[2]) * 100n + BigInt((match[3] || "").padEnd(2, "0")))
  );
}
export function money(value) {
  const amount = typeof value === "bigint" ? value : cents(value);
  if (amount === null) return "—";
  const absolute = amount < 0n ? -amount : amount;
  const fraction = absolute % 100n;
  return `${amount < 0n ? "-" : ""}${(absolute / 100n).toLocaleString("vi-VN")}${fraction ? "," + String(fraction).padStart(2, "0") : ""} ₫`;
}
export function lineValue(item) {
  const cost = cents(item.unit_cost);
  return cost === null || !/^-?\d+$/.test(String(item.quantity_change))
    ? null
    : cost * BigInt(item.quantity_change);
}
export function totalValue(items = []) {
  if (!items.length) return null;
  let sum = 0n;
  for (const item of items) {
    const value = lineValue(item);
    if (value === null) return null;
    sum += value;
  }
  return sum;
}
export function draftOf(document) {
  return {
    supplier_id: document?.supplier_id || "",
    document_date: document?.document_date || today(),
    note: document?.note || "",
    items: (document?.items || []).map((item) => ({
      ...item,
      unit_cost: item.unit_cost ?? "",
      note: item.note || "",
    })),
  };
}
export function draftPayload(form) {
  return {
    supplier_id: Number(form.supplier_id),
    document_date: form.document_date,
    note: form.note.trim() || null,
    items: form.items.map((item, index) => ({
      line_number: index + 1,
      package_id: Number(item.package_id),
      quantity_change: Number(item.quantity_change),
      unit_cost:
        item.unit_cost === "" || item.unit_cost === null
          ? null
          : String(item.unit_cost).trim(),
      note: (item.note || "").trim() || null,
    })),
  };
}
export function signature(document) {
  const payload = draftPayload(draftOf(document));
  payload.items = payload.items.map((item) => ({
    ...item,
    unit_cost: cents(item.unit_cost)?.toString() ?? null,
  }));
  return JSON.stringify(payload);
}
export function validateDraft(form) {
  if (
    !Number.isInteger(Number(form.supplier_id)) ||
    Number(form.supplier_id) < 1
  )
    return "Vui lòng chọn nhà cung cấp.";
  if (!form.document_date || form.document_date > today())
    return "Ngày chứng từ không được ở tương lai.";
  if (!form.items.length || form.items.length > 100)
    return "Phiếu cần từ 1 đến 100 dòng hàng.";
  for (const [index, item] of form.items.entries()) {
    if (
      !/^\d+$/.test(String(item.quantity_change)) ||
      Number(item.quantity_change) < 1 ||
      Number(item.quantity_change) > 2147483647
    )
      return `Dòng ${index + 1}: số lượng phải là số nguyên dương, tối đa 2.147.483.647.`;
    if (
      item.unit_cost !== "" &&
      item.unit_cost !== null &&
      !/^\d{1,10}(?:\.\d{1,2})?$/.test(String(item.unit_cost))
    )
      return `Dòng ${index + 1}: giá vốn tối đa 10 chữ số phần nguyên, 2 chữ số thập phân.`;
    const value = lineValue(item);
    if (value !== null && value > 999999999999999999n)
      return `Dòng ${index + 1}: thành tiền vượt giới hạn cho phép.`;
  }
  return "";
}
export function lotRows(document) {
  return document.items.map((item) => ({
    document_item_id: item.id,
    lot_code: "",
    manufactured_on: "",
    expires_on: "",
    status: "available",
    note: "",
  }));
}
export function lotPayload(rows) {
  return {
    lots: rows.map((row) => ({
      ...row,
      lot_code: row.lot_code.trim(),
      manufactured_on: row.manufactured_on || null,
      expires_on: row.expires_on || null,
      note: row.note.trim() || null,
    })),
  };
}
export function validateLots(rows) {
  for (const [index, row] of rows.entries()) {
    if (!row.lot_code.trim()) return `Dòng ${index + 1}: vui lòng nhập mã lô.`;
    if (row.manufactured_on > today())
      return `Dòng ${index + 1}: ngày sản xuất không được ở tương lai.`;
    if (
      row.manufactured_on &&
      row.expires_on &&
      row.expires_on < row.manufactured_on
    )
      return `Dòng ${index + 1}: hạn dùng không được trước ngày sản xuất.`;
  }
  return "";
}
