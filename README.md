# QLNS — People Operations

Hệ thống quản lý nhân sự cho doanh nghiệp Việt Nam. Refactor theo clean architecture, luồng nghiệp vụ bám **Bộ luật Lao động 2019**, **BHXH 2024/2026** và **Luật TNCN 109/2025** (biểu 5 bậc, giảm trừ gia cảnh 2026).

Không gắn chatbot. Phần khác biệt nằm ở **phiếu lương Gross–Net đúng luật**, **tăng ca có trần**, **phép năm**, **maker/checker HR → Admin**.

## Chạy local

DB mặc định: **MongoDB Atlas** (`QLNS_DB`), URI trong `qlns-backend/.env` (`MONGODB_URI`). Local chỉ dùng khi không set biến đó.

Cấu hình nằm ở `config/{develop|staging|production}/app.yaml`. Chọn môi trường bằng `APP_ENV`.

```bash
# API
cd qlns-backend
copy .env.example .env   # APP_ENV=develop
npm install
npm test
npm run seed
npm start                # http://localhost:5000

# Web (terminal khác)
cd REACT/my-app
npm install
npm start                # http://localhost:3000  (proxy /api → :5000)
```

### Tài khoản demo (mật khẩu chung `Demo@12345`)

| User | Vai trò |
|---|---|
| `admin` | Giám đốc — duyệt thao tác nhạy cảm |
| `hr` | Nhân sự — tạo NV / HĐ / bổ nhiệm (chờ Admin) |
| `finance` | Tài chính — bảng lương, chốt phiếu |
| `an.pham` | Nhân viên chính thức |
| `linh.do` | Thử việc (HĐ thử việc riêng, **không đóng BHXH**) |

## Kiến trúc

```
config/
  develop/app.yaml
  staging/app.yaml
  production/app.yaml
qlns-backend/src
  config/          load YAML theo APP_ENV, env, constants
  middleware/      JWT (verify + load user từ DB), RBAC, lỗi
  models/          1 User duy nhất + domain models
  modules/         auth, employees, attendance, payroll, leave,
                   overtime, contracts, workforce, approvals, org, tasks
  utils/payroll.js công thức BHXH / TNCN / OT / phạt muộn (có unit test)
REACT/my-app/src
  api/client.js    axios + token
  auth/            session thật, không tin localStorage.role
  layouts/         sidebar theo role
  pages/           màn hình nghiệp vụ
```

API không còn nhồi hết vào `/api/auth`. Ví dụ: `POST /api/attendance/check-in`, `GET /api/payroll/me`.

## Nghiệp vụ đã chỉnh so với bản cũ

| Trước | Nay (thực tế VN) |
|---|---|
| Ai cũng `POST /register` thành **Admin** | Không public register. Admin đầu tiên: seed hoặc `POST /api/auth/bootstrap-admin` |
| Hai collection `User` + `User2` | Một model `User`, mã NV `NV0001` |
| Nhân viên tự xin bổ nhiệm | HR/Admin ra quyết định; NV chỉ xem / nộp nghỉ việc |
| Lương = giờ công − phạt muộn | Gross → BHXH/BHYT/BHTN 10.5% NLĐ + 21.5% NSDLĐ → giảm trừ 15.5tr + 6.2tr/NPT → TNCN 5 bậc → Net. OT **miễn TNCN** |
| Không phép năm / tăng ca | Phép năm 12 + 1/5 năm thâm niên. OT 150/200/300%, trần 4h/ngày, 40h/tháng, 200h/năm |
| “Miễn nhiệm” lẫn sa thải | Điều chuyển vị trí ≠ nghỉ việc. Nghỉ việc kiểm tra **thời hạn báo trước** 45/30/3 ngày |
| JWT secret hardcode, verify ≠ sign | `JWT_SECRET` env, load user từ DB mỗi request, có thể khóa tài khoản |
| Câu hỏi bảo mật plaintext | Hash bcrypt; rate-limit login / reset |

Tham số đóng BH, thuế, ca làm, trần tăng ca, phép năm nằm tại `config/<env>/app.yaml`. Backend load YAML rồi map sang `src/config/constants.js`. Secret production dùng `${JWT_SECRET}` / `${MONGODB_URI}` — không ghi thẳng vào file.

## Phân quyền

- **Admin**: toàn hệ thống, duyệt approval
- **HR**: hồ sơ, HĐ, công, phép, OT, bổ nhiệm, điều chuyển — thao tác nhạy cảm thành **yêu cầu chờ duyệt**
- **Finance**: xem công, bảng lương, chốt phiếu
- **Employee**: chấm công 2 ca (08:00–12:00, 13:30–17:30), phép, OT, phiếu lương, HĐ, nghỉ việc, task

## Bảo mật đã xử lý

- Helmet, CORS theo origin, rate-limit
- Không trả `password` / `securityAnswers`
- IDOR: nhân viên không xem lương / HĐ người khác
- Token hết hạn 8h, không sliding refresh từ payload giả
