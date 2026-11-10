// Chỉ quy đổi liều thành phẩm do người dùng nhập; không đưa ra liều khuyến cáo.
// Phân số BigInt giữ chính xác cả phần dư để không sinh thêm bình do sai số float.
const SCALE = 1000000n;
const fraction = (n, d = 1n) => ({ n, d });
const multiply = (a, b) => fraction(a.n * b.n, a.d * b.d);
const divide = (a, b) => fraction(a.n * b.d, a.d * b.n);
const subtract = (a, b) => fraction(a.n * b.d - b.n * a.d, a.d * b.d);

export const AREA_UNITS = Object.freeze([
  { value: "ha", label: "ha" },
  { value: "m2", label: "m²" },
  { value: "sao", label: "sào" },
  { value: "cong", label: "công" },
  { value: "acre", label: "acre" },
]);
export const DOSE_UNITS = Object.freeze([
  { value: "ml", label: "mL", base: "mL", factor: 1n },
  { value: "l", label: "L", base: "mL", factor: 1000n },
  { value: "g", label: "g", base: "g", factor: 1n },
  { value: "kg", label: "kg", base: "g", factor: 1000n },
]);

export function emptyDilutionInputs() {
  return {
    area: "",
    areaUnit: "ha",
    rate: "",
    doseUnit: "ml",
    sprayVolume: "",
    tank: "",
  };
}

function positiveDecimal(value) {
  const text = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!/^\d{1,9}(?:\.\d{1,6})?$/.test(text)) return null;
  const [whole, decimals = ""] = text.split(".");
  const n = BigInt(whole + decimals.padEnd(6, "0"));
  return n > 0n ? fraction(n, SCALE) : null;
}

export function formatQuantity(value) {
  if (
    !value ||
    typeof value.n !== "bigint" ||
    typeof value.d !== "bigint" ||
    value.d <= 0n ||
    value.n < 0n
  )
    return "—";
  const micro = (value.n * SCALE * 2n + value.d) / (2n * value.d);
  if (micro === 0n && value.n > 0n) return "<0,000001";
  const whole = String(micro / SCALE).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimals = String(micro % SCALE)
    .padStart(6, "0")
    .replace(/0+$/, "");
  return whole + (decimals ? "," + decimals : "");
}

