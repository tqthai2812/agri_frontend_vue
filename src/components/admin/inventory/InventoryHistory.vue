<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount } from "vue";
import { dateTime, quantity } from "@/utils/inventoryDisplay";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
let historyTimer = null;
function cancelHistorySearch() {
    clearTimeout(historyTimer);
    historyTimer = null;
}
function searchHistory() {
    cancelHistorySearch();

    historyTimer = setTimeout(() => {
        if (store.mode !== "history") {
            return;
        }

        store.transactionFilters.page = 1;
        void store.fetchTransactions();
    }, 350);
}

async function historyFilterChanged() {
    cancelHistorySearch();
    store.transactionFilters.page = 1;

    await store.fetchTransactions();
}

async function historyPageChanged(page) {
    cancelHistorySearch();

    await store.setTransactionPage(page);
}
onBeforeUnmount(cancelHistorySearch);
const visiblePages = computed(() => {
  const current = Number(store.transactionMeta.current_page) || 1;
  const last = Math.max(1, Number(store.transactionMeta.last_page) || 1);
  const pages = [];
  for (let page = Math.max(1, current - 2); page <= Math.min(last, current + 2); page++) pages.push(page);
  return pages;
});
</script>

<template>
    <div class="product-admin">
        <p class="mb-4 text-sm text-text-light">
            Lịch sử đã ghi sổ không được sửa hoặc xóa. Sai số được xử lý bằng giao
            dịch điều chỉnh mới có lý do.
        </p>

        <div class="mb-4 flex flex-wrap gap-3">
            <input v-model.trim="store.transactionFilters.search" class="form-control flex-1"
                placeholder="Tìm ghi chú, SKU..." aria-label="Tìm lịch sử" @input="searchHistory" />

            <select v-model="store.transactionFilters.transaction_type" class="form-control cursor-pointer disabled:cursor-not-allowed"
                aria-label="Loại giao dịch" @change="historyFilterChanged">
                <option value="">Tất cả giao dịch</option>
                <option value="import">Nhập kho</option>
                <option value="export">Xuất kho</option>
                <option value="adjustment">Điều chỉnh</option>
                <option value="opening_balance">Tồn đầu kỳ</option>
            </select>
        </div>

        <div v-if="store.loadingTransactions" class="empty-cell">
            Đang tải lịch sử...
        </div>

        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[850px] text-sm table-auto">
                <thead class="bg-bg">
                    <tr>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Loại / ID</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thay đổi</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trước → Sau</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Ghi chú</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Người thực hiện</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thời điểm</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="transaction in store.transactions" :key="transaction.id" class="border-b border-border hover:bg-primary/5">
                        <td class="table-td p-3 text-sm text-left">
                            <div class="text-left">
                                {{
                                    transaction.transaction_type_label ||
                                    transaction.transaction_type
                                }}
                            </div>
                            <div class="text-xs text-text-light text-left">#{{ transaction.id }}</div>
                        </td>

                        <td class="table-td font-mono font-bold p-3 text-sm text-left" :class="Number(transaction.quantity_change) > 0
                            ? 'text-success'
                            : 'text-danger'
                            ">
                            {{ Number(transaction.quantity_change) > 0 ? "+" : ""
                            }}{{ transaction.quantity_change }}
                        </td>

                        <td class="table-td font-mono p-3 text-sm text-left">
                            {{ quantity(transaction.quantity_before) }}
                            →
                            {{ quantity(transaction.quantity_after) }}
                        </td>

                        <td class="table-td whitespace-pre-line break-words p-3 text-sm text-left">
                            {{ transaction.note || "—" }}
                        </td>

                        <td class="table-td p-3 text-sm text-left">
                            {{ transaction.performer?.name || "Không rõ" }}
                        </td>

                        <td class="table-td p-3 text-sm text-left">
                            {{ dateTime(transaction.occurred_at || transaction.created_at) }}
                            <div v-if="!transaction.occurred_at" class="text-xs text-text-light text-left">
                                Thời gian tạo bản ghi
                            </div>
                        </td>
                    </tr>

                    <tr class="border-b border-border hover:bg-primary/5" v-if="!store.transactions.length">
                        <td colspan="6" class="empty-cell text-sm p-8 text-text-light text-left">Chưa có lịch sử phù hợp.</td>
                    </tr>
                </tbody>
            </table>
        </div>

<div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
<span class="text-sm text-text-light">Hiển thị {{ store.transactions.length }} / {{ store.transactionMeta.total }} dòng</span>
<nav class="flex flex-wrap justify-center gap-2" aria-label="Phân trang">
<button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="store.loadingTransactions || store.transactionMeta.current_page <= 1
                " @click="historyPageChanged(store.transactionMeta.current_page - 1)" aria-label="Trang trước">
        <Icon icon="solar:arrow-left-bold" />
      </button>
<button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
 :class="{ active: page === Number(store.transactionMeta.current_page) }" :aria-current="page === Number(store.transactionMeta.current_page) ? 'page' : undefined"
 :disabled="store.loadingTransactions" @click="historyPageChanged(page)">{{ page }}</button>
<button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="store.loadingTransactions ||
                store.transactionMeta.current_page >= store.transactionMeta.last_page
                " @click="historyPageChanged(store.transactionMeta.current_page + 1)" aria-label="Trang sau">
        <Icon icon="solar:arrow-right-bold" />
      </button>
</nav>
</div>
    </div>
</template>