<script setup>
const questions = [
    { question: "Tôi cần cung cấp gì khi hỏi về đơn hàng?", answer: "Ghi mã đơn và mô tả vấn đề bạn gặp. Không gửi mật khẩu, mã OTP hoặc thông tin thẻ." },
    { question: "Cửa hàng trả lời tôi bằng cách nào?", answer: "Cửa hàng có thể liên hệ qua email hoặc số điện thoại trong tài khoản. Bạn nên kiểm tra lại thông tin ở trang Hồ sơ trước khi gửi yêu cầu." },
    { question: "Tôi xem tiến độ ở đâu?", answer: "Đăng nhập và mở phần Lịch sử liên hệ trên trang này. Bấm Tải lại để xem trạng thái mới nhất. Đây là nơi gửi yêu cầu, chưa phải khung trò chuyện trực tiếp." },
    { question: "Có thể hỏi về cách sử dụng sản phẩm hoặc mua số lượng lớn không?", answer: "Có. Với tư vấn sản phẩm, hãy ghi tên sản phẩm, loại cây và tình trạng thực tế. Với đơn số lượng lớn, chọn chủ đề Hợp tác kinh doanh và mô tả nhu cầu." },
];
</script>
<template>
    <section class="mx-auto max-w-4xl">
        <h2 class="mb-6 text-center text-2xl font-bold text-[#123d27]">Câu hỏi thường gặp</h2>
        <details v-for="item in questions" :key="item.question"
            class="mb-3 rounded-2xl border border-slate-200 bg-white p-5">
            <summary class="cursor-pointer text-sm font-semibold text-slate-700">{{ item.question }}</summary>
            <p class="mt-4 text-sm leading-7 text-slate-500">{{ item.answer }}</p>
        </details>
    </section>
</template>