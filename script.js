// =====================================================================
// 1. TIỆN ÍCH CƠ BẢN (XSS & FORMAT)
// =====================================================================
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatVND(amount) {
    return amount.toLocaleString("vi-VN") + "đ";
}

// Bảng giá chuẩn khớp với trang goitap.html
const DTEAM_PRICING = {
    "BJJ & Grappling": {
        "Beginner (Mới bắt đầu)": 699000,
        "Intermediate (Đã có nền tảng)": 899000,
    },
    MMA: {
        "Beginner (Mới bắt đầu)": 799000,
        "Intermediate (Đã có nền tảng)": 999000,
    },
    Kickboxing: {
        "Beginner (Mới bắt đầu)": 699000,
        "Intermediate (Đã có nền tảng)": 899000,
    },
};

// Ưu đãi theo kỳ hạn đăng ký
const DURATION_PLANS = {
    "1 tháng": { months: 1, discount: 0, note: "Thanh toán theo tháng tại phòng tập" },
    "3 tháng": { months: 3, discount: 0.05, note: "Ưu đãi tiết kiệm 5% cho gói 3 tháng" },
    "6 tháng": { months: 6, discount: 0.1, note: "Ưu đãi tiết kiệm 10% + Tặng băng quấn tay" },
    "12 tháng": { months: 12, discount: 0.15, note: "Ưu đãi tiết kiệm 15% + Tặng áo D-TEAM" },
};

let currentMode = "trial"; // 'trial' hoặc 'package'

/* =====================================================================
   2. KHỞI TẠO KHI TRANG TẢI XONG
===================================================================== */
window.addEventListener("DOMContentLoaded", () => {
    injectEnhancedStyles();
    initScrollProgressAndBackToTop();
    initScrollReveal();
    initImageLightbox();
    initCtaFeatures(); // Chỉ chạy nếu trang có form đăng ký
    
});

