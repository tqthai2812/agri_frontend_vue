<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import api from "@/services/admin/inventory-document.service";
import {
  today,
  money,
  lineValue,
  totalValue,
  errorText,
} from "@/utils/inventoryDocument";
const props = defineProps({
  form: { type: Object, required: true },
  locked: Boolean,
  supplierName: String,
});
const suppliers = ref([]),
  supplierError = ref(""),
  supplierLoading = ref(false);
const search = ref(""),
  packages = ref([]),
  packageMeta = ref({ current_page: 1, last_page: 1 }),
  loading = ref(false),
  error = ref("");
const visiblePackagePages = computed(() => {
  const current = Number(packageMeta.value.current_page) || 1;
  const last = Math.max(1, Number(packageMeta.value.last_page) || 1);
  const pages = [];
  for (let page = Math.max(1, current - 2); page <= Math.min(last, current + 2); page++) {
    pages.push(page);
  }
  return pages;
});
let alive = true,
  version = 0;
async function loadSuppliers() {
  supplierLoading.value = true;
  supplierError.value = "";
  try {
    const all = [];
    for (let page = 1; ; page++) {
      const data = (await api.suppliers({ page, per_page: 100 })).data;
      if (!alive) return;
      all.push(
        ...data.data.filter((item) => [true, 1, "1"].includes(item.is_active)),
      );
      if (page >= (data.meta?.last_page || data.last_page || 1)) break;
      if (page >= 100)
        throw new Error(
          "Chưa tải hết danh sách nhà cung cấp. Vui lòng liên hệ quản trị viên.",
        );
    }
    suppliers.value = all;
  } catch (e) {
    if (alive) supplierError.value = errorText(e);
  } finally {
    if (alive) supplierLoading.value = false;
  }
}
async function find(page = 1) {
  const current = ++version;
  loading.value = true;
  error.value = "";
  try {
    const data = (
      await api.packages({ search: search.value.trim(), page, per_page: 8 })
    ).data;
    if (!alive || current !== version) return;
    packages.value = data.data;
    packageMeta.value = data.meta;
  } catch (e) {
    if (alive && current === version) error.value = errorText(e);
  } finally {
    if (alive && current === version) loading.value = false;
  }
}
function add(item) {
  if (props.locked || props.form.items.length >= 100) return;
  props.form.items.push({
    package_id: item.id,
    product_name: item.product?.name,
    variant_name: item.variant?.name,
    sku: item.sku,
    size: item.size,
    unit: item.unit,
    quantity_change: 1,
    unit_cost: "",
    note: "",
  });
}
onMounted(loadSuppliers);
onBeforeUnmount(() => {
  alive = false;
  ++version;
});
</script>
<template>
  <div class="doc-stack product-admin">
    <fieldset :disabled="locked" class="doc-stack min-w-0">
      <div class="doc-grid">
        <label class="form-group"
          ><span class="form-label">Nhà cung cấp <span aria-hidden="true">*</span>
          </span><select class="form-control cursor-pointer disabled:cursor-not-allowed" v-model="form.supplier_id" :disabled="supplierLoading">
            <option value="">Chọn nhà cung cấp</option>
            <option
              v-if="
                form.supplier_id &&
                !suppliers.some(
                  (s) => Number(s.id) === Number(form.supplier_id),
                )
              "
              :value="form.supplier_id"
            >
              {{ supplierName || `Nhà cung cấp #${form.supplier_id}` }} — cần
              kiểm tra hoạt động
            </option>
            <option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :value="supplier.id"
            >
              {{ supplier.name }}
            </option>
          </select>
        </label>
        <label class="form-group"
          ><span class="form-label">Ngày chứng từ *</span><input class="form-control"
            v-model="form.document_date"
            type="date"
            :max="today()"
            required
        /></label>
      </div>
      <p v-if="supplierLoading" role="status" class="flex items-center gap-2 text-sm text-text-light">
        <Icon icon="solar:refresh-bold" class="shrink-0 animate-spin text-lg" aria-hidden="true" />
        Đang tải nhà cung cấp…
      </p>
      <div v-if="supplierError" class="doc-error" role="alert">
        {{ supplierError }}
        <button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" type="button" @click="loadSuppliers">
          <Icon icon="solar:refresh-bold" aria-hidden="true" />
          Tải lại nhà cung cấp
        </button>
      </div>
      <label class="form-group"
        ><span class="form-label">Ghi chú phiếu</span><textarea class="form-control resize-y"
          v-model="form.note"
          rows="2"
          maxlength="10000"
          placeholder="Số hóa đơn, thông tin giao nhận…"
        />
      </label>
      <section class="doc-picker">
        <h3 class="text-lg font-bold">Thêm dòng hàng</h3>
        <div class="doc-toolbar">
          <input class="form-control"
            v-model="search"
            aria-label="Tìm SKU hoặc tên sản phẩm"
            placeholder="Tìm SKU hoặc tên sản phẩm"
            maxlength="255"
            @keydown.enter.prevent="find(1)"
          />
          <button
            type="button"
            class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
            :disabled="loading"
            @click="find(1)"
          >
            <Icon icon="solar:magnifer-bold" aria-hidden="true" />
            Tìm sản phẩm
          </button>
        </div>
        <p v-if="error" class="doc-error" role="alert">{{ error }}</p>
        <div v-if="loading" role="status" class="py-10 text-center text-text-light">
          <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" aria-hidden="true" />
          <p class="text-sm">Đang tìm…</p>
        </div>
        <ul v-else class="doc-picker-results">
          <li v-for="item in packages" :key="item.id">
            <div>
              <strong>{{ item.product?.name }}</strong
              ><small
                >{{ item.sku }} · {{ item.variant?.name }} · {{ item.size }}
                {{ item.unit }}</small
              >
            </div>
            <button
              type="button"
              class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
              :disabled="form.items.length >= 100"
              :aria-label="`Thêm ${item.sku}`"
              @click="add(item)"
            >
              <Icon icon="solar:add-circle-bold" aria-hidden="true" />
              Thêm
            </button>
          </li>
        </ul>
        <p v-if="!loading && packageMeta.total === 0" class="text-xs leading-5 text-text-light">
          Không tìm thấy SKU phù hợp.
        </p>
        <nav v-if="packageMeta.last_page > 1" class="mt-5 flex flex-wrap justify-center gap-2" aria-label="Phân trang chọn sản phẩm">
          <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" aria-label="Trang trước"
            :disabled="loading || packageMeta.current_page <= 1" @click="find(packageMeta.current_page - 1)">
            <Icon icon="solar:arrow-left-bold" />
          </button>
          <button v-for="page in visiblePackagePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
            :class="{ active: page === Number(packageMeta.current_page) }"
            :aria-current="page === Number(packageMeta.current_page) ? 'page' : undefined"
            :disabled="loading" @click="find(page)">
            {{ page }}
          </button>
          <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" aria-label="Trang sau"
            :disabled="loading || packageMeta.current_page >= packageMeta.last_page" @click="find(packageMeta.current_page + 1)">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </nav>
      </section>
      <div class="doc-section-title">
        <h3 class="text-lg font-bold">Dòng hàng ({{ form.items.length }}/100)</h3>
        <span class="text-xs leading-5 text-text-light">Một dòng cho mỗi lô nhập</span>
      </div>
      <p v-if="!form.items.length" class="doc-empty">
        Tìm sản phẩm phía trên và bấm Thêm.
      </p>
      <article
        v-for="(item, index) in form.items"
        :key="index"
        class="doc-line"
      >
        <header>
          <div>
            <strong>{{ index + 1 }}. {{ item.product_name }}</strong
            ><small
              >{{ item.sku }} · {{ item.variant_name }} · {{ item.size }}
              {{ item.unit }}</small
            >
          </div>
          <button
            type="button"
            class="btn-outline-sm text-danger hover:!border-danger cursor-pointer disabled:cursor-not-allowed"
            :aria-label="`Bỏ dòng ${index + 1}`"
            @click="form.items.splice(index, 1)"
          >
            <Icon icon="solar:trash-bin-trash-bold" aria-hidden="true" />
            Bỏ dòng
          </button>
        </header>
        <div class="doc-grid doc-grid-three">
          <label class="form-group" :for="`receipt-qty-${index}`"
            ><span class="form-label">Số lượng nhập *</span><input class="form-control"
              :id="`receipt-qty-${index}`"
              v-model="item.quantity_change"
              type="number"
              min="1"
              max="2147483647"
              step="1"
          /></label>
          <label class="form-group" :for="`receipt-cost-${index}`"
            ><span class="form-label">Giá vốn đơn vị (₫)</span><input class="form-control"
              :id="`receipt-cost-${index}`"
              v-model="item.unit_cost"
              inputmode="decimal"
              maxlength="13"
              placeholder="Để trống nếu chưa biết"
          /></label>
          <div class="doc-line-value">
            <span>Thành tiền</span><strong>{{ money(lineValue(item)) }}</strong>
          </div>
        </div>
        <label class="form-group" :for="`receipt-note-${index}`"
          ><span class="form-label">Ghi chú dòng</span><input class="form-control"
            :id="`receipt-note-${index}`"
            v-model="item.note"
            maxlength="10000"
        /></label>
      </article>
    </fieldset>
    <div class="doc-total">
      <span>Tổng giá trị nhập</span
      ><strong>{{ money(totalValue(form.items)) }}</strong>
    </div>
    <p class="text-xs leading-5 text-text-light">
      Lưu nháp chưa thay đổi tồn kho. Dòng chưa có giá vốn sẽ hiển thị “—”.
    </p>
  </div>
</template>