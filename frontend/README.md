# NexTime - Smart Group Coordination Ecosystem
**Frontend Mobile Application (React Native / Expo / TypeScript)**

![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)

---

## Giới thiệu
**NexTime** là hệ sinh thái hỗ trợ điều phối nhóm thông minh, hoạt động như một "productivity layer" giúp loại bỏ hoàn toàn sự chồng chéo trong việc lên lịch trình và theo dõi tiến độ công việc nhóm.

Ứng dụng di động NexTime mang đến giao diện hiện đại, tối ưu hoá với tông màu chủ đạo `#0066FF`, mang lại trải nghiệm mượt mà trên cả 3 nền tảng: **iOS, Android và Web**.

---

## Tính năng cốt lõi

### 1. Bản đồ nhiệt lịch trình (Visual Synchronization)
- Tự động so khớp và hiển thị trực quan các khoảng thời gian rảnh/bận của các thành viên trong nhóm thông qua thuật toán Heatmap (màu sắc biểu thị độ bận từ Level 1 đến Level 5).
- Tích hợp tuỳ chọn ẩn danh hoặc công khai linh hoạt, bảo đảm quyền riêng tư tuyệt đối cho người dùng.

### 2. Tự động hóa tác vụ (Driven Automation / AI Prompt)
- Tích hợp AI Trợ lý hỗ trợ phân tích trực tiếp các đoạn hội thoại, tin nhắn hoặc mô tả thô.
- Tự động trích xuất và đề xuất các đầu việc thành checklist quản lý tiến độ thông minh chỉ với một thao tác xác nhận.

### 3. Giao tiếp & Theo dõi tiến độ (Seamless Accountability)
- Hệ thống phòng chat nhóm và cá nhân thời gian thực (Real-time messaging).
- Quản lý đầu việc gắn liền với từng phòng chat, từ khâu lên ý tưởng, bình chọn lịch biểu đến hoàn thành tác vụ.

---

## Cấu trúc thư mục
Dự án được cấu trúc theo chuẩn Clean Architecture / Feature-based kết hợp với Service Layer, giúp dễ dàng mở rộng và bảo trì:

```plaintext
src/
├── api/              # Cấu hình Axios, xử lý Interceptor & danh sách Endpoints
├── components/       # Các UI Component tái sử dụng (Button, Input, Modal,...)
├── constants/        # Token thiết kế: Bảng màu (Colors), Typography, Spacing, Theme
├── hooks/            # Custom Hooks quản lý logic và trạng thái (useAuth, useSchedules,...)
├── navigation/       # Quản lý luồng điều hướng (Root, Stacks, Bottom Tabs)
├── screens/          # Các màn hình chính phân chia theo Feature
│   ├── Auth/         # Landing (Onboarding), Login, Register
│   ├── Home/         # Bảng điều khiển chính (Dashboard)
│   ├── Schedule/     # Lịch trình & Heatmap nhóm
│   ├── Chat/         # Danh sách tin nhắn & Phòng chat
│   ├── Checklist/    # Quản lý sự kiện và AI Prompt
│   └── Profile/      # Quản lý hồ sơ, Cài đặt, QR Code
├── services/         # Tầng giao tiếp Backend API (Auth, Room, Checklist, Schedule, AI)
├── types/            # Định nghĩa toàn bộ TypeScript Interfaces & Types
└── utils/            # Tiện ích định dạng thời gian, Token Storage (Hỗ trợ đa nền tảng)
```

---

## Hướng dẫn cài đặt và khởi chạy

### 1. Yêu cầu hệ thống
- Node.js (Phiên bản v18.x hoặc v20.x trở lên)
- Expo CLI

### 2. Cài đặt thư viện
Mở Terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```

### 3. Khởi chạy ứng dụng

#### Chạy trên nền tảng Web (Khuyên dùng khi phát triển trên máy tính):
Ứng dụng được cấu hình bọc trong một Khung điện thoại ảo (Mobile Phone Mockup Frame) sang trọng, mang lại trải nghiệm mobile hoàn hảo ngay trên trình duyệt:
```bash
npm run web
```
*(Nếu cần xóa bộ nhớ đệm cache, chạy: `npm run web -- -c`)*

#### Chạy trên thiết bị di động hoặc máy ảo:
```bash
npx expo start
```
- **iOS:** Quét mã QR bằng camera (cần cài ứng dụng Expo Go).
- **Android:** Quét mã QR bằng ứng dụng Expo Go.

---

## Liên kết hệ thống
- **Figma Design:** [NexTime Mobile App Design](https://www.figma.com/proto/EQlP4wl60RQoijFUXdxk00/NexTime-Mobile-App-Design?node-id=615-3226)
- **API Swagger Document:** [https://nextime-mobile-app.onrender.com/api-docs](https://nextime-mobile-app.onrender.com/api-docs)

---
<div align="center">
  <p>Được thiết kế và phát triển cho hệ sinh thái NexTime.</p>
</div>
