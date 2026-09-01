import { createMockDiagnosis } from "@/data/riceDiseaseMockData";

export async function diagnoseRiceLeaf(imageFile) {
  if (!(imageFile instanceof File)) {
    throw new TypeError("Ảnh chẩn đoán không hợp lệ.");
  }

  // Frontend demo:
  // VITE_DIAGNOSIS_MOCK_MODE=low để thử kết quả độ tin cậy thấp.
  const mockMode =
    import.meta.env.VITE_DIAGNOSIS_MOCK_MODE === "low" ? "low" : "high";

  return createMockDiagnosis(mockMode);

  /*
  Khi Laravel + model AI hoàn thành, thay phần mock phía trên bằng:

  import apiClient from '@/api/client'

  const formData = new FormData()
  formData.append('image', imageFile)

  const { data } = await apiClient.post(
    '/api/rice-diagnoses',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return data.data
  */
}
