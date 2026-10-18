const MAX_STOCK = 2147483647;
const MAX_MONEY = 999999999999999999n;
const cacheKey = (userId) => `nfarmhouse.inventory-adjustment.v1.${userId}`;

export function getPendingAdjustment(userId) {
  if (!userId) return null;
  try {
    const task = JSON.parse(sessionStorage.getItem(cacheKey(userId)) || "null");
    const p = task?.payload;
    if (
      Number(task?.user_id) !== Number(userId) ||
      !p ||
      p.transaction_type !== "adjustment" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        p.event_key,
      ) ||
      !Number.isSafeInteger(p.package_id) ||
      p.package_id <= 0 ||
      !Number.isSafeInteger(p.lot_id) ||
      p.lot_id <= 0 ||
      !Number.isSafeInteger(p.quantity_change) ||
      !p.quantity_change ||
      Math.abs(p.quantity_change) > MAX_STOCK ||
      typeof p.note !== "string"
    )
      return null;
    return task;
  } catch {
    return null;
  }
}

export function rememberAdjustment(task) {
  try {
    sessionStorage.setItem(cacheKey(task.user_id), JSON.stringify(task));
  } catch {
    throw new Error(
      "Không lưu được thao tác để kiểm tra lại khi mất kết nối. Chưa gửi yêu cầu ghi sổ.",
    );
  }
}

export function forgetAdjustment(userId, eventKey) {
  const task = getPendingAdjustment(userId);
  if (task?.payload.event_key === eventKey)
    sessionStorage.removeItem(cacheKey(userId));
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function adjustmentChange(form) {
  const count = Number(form.quantity);
  if (!Number.isSafeInteger(count) || count <= 0 || count > MAX_STOCK)
    return null;
  return form.direction === "decrease" ? -count : count;
}

export function estimatedAdjustmentCost(unitCost, count) {
  const match = String(unitCost ?? "").match(/^(\d{1,14})(?:\.(\d{1,4}))?$/);
  if (!match || !Number.isSafeInteger(count) || count <= 0) return null;
  const tenThousandths =
    BigInt(match[1]) * 10000n + BigInt((match[2] || "").padEnd(4, "0"));
  const cents = (tenThousandths * BigInt(count) + 50n) / 100n;
  if (cents > MAX_MONEY) return null;
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

export function adjustmentProblems(context, form) {
  if (!context) return ["Chưa tải được dữ liệu lô hiện tại."];
  const change = adjustmentChange(form);
  const problems = [];
  if (!context.stock.consistent)
    problems.push("Tồn vật lý chưa khớp tổng tồn lô. Cần đối chiếu kho trước.");
  if (change === null)
    problems.push("Nhập số lượng nguyên từ 1 đến 2.147.483.647.");
  if (!form.note.trim()) problems.push("Vui lòng nhập lý do điều chỉnh.");
  if (form.note.trim().length > 1000)
    problems.push("Lý do tối đa 1.000 ký tự.");
  if (change !== null) {
    const lotAfter = context.lot.quantity_on_hand + change;
    const physicalAfter = context.stock.physical + change;
    if (lotAfter < 0) problems.push("Số lượng giảm vượt tồn của lô.");
    if (
      physicalAfter < 0 ||
      lotAfter > MAX_STOCK ||
      physicalAfter > MAX_STOCK
    ) {
      problems.push("Tồn sau điều chỉnh vượt giới hạn cho phép.");
    }
    const eligibleAfter =
      context.stock.eligible + (context.lot.eligible ? change : 0);
    if (
      eligibleAfter < Math.min(context.stock.eligible, context.stock.reserved)
    ) {
      problems.push(
        "Điều chỉnh sẽ làm thiếu hàng hợp lệ cho các đơn đang giữ.",
      );
    }
    if (change < 0) {
      if (estimatedAdjustmentCost(context.lot.unit_cost, -change) === null) {
        problems.push(
          "Lô chưa xác định giá vốn hoặc giá trị ghi giảm vượt giới hạn. Chưa thể ghi giảm.",
        );
      }
      if (
        !context.categories.some(
          (category) => Number(category.id) === Number(form.category),
        )
      ) {
        problems.push("Vui lòng chọn nhóm chi phí đang hoạt động.");
      }
    } else if (
      context.lot.unit_cost !== null &&
      estimatedAdjustmentCost(context.lot.unit_cost, change) === null
    ) {
      problems.push("Giá trị biến động vượt giới hạn cho phép.");
    }
  }
  return problems;
}

export function adjustmentPayload(context, form) {
  const problems = adjustmentProblems(context, form);
  if (problems.length) throw new Error(problems.join(" "));
  const change = adjustmentChange(form);
  return {
    event_key: uuid(),
    package_id: Number(context.package.id),
    lot_id: Number(context.lot.id),
    transaction_type: "adjustment",
    quantity_change: change,
    note: form.note.trim(),
    ...(change < 0 ? { expense_category_id: Number(form.category) } : {}),
  };
}

export function sameAdjustment(task, record) {
  const p = task.payload;
  return (
    record?.event_key === p.event_key &&
    Number(record.package_id) === p.package_id &&
    Number(record.lot_id) === p.lot_id &&
    Number(record.quantity_change) === p.quantity_change &&
    (record.note || "") === p.note &&
    (p.quantity_change >= 0 ||
      Number(record.expense_category_id) === p.expense_category_id)
  );
}
