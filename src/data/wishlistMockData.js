// Chỉ dùng để dựng giao diện.
// Khi nối backend, thay bằng GET /api/wishlist.

export const wishlistMockItems = [
  {
    id: 1,
    user_id: 3,
    product_id: 101,
    created_at: "2026-08-31T08:30:00",

    product: {
      id: 101,
      product_name: "Rice Guard - Thuốc bảo vệ thực vật sinh học",
      brand: "Nông Việt",
      old_price: 320000,
      min_price: 268000,
      total_stock: 36,
      rating: 5,
      review_count: 18,

      category: {
        id: 1,
        name: "Thuốc bảo vệ thực vật",
      },

      images: [
        {
          id: 1,
          image_url:
            "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=85",
          is_primary: true,
        },
      ],

      variants: [
        {
          id: 11,
          variant_name: "Chai tiêu chuẩn",

          packages: [
            {
              id: 111,
              sku: "RG-250ML",
              size: 250,
              unit: "ml",
              price: 268000,
              quantity_available: 36,
            },
          ],
        },
      ],
    },
  },

  {
    id: 2,
    user_id: 3,
    product_id: 102,
    created_at: "2026-08-29T14:20:00",

    product: {
      id: 102,
      product_name: "Phân bón NPK hữu cơ chuyên dùng cho cây lúa",
      brand: "Bình Điền",
      old_price: 605000,
      min_price: 565000,
      total_stock: 20,
      rating: 4,
      review_count: 12,

      category: {
        id: 2,
        name: "Phân bón",
      },

      images: [
        {
          id: 2,
          image_url:
            "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=85",
          is_primary: true,
        },
      ],

      variants: [
        {
          id: 21,
          variant_name: "Bao nông nghiệp",

          packages: [
            {
              id: 211,
              sku: "NPK-25KG",
              size: 25,
              unit: "kg",
              price: 320000,
              quantity_available: 12,
            },
            {
              id: 212,
              sku: "NPK-50KG",
              size: 50,
              unit: "kg",
              price: 565000,
              quantity_available: 8,
            },
          ],
        },
      ],
    },
  },

  {
    id: 3,
    user_id: 3,
    product_id: 103,
    created_at: "2026-08-27T09:15:00",

    product: {
      id: 103,
      product_name: "Hạt giống lúa chất lượng cao OM5451",
      brand: "Lộc Trời",
      old_price: 380000,
      min_price: 320000,
      total_stock: 3,
      rating: 4,
      review_count: 9,

      category: {
        id: 3,
        name: "Hạt giống",
      },

      images: [
        {
          id: 3,
          image_url:
            "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=85",
          is_primary: true,
        },
      ],

      variants: [
        {
          id: 31,
          variant_name: "Túi giống nguyên chủng",

          packages: [
            {
              id: 311,
              sku: "SEED-5KG",
              size: 5,
              unit: "kg",
              price: 320000,
              quantity_available: 3,
            },
          ],
        },
      ],
    },
  },

  {
    id: 4,
    user_id: 3,
    product_id: 104,
    created_at: "2026-08-24T16:45:00",

    product: {
      id: 104,
      product_name: "Bình phun thuốc nông nghiệp đeo vai 20 lít",
      brand: "Đầu Trâu",
      old_price: 820000,
      min_price: 740000,
      total_stock: 0,
      rating: 4,
      review_count: 7,

      category: {
        id: 4,
        name: "Vật tư nông nghiệp",
      },

      images: [
        {
          id: 4,
          image_url:
            "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=85",
          is_primary: true,
        },
      ],

      variants: [
        {
          id: 41,
          variant_name: "Bình tiêu chuẩn",

          packages: [
            {
              id: 411,
              sku: "SPRAY-20L",
              size: 20,
              unit: "l",
              price: 740000,
              quantity_available: 0,
            },
          ],
        },
      ],
    },
  },
];
