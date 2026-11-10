// Tính bằng phân số BigInt; chuỗi decimal từ API không bị chuyển sang float.
// Không suy đoán tỉ trọng và không chuyển g <-> ml.
const SCALE = 1000000n;
const yes = (value) => value === true || value === 1 || value === "1";
export const hasValue = (value) =>
  value !== null && value !== undefined && value !== "";

export function decimal(value) {
  const text = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!/^\d{1,16}(?:\.\d{1,6})?$/.test(text)) return null;
  const parts = text.split(".");
  return { n: BigInt(parts[0] + (parts[1] || "").padEnd(6, "0")), d: SCALE };
}
const multiply = (a, b) => ({ n: a.n * b.n, d: a.d * b.d });
const divide = (a, b) => ({ n: a.n * b.d, d: a.d * b.n });
export const compare = (a, b) =>
  a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
const roundedMicro = (a) => (a.n * SCALE * 2n + a.d) / (2n * a.d);
const greater = (a, b) => (compare(a, b) >= 0 ? a : b);
const lesser = (a, b) => (compare(a, b) <= 0 ? a : b);

export function formatAmount(value) {
  const a = typeof value === "object" && value?.d ? value : decimal(value);
  if (!a || a.d <= 0n) return "—";
  const micro = roundedMicro(a);
  if (micro === 0n && a.n > 0n) return "<0,000001";
  const whole = String(micro / SCALE).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fraction = String(micro % SCALE)
    .padStart(6, "0")
    .replace(/0+$/, "");
  return whole + (fraction ? "," + fraction : "");
}

export function formatRange(min, max) {
  const a = typeof min === "object" ? min : decimal(min);
  const b = typeof max === "object" ? max : decimal(max);
  if (!a || !b) return "Chưa có định mức";
  return compare(a, b) === 0
    ? formatAmount(a)
    : formatAmount(a) + " – " + formatAmount(b);
}

function pair(guide, prefix) {
  const min = guide[prefix + "_min"],
    max = guide[prefix + "_max"];
  if (!hasValue(min) && !hasValue(max)) return null;
  const a = decimal(min),
    b = decimal(max);
  if (!a || !b || a.n <= 0n || compare(b, a) < 0)
    throw new Error("Định mức chưa hợp lệ. Vui lòng chọn hướng dẫn khác.");
  return { min: a, max: b };
}

function positiveInput(value, label) {
  // Giới hạn giống định mức: tối đa 8 chữ số nguyên, 6 chữ số thập phân.
  const text = String(value ?? "")
    .trim()
    .replace(",", ".");
  const result = /^\d{1,8}(?:\.\d{1,6})?$/.test(text) ? decimal(text) : null;
  if (!result || result.n <= 0n)
    throw new Error("Nhập " + label + " lớn hơn 0, tối đa 6 chữ số thập phân.");
  return result;
}

