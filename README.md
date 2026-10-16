# 👑 TIẾN LÊN CỤC ZÀNG (Multiplayer Card Game)

Game đánh bài dân gian trực tuyến thời gian thực (Real-time Multiplayer) hỗ trợ chuẩn luật cả **Tiến Lên Miền Nam** và **Tiến Lên Miền Bắc**, sẵn sàng triển khai 1-click lên nền tảng **Render (Render.com)**.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Hỗ Trợ 2 Biến Thể Luật Dân Gian Chuyên Sâu**:
   - **Tiến Lên Miền Nam (TLMN)**:
     - Lối đánh tự do phóng khoáng, không phân biệt đồng chất đồng màu.
     - Hệ thống chặt Heo: 3 đôi thông, 4 đôi thông, Tứ quý.
     - Tính năng kiểm tra Tới Trắng (Sảnh rồng, Tứ quý 2, 5-6 đôi thông, đồng màu...).
     - Phạt thối Heo đen / Heo đỏ / Tứ quý / Đôi thông và tính Cóng (cháy bài).
   - **Tiến Lên Miền Bắc (TLMB)**:
     - Luật **Đồng Chất - Đồng Màu** nghiêm ngặt (Rác cùng chất, Đôi cùng màu, Sảnh cùng 1 chất duy nhất).
     - Heo Cơ ($2♥$) là lá bài cao nhất thiên hạ.
     - Tứ quý chặt 1 Heo theo vòng. Không có đôi thông chặt heo.
     - **Cấm tuyệt đối đánh 2 cuối cùng để về Nhất** (Xử thua thối 2 đền làng).

2. **Chơi Cùng Bạn Bè & Bot AI Thông Minh**:
   - Tạo phòng sinh mã ngắn gọn (VD: `ZANG88`), gửi link/mã cho bạn bè vào ngay không cần đăng ký tài khoản.
   - Hỗ trợ thêm **Bot Cục Zàng** tự động đánh khi thiếu người hoặc muốn chơi test 1 mình.
   - Bộ đếm ngược thời gian lượt đánh (Turn Timer 15s/20s) tự động đánh hoặc bỏ lượt khi người chơi mất kết nối.

3. **Bảo Mật Chống Gian Lận (Server-Authoritative)**:
   - Toàn bộ logic shuffle, chia bài, kiểm tra luật bài và tính điểm nằm hoàn toàn ở Server.
   - Client của từng người chơi chỉ nhận bài của chính mình qua Socket, không thể mở F12 xem trộm bài đối thủ.

4. **Âm Thanh & Hiệu Ứng Sôi Động**:
   - Tích hợp Web Audio API (tự sinh âm thanh bài, tiếng chặt heo trầm bổng, nhạc chiến thắng, không lo lỗi load file mp3).
   - Hiệu ứng pháo hoa ăn mừng chiến thắng (*Confetti*).

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN Ở MÔI TRƯỜNG LOCAL

### 1. Cài đặt các thư viện phụ thuộc:
```bash
npm run install-all
```

### 2. Chạy môi trường phát triển (Hot-reload cả Server & Client):
```bash
npm run dev
```
* **Frontend Vite**: `http://localhost:3000`
* **Game Server Express + Socket.IO**: `http://localhost:10000`

### 3. Build và chạy bản Production:
```bash
npm run build
npm start
```
Truy cập: `http://localhost:10000`

---

## ☁️ HƯỚNG DẪN TRIỂN KHAI LÊN RENDER (RENDER.COM)

Dự án được thiết kế theo kiến trúc **Monorepo Single-Service**: Express Server vừa làm WebSocket Game Server, vừa phục vụ trực tiếp bản build React Client tĩnh trên cùng 1 Port. Điều này giúp bạn:
- Chỉ tốn **1 Web Service duy nhất** (hoàn toàn miễn phí trên Render Free Tier).
- Không gặp lỗi kết nối CORS.

### Cách 1: Triển khai tự động bằng Blueprint (`render.yaml`)
1. Đẩy mã nguồn dự án lên GitHub.
2. Đăng nhập vào [Render.com](https://render.com).
3. Chọn **New +** $\rightarrow$ **Blueprint**.
4. Chọn repository GitHub vừa tạo $\rightarrow$ Render sẽ tự động đọc file `render.yaml` và triển khai!

### Cách 2: Triển khai thủ công (Manual Web Service)
1. Trên Render Dashboard, chọn **New +** $\rightarrow$ **Web Service**.
2. Kết nối tới Git repository của bạn.
3. Cấu hình thông số:
   - **Name**: `tien-len-cuc-zang`
   - **Region**: `Singapore` (để ping thấp nhất về Việt Nam)
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
4. Trong phần **Environment Variables**, thêm:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
5. Nhấn **Create Web Service**.

> [!TIP]
> **Mẹo chống Sleep trên Render Free Tier**:
> Gói Free của Render sẽ tự động ngủ sau 15 phút không có người truy cập. Để server luôn thức 24/7, bạn có thể đăng ký dịch vụ miễn phí như [UptimeRobot.com](https://uptimerobot.com) hoặc [Cron-job.org](https://cron-job.org) để ping định kỳ mỗi 10 phút vào endpoint:
> `https://<ten-game-cua-ban>.onrender.com/api/health`
