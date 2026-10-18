<script setup>
import { onBeforeUnmount } from "vue";
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
</script>

<template>
    <div>
        <p class="mb-4 text-sm text-text-light">
            Lịch sử đã ghi sổ không được sửa hoặc xóa. Sai số được xử lý bằng giao
            dịch điều chỉnh mới có lý do.
        </p>

        <div class="mb-4 flex flex-wrap gap-3">
            <input v-model.trim="store.transactionFilters.search" class="form-control flex-1"
                placeholder="Tìm ghi chú, SKU..." aria-label="Tìm lịch sử" @input="searchHistory" />

            <select v-model="store.transactionFilters.transaction_type" class="filter-select"
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
            <table class="w-full min-w-[850px]">
                <thead class="bg-bg">
                    <tr>
                        <th class="table-th">Loại / ID</th>
                        <th class="table-th">Thay đổi</th>
                        <th class="table-th">Trước → Sau</th>
                        <th class="table-th">Ghi chú</th>
                        <th class="table-th">Người thực hiện</th>
                        <th class="table-th">Thời điểm</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="transaction in store.transactions" :key="transaction.id" class="table-row">
                        <td class="table-td">
                            <div>
                                {{
                                    transaction.transaction_type_label ||
                                    transaction.transaction_type
                                }}
                            </div>
                            <div class="text-xs text-text-light">#{{ transaction.id }}</div>
                        </td>

                        <td class="table-td font-mono font-bold" :class="Number(transaction.quantity_change) > 0
                            ? 'text-success'
                            : 'text-danger'
                            ">
                            {{ Number(transaction.quantity_change) > 0 ? "+" : ""
                            }}{{ transaction.quantity_change }}
                        </td>

                        <td class="table-td font-mono">
                            {{ quantity(transaction.quantity_before) }}
                            →
                            {{ quantity(transaction.quantity_after) }}
                        </td>

                        <td class="table-td max-w-[260px] whitespace-pre-line break-words">
                            {{ transaction.note || "—" }}
                        </td>

                        <td class="table-td">
                            {{ transaction.performer?.name || "Không rõ" }}
                        </td>

                        <td class="table-td">
                            {{ dateTime(transaction.occurred_at || transaction.created_at) }}
                            <div v-if="!transaction.occurred_at" class="text-xs text-text-light">
                                Thời gian tạo bản ghi
                            </div>
                        </td>
                    </tr>

                    <tr v-if="!store.transactions.length">
                        <td colspan="6" class="empty-cell">Chưa có lịch sử phù hợp.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex items-center justify-end gap-3">
            <span class="text-sm text-text-light">
                Trang {{ store.transactionMeta.current_page }} /
                {{ store.transactionMeta.last_page }}
            </span>

            <button type="button" class="page-btn" :disabled="store.loadingTransactions || store.transactionMeta.current_page <= 1
                " @click="historyPageChanged(store.transactionMeta.current_page - 1)">
                ‹
            </button>

            <button type="button" class="page-btn" :disabled="store.loadingTransactions ||
                store.transactionMeta.current_page >= store.transactionMeta.last_page
                " @click="historyPageChanged(store.transactionMeta.current_page + 1)">
                ›
            </button>
        </div>
    </div>
</template>