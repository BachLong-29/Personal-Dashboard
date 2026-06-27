# FEATURE_DEVELOPMENT_GUIDELINE.md

## Mục tiêu

[Mô tả ngắn gọn tính năng cần xây dựng]

---

# Yêu cầu thực hiện

## Bước 1: Phân tích Requirement

### Trước khi code

- Phân tích toàn bộ requirement.
- Xác định rõ:
  - Mục tiêu business.
  - User problem cần giải quyết.
  - Danh sách chức năng.
  - Edge cases.
  - Dữ liệu cần sử dụng.
  - Component/UI cần tạo hoặc tái sử dụng.

### Nếu requirement chưa rõ

- Liệt kê các phương án triển khai.
- Đề xuất phương án phù hợp nhất.
- Giải thích lý do lựa chọn.

---

## Bước 2: Viết Documentation

Tạo file documentation trước khi bắt đầu code.

### Overview

Mô tả ngắn gọn tính năng.

### Business Goal

Tính năng này giải quyết vấn đề gì.

### Functional Requirements

Liệt kê toàn bộ chức năng.

### UI Requirements

Mô tả giao diện và hành vi.

### Data Requirements

Nguồn dữ liệu sử dụng.

### Technical Notes

Các lưu ý kỹ thuật.

### Acceptance Criteria

Điều kiện để tính năng được xem là hoàn thành.

---

## Bước 3: Kiểm tra hệ thống hiện tại

### Trước khi triển khai

Kiểm tra:

- Component có sẵn trong Design System.
- Service/API hiện có.
- State Management hiện có.
- Chart Library đã được cài đặt chưa.
- Animation Library đã được cài đặt chưa.

### Nếu thiếu dependency

- Đề xuất package phù hợp.
- Giải thích lý do lựa chọn.
- Chỉ cài đặt khi thực sự cần thiết.

---

## Bước 4: Thiết kế giải pháp

### Component Structure

Ví dụ:

```text
DashboardStats
├── StatsSummaryCard
├── StatsChart
├── HeatmapCalendar
└── OverdueTasks
```

### Data Flow

Mô tả dữ liệu đi từ đâu đến đâu.

### State Management

Mô tả state cần quản lý.

### API Integration

Liệt kê endpoint sử dụng.

---

## Bước 5: Triển khai

Thực hiện theo thứ tự:

1. Data Layer
2. Business Logic
3. UI Components
4. Animation
5. Responsive
6. Testing

---

## Bước 6: Báo cáo kết quả

### Files Created

Liệt kê file mới.

### Files Updated

Liệt kê file chỉnh sửa.

### Dependencies Added

Liệt kê package mới.

### Features Completed

Danh sách chức năng hoàn thành.

### Remaining Work

Danh sách phần chưa làm.

---

# UI Guidelines

Luôn ưu tiên:

- Sử dụng component từ Design System.
- Giao diện đồng nhất với hệ thống hiện tại.
- Responsive trên Mobile, Tablet, Desktop.
- Hỗ trợ Dark Mode nếu project đang hỗ trợ.
- Có Loading State.
- Có Empty State.
- Có Error State.
- Có Animation mượt mà cho tương tác và dữ liệu.

---

# Chart Guidelines

## Trước khi sử dụng Chart

- Kiểm tra chart library hiện có.
- Không cài thêm nếu thư viện hiện tại đáp ứng được.

## Thiết kế Chart

- Sử dụng màu từ Design Token hoặc Theme hiện tại.
- Không hard-code màu sắc.
- Hỗ trợ Responsive.
- Tooltip rõ ràng, dễ đọc.

## Animation

Bắt buộc có animation khi:

- Load dữ liệu.
- Hover.
- Filter dữ liệu.
- Update dữ liệu.

---

# Code Quality

- Không duplicate code.
- Ưu tiên reusable component.
- Type-safe.
- Tuân thủ convention hiện tại của project.
- Không tạo technical debt không cần thiết.
- Không thêm code thừa.
- Không thêm dependency nếu không thật sự cần.

---

# Lưu ý bắt buộc

## Documentation

- Viết Requirement trước khi code.
- Viết Documentation trước khi code.

## Codebase

- Luôn kiểm tra codebase hiện tại trước khi triển khai.
- Tận dụng component và logic có sẵn nếu phù hợp.

## UI

- Luôn ưu tiên Design System.
- Giữ UI đồng nhất với toàn bộ hệ thống.
- Ưu tiên component tái sử dụng.
- Luôn có Loading State.
- Luôn có Empty State.
- Luôn có Error State.
- Luôn có Responsive Design.

## Styling

- Chỉ sử dụng TailwindCSS.
- Không tạo file CSS mới.
- Không chỉnh sửa global.css nếu không được yêu cầu.
- Không hard-code màu sắc.
- Luôn sử dụng Theme hoặc Design Token hiện có.

## Animation

- Luôn thêm animation phù hợp.
- Animation phải đồng bộ với Design System.
- Không sử dụng animation gây ảnh hưởng hiệu năng.

## Dependencies

- Không cài package mới nếu chưa đánh giá giải pháp hiện tại.
- Ưu tiên thư viện đã tồn tại trong project.

## Delivery

- Báo cáo đầy đủ các thay đổi sau khi hoàn thành.
- Liệt kê đầy đủ file tạo mới và file chỉnh sửa.
- Liệt kê dependency được thêm vào (nếu có).
- Xác nhận các Acceptance Criteria đã hoàn thành.
  feature_development_guideline
