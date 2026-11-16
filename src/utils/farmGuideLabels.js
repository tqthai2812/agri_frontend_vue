const active = (value) => value === true || value === 1 || value === "1";

export function guidePurposeLabel(guide) {
  return guide?.purpose?.name || "Chưa có công dụng";
}

export function guideGrowthStageLabel(guide) {
  if (guide?.growth_stage_scope === "all")
    return "Tất cả giai đoạn (theo tài liệu)";
  if (guide?.growth_stage_scope === "specific") {
    return (
      guide.growth_stages
        ?.map((stage) => stage.name)
        .filter(Boolean)
        .join(", ") || "Chưa chọn giai đoạn"
    );
  }
  return "Chưa xác định giai đoạn";
}

export function guideContextActive(guide) {
  if (
    !active(guide?.crop?.is_active) ||
    !active(guide?.purpose?.is_active) ||
    !active(guide?.variant?.product?.is_show)
  )
    return false;
  if (guide.growth_stage_scope === "specific") {
    return (
      guide.growth_stages?.some(
        (stage) =>
          String(stage.crop_id) === String(guide.crop_id) &&
          active(stage.is_active),
      ) || false
    );
  }
  return ["all", "unspecified"].includes(guide.growth_stage_scope);
}