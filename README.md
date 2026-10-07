# Hệ thống giám sát và điều khiển IoT

Bài tập lớn IoT sử dụng ESP32 để đo nhiệt độ, độ ẩm, ánh sáng và điều khiển 3 đèn LED qua giao diện web.

## Chức năng

- Hiển thị dữ liệu cảm biến và biểu đồ theo thời gian.
- Bật, tắt từng LED hoặc cả 3 LED.
- Tra cứu dữ liệu cảm biến và lịch sử bật, tắt LED.
- Tìm kiếm, sắp xếp và phân trang dữ liệu.
- Đăng nhập, xem hồ sơ và cài đặt ngưỡng cảnh báo cảm biến.

## Thành phần

| Thành phần | Công nghệ |
| --- | --- |
| Thiết bị | ESP32, DHT11, cảm biến ánh sáng, 3 LED |
| Giao tiếp với thiết bị | MQTT qua TLS, sử dụng HiveMQ Cloud |
| Máy chủ | Python, Flask |
| Cơ sở dữ liệu | MongoDB |
| Giao diện web | HTML, CSS, JavaScript, Chart.js |

ESP32 gửi dữ liệu qua MQTT tới máy chủ. Máy chủ lưu dữ liệu vào MongoDB và cung cấp API cho giao diện web. Lệnh điều khiển LED được gửi ngược lại qua MQTT.

## Chạy dự án

Chuẩn bị Python, MongoDB và tài khoản MQTT. Để nhận dữ liệu thực và điều khiển LED, cần kết nối ESP32 theo hướng dẫn bên dưới.

### 1. Cài thư viện

Mở PowerShell tại thư mục `IoT_Project` và chạy:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe -m pip install PyJWT
```

`PyJWT` cần cho chức năng đăng nhập nhưng hiện chưa được liệt kê trong `requirements.txt`.

### 2. Cấu hình kết nối

Nếu chưa có `backend/.env`, tạo từ tệp mẫu:

```powershell
Copy-Item backend/.env.example backend/.env
```

Sửa các giá trị trong `backend/.env`:

| Biến | Nội dung |
| --- | --- |
| `MONGODB_CONNECTION_STRING` | Chuỗi kết nối MongoDB; ví dụ `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Tên cơ sở dữ liệu, mặc định `iot_database` |
| `MQTT_BROKER_HOST` | Địa chỉ máy chủ MQTT |
| `MQTT_BROKER_PORT` | Cổng MQTT, mặc định `8883` |
| `MQTT_USERNAME`, `MQTT_PASSWORD` | Tài khoản MQTT |
| `API_PORT` | Cổng web, giữ `5000` để khớp cấu hình giao diện hiện tại |

Giữ các chủ đề MQTT trong tệp mẫu nếu dùng mã ESP32 hiện tại.

### 3. Khởi động

```powershell
cd backend
..\.venv\Scripts\python.exe main.py
```

- Giao diện: [http://localhost:5000](http://localhost:5000).
- Tài liệu API: [http://localhost:5000/docs/](http://localhost:5000/docs/).
- Tài khoản thử nghiệm: `demo`, mật khẩu `123456`.

Flask phục vụ cả giao diện và API, nên không cần chạy máy chủ giao diện riêng.

## Cấu hình ESP32

Mở [IoT_Device.ino](hardware/IoT_Device/IoT_Device.ino) bằng Arduino IDE:

1. Cài bộ hỗ trợ bo mạch ESP32 và các thư viện `PubSubClient`, `DHT sensor library` cùng thư viện phụ thuộc.
2. Sửa thông tin Wi-Fi và MQTT trong mã để khớp với kết nối của bạn.
3. Chọn đúng bo mạch, cổng kết nối rồi nạp chương trình.
4. Mở Serial Monitor để kiểm tra kết nối và dữ liệu cảm biến.

Các chân đang dùng trong mã:

| Thiết bị | Chân ESP32 |
| --- | --- |
| DHT11 | GPIO 21 |
| Cảm biến ánh sáng, ngõ ra DO | GPIO 4 |
| LED 1, LED 2, LED 3 | GPIO 23, 22, 18 |

ESP32 đọc cảm biến mỗi 2 giây. Giá trị ánh sáng hiện là `0` hoặc `100` từ ngõ ra số DO.

### Chủ đề MQTT

| Chủ đề | Mục đích |
| --- | --- |
| `esp32/iot/data` | ESP32 gửi dữ liệu cảm biến |
| `esp32/iot/control` | Máy chủ gửi lệnh điều khiển LED |
| `esp32/iot/action-history` | ESP32 gửi trạng thái bật, tắt LED |

Ví dụ lệnh điều khiển: `led1:on`, `led1:off`, `all:on`, `all:off`.

## Cấu trúc thư mục

```text
IoT_Project/
├── backend/                 # Máy chủ Flask, API và kết nối MongoDB/MQTT
│   ├── main.py              # Tệp khởi động
│   ├── app/                 # Xử lý API, dữ liệu và thiết bị
│   ├── .env.example         # Cấu hình mẫu
│   └── requirements.txt     # Thư viện Python
├── frontend/
│   ├── public/              # Các trang HTML
│   └── src/                 # JavaScript và CSS
├── hardware/IoT_Device/     # Chương trình ESP32
└── docs.pdf                 # Tài liệu dự án
```

## Lỗi thường gặp

- **Thiếu mô-đun `jwt`:** cài `PyJWT` bằng Python trong môi trường `.venv`.
- **Không kết nối được MongoDB:** kiểm tra chuỗi kết nối, tài khoản và quyền truy cập mạng.
- **Không có dữ liệu cảm biến:** kiểm tra nguồn ESP32, Wi-Fi, tài khoản MQTT và chủ đề gửi dữ liệu.
- **LED không phản hồi:** kiểm tra dây nối, kết nối MQTT và chủ đề điều khiển ở cả ESP32 lẫn máy chủ.
- **Giao diện không gọi được API:** chạy `main.py` và dùng cổng `5000`; nếu đổi cổng, cập nhật địa chỉ API trong `frontend/src/services/api.js` và `auth-service.js`.