export function calculateUsage(guide, inputs = {}) {
  if (!guide)
    return { kind: "empty", message: "Chọn một hướng dẫn để bắt đầu." };
  try {
    const areaDose = pair(guide, "dose_per_ha");
    const waterDose = pair(guide, "dose_per_liter");
    const waterRate = pair(guide, "water_l_per_ha");
    if (!areaDose && !waterDose)
      return {
        kind: "text",
        message:
          "Hướng dẫn này chưa có định mức lượng sản phẩm. Bạn có thể đọc nội dung bên dưới.",
      };
    if (
      !yes(guide.is_active) ||
      guide.can_calculate === false ||
      !String(guide.label_source || "").trim() ||
      !["g", "ml"].includes(guide.dose_unit)
    ) {
      return {
        kind: "text",
        message:
          "Hướng dẫn chưa đủ thông tin nguồn và định mức để mở tính lượng.",
      };
    }
    const needsArea = Boolean(areaDose || waterRate);
    const needsWater = Boolean(waterDose || waterRate);
    if (
      (needsArea && !hasValue(inputs.area)) ||
      (needsWater && !hasValue(inputs.water))
    ) {
      return {
        kind: "waiting",
        needsArea,
        needsWater,
        message: "Nhập các thông số của một lần sử dụng để xem kết quả.",
      };
    }
    let area = null,
      water = null;
    if (needsArea || hasValue(inputs.area)) {
      area = positiveInput(inputs.area, "diện tích");
      if (!["m2", "ha"].includes(inputs.areaUnit))
        throw new Error("Vui lòng chọn đơn vị diện tích.");
      if (inputs.areaUnit === "m2") area = divide(area, { n: 10000n, d: 1n });
    }
    if (needsWater || hasValue(inputs.water))
      water = positiveInput(inputs.water, "tổng lượng nước");
    let waterRatio = null;
    if (waterRate) {
      waterRatio = divide(water, area);
      // Định mức DB có 6 chữ số: 32 L / 600 m² được so với 533.333333,
      // tránh báo sai chỉ vì tỉ số có phần thập phân tuần hoàn.
      const ratio = roundedMicro(waterRatio);
      if (
        ratio < roundedMicro(waterRate.min) ||
        ratio > roundedMicro(waterRate.max)
      ) {
        throw new Error(
          "Lượng nước chưa phù hợp diện tích. Hướng dẫn yêu cầu " +
            formatRange(waterRate.min, waterRate.max) +
            " lít/ha.",
        );
      }
    }
    const constraints = [];
    if (areaDose)
      constraints.push({
        label: "Theo diện tích",
        min: multiply(areaDose.min, area),
        max: multiply(areaDose.max, area),
      });
    if (waterDose)
      constraints.push({
        label: "Theo lượng nước",
        min: multiply(waterDose.min, water),
        max: multiply(waterDose.max, water),
      });
    const min = constraints.reduce(
      (value, item) => greater(value, item.min),
      constraints[0].min,
    );
    const max = constraints.reduce(
      (value, item) => lesser(value, item.max),
      constraints[0].max,
    );
    if (compare(min, max) > 0)
      throw new Error(
        "Diện tích và lượng nước cho hai khoảng không giao nhau. Kiểm tra lại thông số theo hướng dẫn, không cộng hai liều.",
      );
    return {
      kind: "result",
      min,
      max,
      unit: guide.dose_unit,
      constraints,
      area,
      water,
      waterRatio,
      needsArea,
      needsWater,
    };
  } catch (error) {
    return { kind: "error", message: error.message };
  }
}

export function packageEstimate(result, pkg) {
  if (result?.kind !== "result" || !pkg) return null;
  const size = decimal(pkg.size);
  const units = {
    g: ["g", 1n],
    kg: ["g", 1000n],
    ml: ["ml", 1n],
    l: ["ml", 1000n],
  };
  const conversion = units[String(pkg.unit || "").toLowerCase()];
  if (!size || size.n <= 0n || !conversion || conversion[0] !== result.unit)
    return null;
  const capacity = multiply(size, { n: conversion[1], d: 1n });
  const ceil = (value) => {
    const ratio = divide(value, capacity);
    return (ratio.n + ratio.d - 1n) / ratio.d;
  };
  return {
    min: ceil(result.min).toString(),
    max: ceil(result.max).toString(),
    capacity,
  };
}

export function stockOf(pkg) {
  const value = pkg?.available_to_sell;
  if (!hasValue(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export function formatMoney(value) {
  if (!hasValue(value) || !Number.isFinite(Number(value)) || Number(value) < 0)
    return "Chưa có giá";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function purchaseTotal(price, count) {
  const money = decimal(price);
  if (!money || !/^[1-9]\d{0,9}$/.test(String(count))) return null;
  const total = money.n * BigInt(count);
  // Giá DB có hai chữ số thập phân; giữ phép nhân chính xác.
  const cents = (total * 100n + money.d / 2n) / money.d;
  const whole = String(cents / 100n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (
    whole +
    (cents % 100n ? "," + String(cents % 100n).padStart(2, "0") : "") +
    " ₫"
  );
}