# Giao diện storefront theo mẫu điện thoại

Cập nhật: 14/09/2026. Triển khai theo 8 ảnh tham chiếu và yêu cầu hiện tại của chủ shop.

## Đã triển khai

- Header cố định màu hồng, viền lượn sóng; nền trong và blur khi cuộn. Menu, tìm kiếm, ví voucher, giỏ hàng; điều hướng đầy đủ trên desktop.
- Menu bên trái cuộn độc lập, nền ngoài tối và blur, khóa cuộn trang. Native dialog hỗ trợ Escape, giữ focus trong menu và trả focus khi đóng.
- Banner lấy từ API quản trị hiện có, lọc slide đang bật, giữ thứ tự, tối đa 5 ảnh; vuốt ngang, chấm điều hướng, nút trước/sau trên desktop và tạm dừng. Tôn trọng reduced motion và dừng tự chuyển khi tab bị ẩn. Nếu chưa có ảnh, hiển thị lời chào bằng HTML/CSS.
- Dải nốt nhạc pastel, nốt tương tác rung trước khi mở ví voucher.
- Trang chủ và trang sản phẩm dùng chung catalog: tìm kiếm không dấu, bộ lọc loại, danh mục từ tags thực tế, mới nhất / giá tăng / giá giảm, phân trang 12 sản phẩm, nhớ lựa chọn số cột trên trình duyệt.
- Điện thoại / tablet: 2 hoặc 3 cột; desktop: 4 hoặc 6 cột. Thẻ sản phẩm viền hồng mềm, tên và giá đổi hồng khi hover/focus/tap.
- Phần dịch vụ custom, giờ làm việc, thông tin thanh toán, mạng xã hội, chính sách và lời cảm ơn. Thông tin được tái sử dụng trong menu và footer.
- Giữ các route và API của chi tiết sản phẩm, chọn phôi cho kit, giỏ hàng, checkout, đăng nhập, đăng ký, lịch sử đơn hàng và quản trị. Sửa vị trí sticky của chi tiết/giỏ/checkout để không nằm dưới header.
- Font Mali 600 tự host, gồm ký tự Latin và tiếng Việt, khoảng 24 KB WOFF2; kèm giấy phép OFL. Nội dung dài và form dùng font dễ đọc.

## Thay thông tin shop

Chỉnh `src/app/core/storefront.config.ts`:

- `instagram`, `facebook`, `tiktok`, `youtube`: hiện dùng trang chủ các nền tảng theo yêu cầu chủ shop; thay bằng URL tài khoản sau.
- `email`: để trống thì ẩn email và dùng trang liên hệ / Facebook. Không dùng địa chỉ email minh họa để nhận thư thật.
- `hours`, `workdays`, `holidayNote`: lịch làm việc lấy theo mẫu.
- `bankName`, `bankAccountNumber`, `bankAccountName`, `bankQrImage`: chỉ điền thông tin chính thức. QR chung trong menu/footer chỉ hiện khi có ảnh. Khi chưa cấu hình, hướng dẫn khách lấy QR từ kết quả đặt hàng.
- Banner tiếp tục được chỉnh tại `/admin/slides`, không có sản phẩm hoặc ảnh bán hàng giả trong mã ứng dụng.

Wordmark hiện là chữ dựng bằng font hiện có. Có thể thay bằng logo SVG chính thức khi shop có bộ nhận diện hoàn chỉnh.

## Phạm vi cần backend / dữ liệu bổ sung

1. **Voucher:** backend hiện không có API cấp, nhận, liệt kê, hết hạn hoặc áp dụng voucher vào checkout. UI hiển thị chương trình dự kiến giảm 20.000đ, hiệu lực 7 ngày, trạng thái “Sắp ra mắt”. Không lưu voucher giả vào localStorage và không tự trừ tiền đơn hàng. Để mở thật cần kiểm tra đăng nhập, nhận một lần, thời điểm hết hạn và số tiền giảm ở server, sau đó nối UI với API.
2. **Phổ biến:** API chưa có số lượt bán / xem hoặc tham số sắp xếp tương ứng. Lựa chọn này đang vô hiệu hóa, không suy đoán thứ hạng bằng ID.
3. **Danh mục nhân vật / phim / game:** hiện tận dụng tags của sản phẩm. Shop có thể nhập các tag này qua trang quản trị sản phẩm; chưa có thực thể category riêng.
4. **Phân trang:** API hiện trả mảng, giới hạn 100 bản ghi/request và không có tổng số/sort. Catalog đọc lần lượt tất cả trang trước khi lọc và sắp giá để không bỏ sót sản phẩm sau bản ghi 100. Phân trang hiển thị được thực hiện ở client. Khi catalog lớn, nên bổ sung API có `content`, `totalElements`, `sort` và danh mục riêng để chuyển toàn bộ lọc/phân trang về server.
5. **Ngân hàng:** số `012345678` trong mẫu không được dùng. Luồng QR thanh toán theo đơn từ API hiện có được giữ nguyên.

Không thay đổi backend hoặc hai file admin-product-form đang có thay đổi từ trước trong workspace.

## Kiểm tra

```text
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm start -- --host 127.0.0.1
npm run test:storefront
```

Trên PowerShell có thể dùng `npm.cmd` nếu chính sách máy chặn `npm.ps1`. Đặt `CHROME_BIN` cho Karma và `CHROME_PATH` cho kiểm thử storefront nếu Chrome không nằm ở vị trí mặc định. `APP_URL` cho phép đổi địa chỉ frontend kiểm thử.

`scripts/verify-storefront.mjs` intercept API bằng fixtures: 125 sản phẩm, 3 slide, giỏ và kết quả thanh toán mô phỏng. Kiểm tra 5 kích thước màn hình, menu/focus/khóa cuộn, chuyển sang voucher, reduced motion, vuốt slide, giữ số cột, tìm tiếng Việt không dấu, sắp giá xuyên các trang API, phân trang/lọc, trạng thái trống/lỗi/thử lại, giỏ hàng, validation/submit checkout và auth guard. Không tạo tài khoản hoặc đơn hàng thật.

Ảnh kiểm thử nằm trong `ui-screenshots-mobile/redesign/`; đó là dữ liệu mô phỏng, không phải nội dung bán hàng. Backend chưa chạy tại thời điểm kiểm thử, nên cần kiểm tra tích hợp thật khi backend và dữ liệu shop sẵn sàng.
