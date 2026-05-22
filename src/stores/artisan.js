import { defineStore } from "pinia";
import { ref } from "vue";
import ArtisanService from "@/services/artisan.service";

export const useArtisanStore = defineStore("artisan", () => {
  const artisans = ref([]);
  const loading = ref(false);

  async function loadArtisansData() {
    loading.value = true;
    try {
      artisans.value = await ArtisanService.getAll();
    } catch (error) {
      console.error("Lỗi nạp dữ liệu thợ thủ công:", error);
    } finally {
      loading.value = false;
    }
  }

  function clearArtisansData() {
    artisans.value = [];
  }

  return { artisans, loading, loadArtisansData, clearArtisansData };
});