/* =====================================================================
   3. CSS BỔ TRỢ CHO CÁC TÍNH NĂNG JS & HỌA TIẾT
===================================================================== */
function injectEnhancedStyles() {
    const style = document.createElement("style");
    style.textContent = `
        /* Thanh tiến trình đọc trang */
        #dteamScrollProgress {
            position: fixed; top: 0; left: 0; height: 3px; width: 0%;
            background: linear-gradient(90deg, #AD8D53, #C7A66A, #f3d79b);
            z-index: 10001; transition: width 0.1s linear;
        }
        /* Sticky Header mượt mà */
        header.is-scrolled {
            position: sticky; top: 0; z-index: 999;
            background: rgba(0, 0, 0, 0.92) !important;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
            transition: all 0.3s ease;
        }
        /* Hiệu ứng xuất hiện khi cuộn */
        .dteam-reveal {
            opacity: 0; transform: translateY(26px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .dteam-reveal.is-visible {
            opacity: 1; transform: translateY(0);
        }
        /* Nút cuộn lên đầu trang */
        #dteamBackToTop {
            position: fixed; bottom: 25px; right: 25px; width: 44px; height: 44px;
            border-radius: 50%; background: #C7A66A; color: #111; border: none;
            font-size: 20px; font-weight: bold; cursor: pointer;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
            opacity: 0; visibility: hidden; transform: translateY(12px);
            transition: all 0.3s ease; z-index: 998;
        }
        #dteamBackToTop.show { opacity: 1; visibility: visible; transform: translateY(0); }
        #dteamBackToTop:hover { background: #AD8D53; color: #fff; transform: translateY(-3px); }
        
        /* Lightbox phóng to ảnh */
        #dteamLightbox {
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.92);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 20px; z-index: 10000; opacity: 0; visibility: hidden;
            transition: opacity 0.28s ease; cursor: zoom-out;
        }
        #dteamLightbox.open { opacity: 1; visibility: visible; }
        #dteamLightbox img {
            max-width: 95%; max-height: 86vh; border: 3px solid #C7A66A;
            border-radius: 6px; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
            transform: scale(0.95); transition: transform 0.28s ease;
        }
        #dteamLightbox.open img { transform: scale(1); }
        #dteamLightbox span { margin-top: 12px; color: #C7A66A; font-size: 14px; letter-spacing: 1px; }

        /* Khung tạm tính giá trên trang cta.html */
        .price-preview-box {
            background: rgba(199, 166, 106, 0.1); border: 1px dashed #C7A66A;
            border-radius: 5px; padding: 13px 15px; margin-bottom: 18px;
            display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;
        }
        .price-preview-box span { color: #D8D8D0; font-size: 13px; }
        .price-preview-box strong { color: #C7A66A; font-size: 19px; }
        .price-preview-box small { width: 100%; color: #9be0a8; font-size: 12px; }

        /* Toast thông báo */
        .dteam-toast {
            position: fixed; top: 22px; right: 22px; background: #181E19; color: #F2F0E9;
            border-left: 4px solid #C7A66A; padding: 13px 18px; border-radius: 4px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45); font-size: 14px; z-index: 10002;
            animation: dteamToastIn 0.3s ease;
        }
        @keyframes dteamToastIn {
            from { opacity: 0; transform: translateX(25px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}

function showToast(msg) {
    const existing = document.querySelector(".dteam-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "dteam-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* =====================================================================
   4. THANH TIẾN TRÌNH CUỘN, STICKY HEADER & BACK TO TOP
===================================================================== */
function initScrollProgressAndBackToTop() {
    const progress = document.createElement("div");
    progress.id = "dteamScrollProgress";
    document.body.appendChild(progress);

    const btnTop = document.createElement("button");
    btnTop.id = "dteamBackToTop";
    btnTop.title = "Lên đầu trang";
    btnTop.innerHTML = "↑";
    document.body.appendChild(btnTop);

    const header = document.querySelector("header");

    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        progress.style.width = percent + "%";
        if (header) header.classList.toggle("is-scrolled", scrollTop > 60);
        btnTop.classList.toggle("show", scrollTop > 400);
    });

    btnTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* =====================================================================
   5. HIỆU ỨNG SCROLL REVEAL CHO CÁC KHỐI NỘI DUNG
===================================================================== */
function initScrollReveal() {
    const items = document.querySelectorAll(
        ".intro, .card, .student-card, .coach-content, .gym-images img, .discipline-main, .cardkhoahoc, .anhlichtap"
    );
    if (!items.length) return;

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );

    items.forEach((el) => {
        el.classList.add("dteam-reveal");
        observer.observe(el);
    });
}

/* =====================================================================
   6. LIGHTBOX PHÓNG TO ẢNH
===================================================================== */
function initImageLightbox() {
    const imgs = document.querySelectorAll(".anhlichtap img, .gym-images img");
    if (!imgs.length) return;

    const lb = document.createElement("div");
    lb.id = "dteamLightbox";
    lb.innerHTML = `<img src="" alt="DTEAM Zoom"><span>Bấm vào bất kỳ đâu hoặc nhấn ESC để đóng</span>`;
    document.body.appendChild(lb);

    const lbImg = lb.querySelector("img");

    imgs.forEach((img) => {
        img.style.cursor = "zoom-in";
        img.title = "Bấm để phóng to";
        img.addEventListener("click", () => {
            lbImg.src = img.src;
            lb.classList.add("open");
        });
    });

    lb.addEventListener("click", () => lb.classList.remove("open"));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") lb.classList.remove("open");
    });
}

/* =====================================================================
   7. TRANG ĐĂNG KÝ (cta.html): CHUYỂN TAB, TÍNH GIÁ, VALIDATE & SUBMIT
===================================================================== */
function initCtaFeatures() {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) return; // Thoát nếu trang không chứa form đăng ký

    const trialDateInput = document.getElementById("trialDate");
    if (trialDateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        trialDateInput.min = now.toISOString().slice(0, 16);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
        trialDateInput.value = tomorrow.toISOString().slice(0, 16);
    }

    const packageFields = document.getElementById("packageFields");
    if (packageFields) {
        const preview = document.createElement("div");
        preview.className = "price-preview-box";
        preview.innerHTML = `
            <span>Học phí dự kiến:</span>
            <strong id="estimatedPrice">699.000đ</strong>
            <small id="discountNote"></small>
        `;
        packageFields.appendChild(preview);
    }

    ["sport", "duration", "level"].forEach((id) => {
        document.getElementById(id)?.addEventListener("change", updateEstimatedPrice);
    });
    updateEstimatedPrice();

    const params = new URLSearchParams(window.location.search);
    const bomon = params.get("bomon");
    const trinhdo = params.get("trinhdo");

    if (bomon || trinhdo) {
        switchTab("package", document.getElementById("tabPackageBtn"));
        if (bomon) document.getElementById("sport").value = bomon;
        if (trinhdo) document.getElementById("level").value = trinhdo;
        updateEstimatedPrice();

        const notice = document.getElementById("case1Notice");
        if (notice) notice.style.display = "block";
    }
}

function updateEstimatedPrice() {
    const sport = document.getElementById("sport")?.value || "Kickboxing";
    const duration = document.getElementById("duration")?.value || "1 tháng";
    const level = document.getElementById("level")?.value || "Beginner (Mới bắt đầu)";

    const monthlyPrice = DTEAM_PRICING[sport]?.[level] || 699000;
    const plan = DURATION_PLANS[duration] || { months: 1, discount: 0, note: "" };
    const total = Math.round(monthlyPrice * plan.months * (1 - plan.discount));

    const priceEl = document.getElementById("estimatedPrice");
    const noteEl = document.getElementById("discountNote");
    if (priceEl) priceEl.textContent = formatVND(total);
    if (noteEl) noteEl.textContent = plan.discount > 0 ? `✓ ${plan.note}` : plan.note;
}

function switchTab(mode, btnElement) {
    currentMode = mode;

    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");

    const notice = document.getElementById("case1Notice");

    if (mode === "trial") {
        document.getElementById("trialFields").style.display = "block";
        document.getElementById("packageFields").style.display = "none";
        document.getElementById("btnSubmitText").innerText = "XÁC NHẬN ĐĂNG KÝ TẬP THỬ";
        if (notice) notice.style.display = "none";
    } else {
        document.getElementById("trialFields").style.display = "none";
        document.getElementById("packageFields").style.display = "block";
        document.getElementById("btnSubmitText").innerText = "XÁC NHẬN ĐĂNG KÝ GÓI TẬP";
        updateEstimatedPrice();
    }
}

function submitForm() {
    const fullname = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim().replace(/\s+/g, "");
    const sport = document.getElementById("sport").value;
    const note = document.getElementById("note")?.value.trim() || "";

    if (fullname.length < 2) {
        showToast("⚠ Vui lòng nhập đầy đủ họ và tên!");
        document.getElementById("fullname").focus();
        return;
    }

    const vnPhoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!vnPhoneRegex.test(phone)) {
        showToast("⚠ Số điện thoại chưa hợp lệ (10 chữ số, VD: 0969796325)");
        document.getElementById("phone").focus();
        return;
    }

    let detailHTML = `
        <p><strong>Loại hình:</strong> ${currentMode === "trial" ? "Đăng ký tập thử (Free)" : "Đăng ký gói tập"}</p>
        <p><strong>Họ và tên:</strong> ${escapeHTML(fullname)}</p>
        <p><strong>Số điện thoại:</strong> ${escapeHTML(phone)}</p>
        <p><strong>Bộ môn:</strong> ${escapeHTML(sport)}</p>
    `;

    let zaloText = `[D-TEAM ĐĂNG KÝ]\n• Hình thức: ${currentMode === "trial" ? "Tập thử Free" : "Đăng ký gói tập"}\n• Họ tên: ${fullname}\n• SĐT: ${phone}\n• Bộ môn: ${sport}`;

    if (currentMode === "trial") {
        const rawDate = document.getElementById("trialDate").value;
        const formattedDate = rawDate
            ? new Date(rawDate).toLocaleString("vi-VN", {
                  hour: "2-digit", minute: "2-digit",
                  day: "2-digit", month: "2-digit", year: "numeric",
              })
            : "Chưa chọn";

        detailHTML += `<p><strong>Lịch tập thử:</strong> ${escapeHTML(formattedDate)}</p>`;
        zaloText += `\n• Lịch hẹn: ${formattedDate}`;
    } else {
        const duration = document.getElementById("duration").value;
        const level = document.getElementById("level").value;
        const priceText = document.getElementById("estimatedPrice")?.textContent || "";

        detailHTML += `
            <p><strong>Thời hạn gói:</strong> ${escapeHTML(duration)}</p>
            <p><strong>Trình độ:</strong> ${escapeHTML(level)}</p>
            <p><strong>Học phí dự kiến:</strong> ${escapeHTML(priceText)}</p>
        `;
        zaloText += `\n• Gói tập: ${duration} - ${level}\n• Học phí dự kiến: ${priceText}`;
    }

    if (note) {
        detailHTML += `<p><strong>Ghi chú:</strong> ${escapeHTML(note)}</p>`;
        zaloText += `\n• Ghi chú: ${note}`;
    }

    detailHTML += `
        <button type="button" id="copyZaloBtn" style="
            margin-top: 14px; width: 100%; padding: 10px; background: transparent;
            border: 1px solid #C7A66A; color: #C7A66A; border-radius: 4px;
            font-family: inherit; font-weight: bold; cursor: pointer;
        ">📋 Sao chép phiếu đăng ký để gửi Zalo</button>
    `;

    document.getElementById("resultContent").innerHTML = detailHTML;
    document.getElementById("registerForm").style.display = "none";
    document.querySelector(".tab-group").style.display = "none";
    const notice = document.getElementById("case1Notice");
    if (notice) notice.style.display = "none";
    document.getElementById("successBox").style.display = "block";

    showToast("✓ Đăng ký thành công!");

    document.getElementById("copyZaloBtn")?.addEventListener("click", () => {
        navigator.clipboard.writeText(zaloText).then(() => {
            showToast("✓ Đã sao chép! Bạn có thể dán gửi Zalo 0969796325");
        });
    });
}

function resetForm() {
    document.getElementById("registerForm").reset();
    document.getElementById("registerForm").style.display = "block";
    document.querySelector(".tab-group").style.display = "flex";
    document.getElementById("successBox").style.display = "none";
    switchTab("trial", document.querySelector(".tab-btn"));
}