export function formatInteger(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatProduct(value, unit) {
  const base = `${formatQuantity(value)} ${unit}`;
  if (!value || value.n < 1000n * value.d) return base;
  return `${base} (${formatQuantity(divide(value, fraction(1000n)))} ${unit === "mL" ? "L" : "kg"})`;
}

export function calculateDilution(raw = {}) {
  const errors = {};
  const fields = {
    area: "diện tích",
    rate: "liều thuốc",
    sprayVolume: "lượng dung dịch phun",
    tank: "dung tích bình",
  };
  const input = {};
  for (const [field, label] of Object.entries(fields)) {
    input[field] = positiveDecimal(raw[field]);
    if (!input[field])
      errors[field] =
        `Nhập ${label} lớn hơn 0; tối đa 9 chữ số nguyên và 6 chữ số thập phân.`;
  }
  const areaUnit = AREA_UNITS.find((unit) => unit.value === raw.areaUnit);
  const doseUnit = DOSE_UNITS.find((unit) => unit.value === raw.doseUnit);
  if (!areaUnit) errors.areaUnit = "Chọn đơn vị diện tích.";
  if (!doseUnit) errors.doseUnit = "Chọn đơn vị liều thuốc.";
  if (Object.keys(errors).length) return { ok: false, errors };

  const rateBase = multiply(input.rate, fraction(doseUnit.factor));
  const isLiquid = doseUnit.base === "mL";
  if (
    isLiquid &&
    rateBase.n * input.sprayVolume.d > input.sprayVolume.n * 1000n * rateBase.d
  ) {
    return {
      ok: false,
      errors: {
        rate: "Thể tích thuốc vượt tổng thể tích dung dịch sau pha. Kiểm tra lại liều và đơn vị.",
      },
    };
  }

  const perLiter = divide(rateBase, input.sprayVolume);
  const fullTankProduct = multiply(input.tank, perLiter);
  const totalProduct = multiply(input.area, rateBase);
  const totalSpray = multiply(input.area, input.sprayVolume);
  const tankEquivalents = divide(totalSpray, input.tank);
  const fullTanks = tankEquivalents.n / tankEquivalents.d;
  const partialSpray = subtract(
    totalSpray,
    multiply(input.tank, fraction(fullTanks)),
  );
  const partialProduct = multiply(partialSpray, perLiter);
  const hasPartial = partialSpray.n > 0n;
  return {
    ok: true,
    input,
    areaLabel: areaUnit.label,
    doseLabel: doseUnit.label,
    unit: doseUnit.base,
    isLiquid,
    rateBase,
    perLiter,
    fullTankProduct,
    totalProduct,
    totalSpray,
    tankEquivalents,
    fullTanks,
    partialSpray,
    partialProduct,
    hasPartial,
    tankCount: fullTanks + (hasPartial ? 1n : 0n),
    dilution: isLiquid ? divide(fraction(1000n), perLiter) : null,
    concentration: isLiquid ? divide(perLiter, fraction(10n)) : null,
    fullTankWater: isLiquid
      ? subtract(input.tank, divide(fullTankProduct, fraction(1000n)))
      : null,
    partialWater: isLiquid
      ? subtract(partialSpray, divide(partialProduct, fraction(1000n)))
      : null,
    totalWater: isLiquid
      ? subtract(totalSpray, divide(totalProduct, fraction(1000n)))
      : null,
  };
}

export function buildDilutionSummary(result) {
  if (!result?.ok) return "";
  const f = formatQuantity;
  const p = (value) => formatProduct(value, result.unit);
  const lines = [
    "NFarmHouse — Kết quả tính pha thuốc BVTV",
    `Diện tích: ${f(result.input.area)} ${result.areaLabel}`,
    `Liều thành phẩm: ${f(result.input.rate)} ${result.doseLabel}/${result.areaLabel}`,
    `Dung dịch sau pha: ${f(result.input.sprayVolume)} L/${result.areaLabel}`,
    `Dung tích bình: ${f(result.input.tank)} L`,
    `Một bình đầy: ${p(result.fullTankProduct)}`,
    `Tổng thuốc: ${p(result.totalProduct)}`,
    `Tổng dung dịch: ${f(result.totalSpray)} L`,
    `Số lần pha: ${formatInteger(result.tankCount)} (${formatInteger(result.fullTanks)} bình đầy${result.hasPartial ? " + 1 bình lẻ " + f(result.partialSpray) + " L" : ", không có bình lẻ"})`,
  ];
  if (result.hasPartial)
    lines.push(`Thuốc cho bình lẻ: ${p(result.partialProduct)}`);
  if (result.isLiquid) {
    lines.push(
      `Thuốc : dung dịch sau pha = 1 : ${f(result.dilution)}`,
      `Nồng độ thành phẩm: ${f(result.concentration)}% v/v`,
      `Nước ước tính/bình đầy: ${f(result.fullTankWater)} L`,
    );
    if (result.hasPartial)
      lines.push(`Nước ước tính/bình lẻ: ${f(result.partialWater)} L`);
  } else
    lines.push(
      `Lượng thuốc: ${f(result.perLiter)} g/L. Châm nước đến đủ thể tích; không đổi g thành mL.`,
    );
  lines.push(
    "Số liệu do người dùng nhập từ nhãn; không phải liều khuyến cáo. Lượng dung dịch là thể tích cuối sau pha. Kết quả hiển thị tối đa 6 chữ số thập phân.",
  );
  return lines.join("\n");
}