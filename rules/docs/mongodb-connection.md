# MongoDB Connection

## Overview

Project sử dụng **Mongoose** để kết nối với MongoDB. Connection được quản lý thông qua một singleton cache để tránh tạo nhiều kết nối trong môi trường development (hot-reload) và serverless.

---

## Environment Variable

Thêm biến sau vào file `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/personal-dashboard
```

Với MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

> `MONGODB_URI` được validate bởi Zod tại `src/configs/env.ts`. Server sẽ throw error khi khởi động nếu biến này thiếu hoặc không đúng format URL.

---

## Connection Singleton

**File:** [src/libs/mongodb/index.ts](../src/libs/mongodb/index.ts)

```ts
import mongoose from 'mongoose';

const cached = global._mongooseCache ?? { conn: null, promise: null };

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn; // trả về connection đã có
  cached.promise ??= mongoose.connect(uri, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Tại sao dùng singleton?

- **Next.js development**: Mỗi hot-reload sẽ re-execute module, không có singleton thì mỗi request tạo một connection mới → vượt quá connection pool giới hạn của MongoDB Atlas (512 connections trên free tier).
- **Serverless**: Mỗi Lambda/Edge function invocation có thể tạo connection mới. Cache trên `global` object giúp tái dùng connection trong cùng một cold start.
- `bufferCommands: false` đảm bảo Mongoose không buffer queries khi chưa connect, thay vào đó throw lỗi ngay — dễ debug hơn.

### Cách dùng trong API route

Gọi `connectDB()` ở đầu mỗi route handler trước khi tương tác với database:

```ts
import { connectDB } from '@/libs/mongodb';

export const GET = asyncHandler(async (req) => {
  await connectDB();
  const users = await UserModel.find();
  // ...
});
```

---

## User Model

**File:** [src/server/models/user.model.ts](../src/server/models/user.model.ts)

### Schema

| Field       | Type   | Required | Default  | Notes                         |
| ----------- | ------ | -------- | -------- | ----------------------------- |
| `email`     | String | Yes      | —        | Unique, lowercase, indexed    |
| `name`      | String | Yes      | —        | Trimmed                       |
| `password`  | String | Yes      | —        | Bcrypt hash (cost factor: 12) |
| `role`      | String | No       | `'user'` | Enum: admin, user, moderator  |
| `avatar`    | String | No       | —        | Optional URL                  |
| `createdAt` | Date   | Auto     | —        | Mongoose timestamps           |
| `updatedAt` | Date   | Auto     | —        | Mongoose timestamps           |

### Hot-reload guard

```ts
export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ?? mongoose.model<IUser>('User', userSchema);
```

Pattern `mongoose.models.User ?? mongoose.model(...)` ngăn Mongoose throw `OverwriteModelError` khi module bị re-compile trong development.

---

## Authentication Flow

### Register — `POST /api/v1/auth/register`

1. Validate request body (Zod)
2. `connectDB()`
3. Kiểm tra email trùng → 409 nếu đã tồn tại
4. Hash password với `bcrypt.hash(password, 12)`
5. `UserModel.create(...)` → lưu vào MongoDB
6. Trả về user object (không có `password`)

### Login — `POST /api/v1/auth/login`

1. Validate request body
2. `connectDB()`
3. `UserModel.findOne({ email })` → 401 nếu không tìm thấy
4. `bcrypt.compare(plainPassword, hashedPassword)` → 401 nếu sai
5. `signAccessToken({ sub, email, role })` → JWT expires trong `ACCESS_TOKEN_EXPIRY` (mặc định 15m)
6. `signRefreshToken({ sub })` → JWT expires trong `REFRESH_TOKEN_EXPIRY` (mặc định 7d)
7. Trả về `{ user, tokens }`

### Refresh — `POST /api/v1/auth/refresh`

1. Validate `refreshToken` trong body
2. `verifyRefreshToken(token)` → 401 nếu invalid/expired
3. `connectDB()` + `UserModel.findById(sub)` → 401 nếu user không tồn tại
4. Tạo cặp token mới và trả về

### Get Current User — `GET /api/v1/users/me`

1. Lấy token từ header `Authorization: Bearer <token>`
2. `verifyAccessToken(token)` → 401 nếu invalid
3. `connectDB()` + `UserModel.findById(sub).select('-password')`
4. Trả về user object

---

## JWT Utilities

**File:** [src/libs/jwt/index.ts](../src/libs/jwt/index.ts)

| Function             | Input                  | Output                |
| -------------------- | ---------------------- | --------------------- |
| `signAccessToken`    | `{ sub, email, role }` | JWT string            |
| `signRefreshToken`   | `{ sub }`              | JWT string            |
| `verifyAccessToken`  | JWT string             | `AccessTokenPayload`  |
| `verifyRefreshToken` | JWT string             | `RefreshTokenPayload` |

Cả hai loại token đều ký bằng `AUTH_SECRET`. `verifyAccessToken` / `verifyRefreshToken` sẽ throw `JsonWebTokenError` hoặc `TokenExpiredError` khi token không hợp lệ — cần wrap trong `try/catch`.

---

## Protected Routes

**File:** [src/app/[locale]/(protected)/layout.tsx](<../src/app/%5Blocale%5D/(protected)/layout.tsx>)

Layout đọc `access_token` từ cookie (key: `TOKEN_KEYS.ACCESS`), verify bằng `verifyAccessToken`, và redirect về `/login` nếu không hợp lệ.

```ts
const cookieStore = await cookies();
const token = cookieStore.get(TOKEN_KEYS.ACCESS)?.value;
const session = token ? verifyAccessToken(token) : null;
if (!session) redirect('/login');
```

---

## Local Development Setup

1. Cài MongoDB local hoặc dùng [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
2. Copy `.env.example` thành `.env.local` và điền `MONGODB_URI`
3. Chạy `npm run dev`

Kiểm tra kết nối: nếu console không có lỗi `MongoServerError` khi gọi API, connection thành công.
