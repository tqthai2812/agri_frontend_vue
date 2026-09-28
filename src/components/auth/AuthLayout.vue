<script setup>
import { RouterLink } from "vue-router";
import "@/styles/nfarm-auth.css";

defineProps({
    title: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <div class="nf-auth">
        <header class="nf-header">
            <div class="nf-header-inner">
                <RouterLink to="/" class="nf-logo" aria-label="NFarmHouse - Về trang chủ">
                    <span class="nf-logo-mark">N</span>

                    <span>
                        <strong>NFarmHouse</strong>
                        <small>Agricultural professor</small>
                    </span>
                </RouterLink>

                <span class="nf-header-divider"></span>

                <span class="nf-header-title">
                    {{ title }}
                </span>

                <a href="mailto:nfarmhouse@gmail.com" class="nf-help">
                    Bạn cần giúp đỡ?
                </a>
            </div>
        </header>

        <main class="nf-main">
            <div class="nf-main-inner">
                <section class="nf-story">
                    <span class="nf-eyebrow">
                        <span></span>
                        ĐỒNG HÀNH CÙNG NHÀ NÔNG
                    </span>

                    <h2>
                        Gieo niềm tin.<br />
                        <em>Gặt mùa bội thu.</em>
                    </h2>

                    <p>
                        Vật tư nông nghiệp, kiến thức canh tác và giải pháp
                        chăm sóc cây trồng — cùng bạn vun trồng mỗi ngày.
                    </p>

                    <div class="nf-landscape">
                        <svg viewBox="0 0 580 250" fill="none">
                            <circle cx="435" cy="73" r="42" fill="#ffc928" />

                            <path d="M0 152 Q135 53 290 150 T580 142 V250 H0Z" fill="#236c45" />

                            <path d="M0 195 Q180 109 350 173 T580 163 V250 H0Z" fill="#3a8253" />

                            <path d="M0 222 Q230 152 580 202 V250 H0Z" fill="#76a46c" />

                            <path d="M84 250 Q244 186 580 203 M168 250 Q315 198 580 217 M280 250 Q407 215 580 231"
                                stroke="#cee0ab" stroke-width="3" />

                            <path d="M246 250 Q332 177 410 153" stroke="#eac969" stroke-width="13" />

                            <path
                                d="M107 166V99 M107 137 Q67 137 72 107 Q106 108 107 137 M108 120 Q142 120 145 88 Q110 87 108 120"
                                stroke="#bed48f" stroke-width="3" fill="#9ec27e" />

                            <path d="M165 161V127 M166 141 Q190 142 189 121 Q170 122 166 141" stroke="#cce0a0"
                                stroke-width="3" fill="#cce0a0" />
                        </svg>

                        <span class="nf-landscape-caption">
                            NFarmHouse
                            <span>·</span>
                            Cùng vun trồng tương lai xanh
                        </span>
                    </div>

                    <div class="nf-story-tags">
                        <span>Vật tư nông nghiệp</span>
                        <span>Kiến thức canh tác</span>
                        <span>Chăm sóc cây trồng</span>
                    </div>
                </section>

                <section class="nf-card" :aria-label="title">
                    <slot />
                </section>
            </div>
        </main>

        <footer class="nf-footer">
            <div>
                <strong>NFarmHouse</strong>
                <span>Trao niềm tin, nhận tài lộc.</span>
            </div>

            <nav>
                <a href="tel:+84334745378">
                    +84 334 745 378
                </a>

                <a href="mailto:nfarmhouse@gmail.com">
                    nfarmhouse@gmail.com
                </a>

                <RouterLink to="/">
                    Về trang chủ ↗
                </RouterLink>
            </nav>

            <small>
                © {{ new Date().getFullYear() }} NFarmHouse.
                All rights reserved.
            </small>
        </footer>
    </div>
</template>