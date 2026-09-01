export const HIGH_CONFIDENCE_THRESHOLD = 0.8;

export const riceDiseases = [
  {
    id: 1,
    code: "bacterial_leaf_blight",
    name: "Bạc lá",
    englishName: "Bacterial leaf blight",
    scientificName: "Xanthomonas oryzae pv. oryzae",
    severity: "Nguy cơ cao",
    shortDescription:
      "Bệnh vi khuẩn thường làm lá lúa úa vàng từ mép lá, lan nhanh và có thể gây giảm năng suất rõ rệt.",
    symptoms: [
      "Vết bệnh bắt đầu từ chóp hoặc mép lá rồi kéo dài theo gân lá.",
      "Màu lá chuyển từ xanh tái sang vàng bạc và khô dần.",
      "Buổi sáng ẩm có thể thấy giọt dịch vi khuẩn màu vàng đục.",
    ],
    causes: [
      "Vi khuẩn Xanthomonas oryzae pv. oryzae.",
      "Ruộng bón thừa đạm, mưa gió lớn hoặc lá bị tổn thương.",
    ],
    treatment: [
      "Ngưng bón đạm, giữ mực nước ruộng ổn định và loại bỏ lá bệnh nặng.",
      "Sử dụng thuốc đặc trị vi khuẩn theo hướng dẫn của cán bộ kỹ thuật.",
      "Vệ sinh dụng cụ và tránh đi lại giữa ruộng khi lá còn ướt.",
    ],
    prevention: [
      "Dùng giống sạch bệnh, giống có khả năng chống chịu.",
      "Bón phân cân đối NPK và không gieo sạ quá dày.",
      "Theo dõi ruộng sau mưa bão để phát hiện sớm.",
    ],
  },
  {
    id: 2,
    code: "rice_leaf_blast",
    name: "Đạo ôn lá",
    englishName: "Rice leaf blast",
    scientificName: "Magnaporthe oryzae",
    severity: "Nguy cơ cao",
    shortDescription:
      "Bệnh nấm tạo vết hình thoi trên lá, phát triển mạnh khi trời mát, ẩm và ruộng bón nhiều đạm.",
    symptoms: [
      "Vết bệnh hình thoi, tâm xám trắng và viền nâu sẫm.",
      "Nhiều vết liên kết làm lá cháy từng mảng.",
      "Cây sinh trưởng chậm, đẻ nhánh kém khi bệnh nặng.",
    ],
    causes: [
      "Nấm Magnaporthe oryzae tồn tại trên tàn dư và hạt giống.",
      "Ẩm độ cao, sương đêm nhiều, nhiệt độ mát và thừa đạm.",
    ],
    treatment: [
      "Tạm ngưng bón đạm và không để ruộng khô nước.",
      "Phun thuốc đặc trị đạo ôn đúng liều khi bệnh mới xuất hiện.",
    ],
    prevention: [
      "Xử lý hạt giống và vệ sinh đồng ruộng trước vụ mới.",
      "Gieo sạ mật độ hợp lý, bón kali và silic cân đối.",
    ],
  },
  {
    id: 3,
    code: "brown_spot",
    name: "Đốm nâu",
    englishName: "Brown spot",
    scientificName: "Bipolaris oryzae",
    severity: "Trung bình",
    shortDescription:
      "Bệnh nấm xuất hiện thành các đốm nâu tròn hoặc bầu dục, thường nặng hơn trên ruộng thiếu dinh dưỡng.",
    symptoms: [
      "Đốm nhỏ màu nâu, hình tròn hoặc bầu dục trên phiến lá.",
      "Tâm vết bệnh có thể chuyển xám, xung quanh viền nâu đỏ.",
      "Lá già khô sớm khi số lượng vết bệnh tăng cao.",
    ],
    causes: [
      "Nấm Bipolaris oryzae lây qua hạt giống và tàn dư cây bệnh.",
      "Đất nghèo dinh dưỡng, thiếu kali hoặc cây bị stress nước.",
    ],
    treatment: [
      "Bổ sung dinh dưỡng cân đối và cải thiện điều kiện đất.",
      "Dùng thuốc trừ nấm phù hợp khi tỷ lệ lá bệnh tăng nhanh.",
    ],
    prevention: [
      "Dùng hạt giống khỏe, xử lý giống trước khi gieo.",
      "Quản lý nước và bón phân theo nhu cầu từng giai đoạn.",
    ],
  },
  {
    id: 4,
    code: "healthy",
    name: "Lá lúa khỏe mạnh",
    englishName: "Healthy rice leaf",
    scientificName: null,
    severity: "Bình thường",
    shortDescription:
      "Hình ảnh chưa cho thấy dấu hiệu bệnh rõ ràng. Tiếp tục chăm sóc và theo dõi cây định kỳ.",
    symptoms: [
      "Phiến lá xanh tương đối đồng đều.",
      "Không thấy vết cháy, đốm hoặc đổi màu bất thường rõ rệt.",
    ],
    causes: [],
    treatment: [
      "Không cần xử lý thuốc khi cây không có triệu chứng bất thường.",
    ],
    prevention: [
      "Duy trì nước và dinh dưỡng cân đối.",
      "Kiểm tra ruộng định kỳ, nhất là sau mưa lớn hoặc thay đổi thời tiết.",
    ],
  },
];

function disease(code) {
  return riceDiseases.find((item) => item.code === code);
}

export function createMockDiagnosis(mode = "high") {
  const scores =
    mode === "low"
      ? [
          ["rice_leaf_blast", 0.47],
          ["bacterial_leaf_blight", 0.31],
          ["brown_spot", 0.16],
        ]
      : [
          ["bacterial_leaf_blight", 0.94],
          ["rice_leaf_blast", 0.035],
          ["brown_spot", 0.018],
        ];

  const predictions = scores.map(([code, confidence]) => ({
    disease: disease(code),
    confidence,
  }));

  return {
    id: `DEMO-${Date.now()}`,
    createdAt: new Date().toISOString(),
    threshold: HIGH_CONFIDENCE_THRESHOLD,
    isReliable: predictions[0].confidence >= HIGH_CONFIDENCE_THRESHOLD,
    topPrediction: predictions[0],
    predictions,
    processingTimeMs: mode === "low" ? 2380 : 2160,
    modelVersion: "rice-leaf-v1.0-demo",
  };
}
