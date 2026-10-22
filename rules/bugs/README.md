# Bugs — lỗi đã biết của Personal-Dashboard

Mỗi file là **một** lỗi: `BUG-NNN-<slug>.md`, đánh số theo mức độ lúc phát hiện. Đợt đầu được ghi
lại ngày 2026-10-22, khi đối chiếu `rules/docs/requirements/` với code.

## Quy ước

- File gồm: bảng thông tin (mức độ, loại, trạng thái, spec), **Hiện tượng**, **Vị trí trong
  code**, **Hướng sửa đề xuất**. Ghi chú ⚠️ = chi tiết chưa được xác minh lại trong code.
- Mức độ: **Cao** (sai dữ liệu, bảo mật, mất phiên) · **Trung bình** (sai hành vi) · **Thấp**
  (UI, i18n, code chết, cần quyết định).
- Sửa xong: đổi `Trạng thái` thành `Đã sửa — <commit>`, cập nhật spec liên quan, giữ file để tra
  lại. Lỗi mới: lấy số tiếp theo và thêm một dòng vào bảng dưới.

## Danh sách

| ID                                                        | Mức độ     | Loại           | Lỗi                                                                              | Trạng thái |
| --------------------------------------------------------- | ---------- | -------------- | -------------------------------------------------------------------------------- | ---------- |
| [BUG-001](BUG-001-google-login-audience-unset.md)         | Cao        | Bảo mật        | Google login không kiểm tra token được cấp cho app nào                           | Mở         |
| [BUG-002](BUG-002-protected-routes-incomplete.md)         | Cao        | Bug            | Nhiều trang cần đăng nhập không được proxy làm mới phiên                         | Mở         |
| [BUG-003](BUG-003-dashboard-char-overwrites-server-xp.md) | Cao        | Dữ liệu        | Dashboard ghi đè XP/coin mà server vừa thay đổi                                  | Mở         |
| [BUG-004](BUG-004-reschedule-habit-strips-first-word.md)  | Cao        | Bug            | Reschedule habit cắt mất từ đầu tiên của tên                                     | Mở         |
| [BUG-005](BUG-005-reschedule-habit-always-today.md)       | Cao        | Bug            | Reschedule habit luôn tạo task cho hôm nay                                       | Mở         |
| [BUG-006](BUG-006-reschedule-habit-undo-duplicates.md)    | Cao        | Bug            | Reschedule habit lỗi thì danh sách bị nhân đôi                                   | Mở         |
| [BUG-007](BUG-007-schedule-block-never-done.md)           | Trung bình | Bug            | Session không bao giờ được đánh dấu xong, tiến độ luôn 0                         | Mở         |
| [BUG-008](BUG-008-stats-ignore-date-range.md)             | Trung bình | Bug            | API thống kê bỏ qua khoảng ngày được yêu cầu                                     | Mở         |
| [BUG-009](BUG-009-stats-events-lower-completion.md)       | Trung bình | Bug            | Event làm tụt tỉ lệ hoàn thành trong thống kê                                    | Mở         |
| [BUG-010](BUG-010-capacity-counts-non-busy-events.md)     | Trung bình | Bug            | Insights tính cả event không bận vào tổng thời gian đã dùng                      | Mở         |
| [BUG-011](BUG-011-penalty-modal-amounts-mismatch.md)      | Trung bình | Bug            | Modal phạt hiện mức XP khác với mức server áp dụng                               | Mở         |
| [BUG-012](BUG-012-goal-complete-no-reward.md)             | Trung bình | Bug            | Hoàn thành goal không cộng XP/coin                                               | Mở         |
| [BUG-013](BUG-013-streak-never-increments.md)             | Trung bình | Bug            | `streak` không bao giờ tăng                                                      | Mở         |
| [BUG-014](BUG-014-task-archive-keeps-blocks.md)           | Trung bình | Dữ liệu        | Archive task (`active:false`) vẫn giữ session trong DB                           | Mở         |
| [BUG-015](BUG-015-project-delete-keeps-blocks.md)         | Trung bình | Dữ liệu        | Xoá project không xoá session của các task con                                   | Mở         |
| [BUG-016](BUG-016-category-delete-orphans.md)             | Trung bình | Dữ liệu        | Xoá category làm task/event mất nhãn                                             | Mở         |
| [BUG-017](BUG-017-category-duplicate-500.md)              | Trung bình | Bug            | Tạo category trùng tên trả 500 thay vì 409                                       | Mở         |
| [BUG-018](BUG-018-finance-category-exclude-not-saved.md)  | Trung bình | Bug            | `POST /finance/categories` không lưu `excludeFromTotals`                         | Mở         |
| [BUG-019](BUG-019-tasks-post-invalid-range.md)            | Trung bình | Bug            | `POST /tasks` với `endDate < startDate` vẫn trả 200                              | Mở         |
| [BUG-020](BUG-020-presets-no-ownership-check.md)          | Trung bình | Bảo mật        | Preset giao dịch không kiểm tra ví/category thuộc user, có thể vượt giới hạn 4   | Mở         |
| [BUG-021](BUG-021-budget-past-month-unchecked.md)         | Trung bình | Bug            | Server cho tạo ngân sách cho tháng đã qua                                        | Mở         |
| [BUG-022](BUG-022-wallet-negative-blocks-expense.md)      | Trung bình | Cần quyết định | Đặt số dư âm bằng tay được, nhưng sau đó mọi khoản chi bị từ chối                | Mở         |
| [BUG-023](BUG-023-multi-day-session-move-collapses.md)    | Trung bình | Bug            | Dời session của task nhiều ngày thì mọi session dồn về một ngày                  | Mở         |
| [BUG-024](BUG-024-tasks-all-view-page-only-sort.md)       | Trung bình | Bug            | Sắp xếp và lọc trạng thái ở view All chỉ áp dụng trong trang hiện tại            | Mở         |
| [BUG-025](BUG-025-habit-duplicate-slot-ids.md)            | Trung bình | Bug            | Hai slot habit cùng một ngày tạo ra trùng id lịch                                | Mở         |
| [BUG-026](BUG-026-share-tally-counts-events.md)           | Thấp       | Bug            | Dòng done/total khi share tính cả event                                          | Mở         |
| [BUG-027](BUG-027-share-image-thai-glyphs.md)             | Thấp       | Bug            | Ảnh tải về khi share hiện chữ Thái thành ô vuông                                 | Mở         |
| [BUG-028](BUG-028-events-page-untranslated.md)            | Thấp       | i18n           | Trang và form Events vẫn ghi cứng tiếng Anh                                      | Mở         |
| [BUG-029](BUG-029-notifications-get-waits-generation.md)  | Thấp       | Cần quyết định | `GET /notifications` vẫn chờ tạo thông báo xong mới trả                          | Mở         |
| [BUG-030](BUG-030-reminder-lead-not-timing.md)            | Thấp       | Bug            | Cài đặt "nhắc trước N phút" không ảnh hưởng thời điểm nhắc                       | Mở         |
| [BUG-031](BUG-031-task-fail-no-xp-loss.md)                | Thấp       | Cần quyết định | Task bỏ dở quá 7 ngày không bị trừ XP như spec cũ mô tả                          | Mở         |
| [BUG-032](BUG-032-icon-library-seed-legacy-only.md)       | Thấp       | Cần xác minh   | Thư viện icon có thể không nạp sẵn ảnh đã dùng cho một số tài khoản              | Mở         |
| [BUG-033](BUG-033-cloudinary-orphan-uploads.md)           | Thấp       | Dữ liệu        | File gỡ khỏi task vẫn nằm trên Cloudinary                                        | Mở         |
| [BUG-034](BUG-034-unused-settings.md)                     | Thấp       | Code chết      | Nhiều cài đặt được lưu nhưng không có tác dụng                                   | Mở         |
| [BUG-035](BUG-035-profile-autosaving-label.md)            | Thấp       | UI             | Nhãn "Autosaving" ở `/profile` sai sự thật                                       | Mở         |
| [BUG-036](BUG-036-goal-withdraw-archive-no-ui.md)         | Thấp       | Thiếu UI       | Rút tiền khỏi goal tiết kiệm và archive goal không có nút trên web               | Mở         |
| [BUG-037](BUG-037-event-move-occurrence-no-ui.md)         | Thấp       | Thiếu UI       | Dời một lần của event lặp chỉ làm được qua trợ lý                                | Mở         |
| [BUG-038](BUG-038-dead-code-quest-confirm.md)             | Thấp       | Code chết      | ConfirmQuestModal và luồng xác nhận quest không bao giờ được gọi                 | Mở         |
| [BUG-039](BUG-039-dead-code-week-components.md)           | Thấp       | Code chết      | TaskWeekView, WeekStats và các hộp thoại Strict/Flexible không còn được hiển thị | Mở         |
| [BUG-040](BUG-040-dead-code-theme-toggle.md)              | Thấp       | Code chết      | ThemeToggle và RootLayout không còn được dùng                                    | Mở         |
| [BUG-041](BUG-041-quicknotes-stale-comment.md)            | Thấp       | Code chết      | Comment đầu file QuickNotes nhắc menu ＋ trên topbar đã bị gỡ                    | Mở         |
