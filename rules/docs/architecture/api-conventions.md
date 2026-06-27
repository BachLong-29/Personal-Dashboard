# API Conventions

Tất cả API routes nằm tại `src/app/api/v1/`. Mọi endpoint đều tuân theo các conventions sau.

---

## URL Structure

```
/api/v1/{resource}          GET (list), POST (create)
/api/v1/{resource}/{id}     GET (detail), PATCH (update), DELETE (delete)
/api/v1/{resource}/{action} POST (side-effect actions)
```

**Ví dụ:**

```
GET    /api/v1/quests
POST   /api/v1/quests
PATCH  /api/v1/quests/:id
DELETE /api/v1/quests/:id
POST   /api/v1/quests/rollover      ← action

GET    /api/v1/penalty
POST   /api/v1/penalty
POST   /api/v1/penalty/complete     ← action
POST   /api/v1/penalty/fail         ← action
```

---

## Response Format

Mọi response đều có cùng shape `ApiResponse<T>`:

```typescript
// Success
{
  success: true,
  message: "Operation successful",
  data: T,
  meta?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Error
{
  success: false,
  message: "Error description",
  errors?: Record<string, string[]>  // field-level validation errors
}
```

### Response Builders

```typescript
// src/server/response.ts
successResponse(data, message?, meta?, status?)  // 200
createdResponse(data, message?)                  // 201
noContentResponse()                              // 204
errorResponse(message, status?, errors?)         // 500 (hoặc status tuỳ chỉnh)
notFoundResponse(message?)                       // 404
unauthorizedResponse(message?)                   // 401
forbiddenResponse(message?)                      // 403
validationErrorResponse(errors)                  // 422
```

---

## Authentication

Mọi protected route phải gọi `getAuthUser(req)` đầu tiên:

```typescript
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  // user.sub = userId, user.email, user.role
  await connectDB();
  // ... business logic
});
```

Client gửi token qua header (tự động từ Axios interceptor):

```
Authorization: Bearer <access_token>
```

---

## Error Handling — asyncHandler

Mọi route handler được wrap bởi `asyncHandler`:

```typescript
// src/server/async-handler.ts
export function asyncHandler(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error(error);
      return errorResponse('Internal server error', 500);
    }
  };
}
```

---

## Request Validation — Zod

### Body validation (POST / PATCH)

```typescript
const schema = z.object({
  title: z.string().min(1).max(100),
  difficulty: z.enum(['S', 'A', 'B', 'C', 'D']),
});

const { data, error } = await validateBody(req, schema);
if (error) return error; // trả về 422 với field errors
```

### Query params validation (GET)

```typescript
const schema = z.object({
  date: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

const { data: params, error } = validateSearchParams(req.nextUrl.searchParams, schema);
if (error) return error;
```

---

## Route Template

```typescript
// src/app/api/v1/{resource}/route.ts
import type { NextRequest } from 'next/server';
import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { SomeModel } from '@/server/models/some.model';
import { asyncHandler, successResponse, unauthorizedResponse, createdResponse } from '@/server';

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const items = await SomeModel.find({ userId: user.sub });
  return successResponse(items);
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const body = await req.json();
  // validate với Zod nếu cần
  const item = await SomeModel.create({ userId: user.sub, ...body });
  return createdResponse(item);
});
```

---

## Common Patterns

### Pagination

```typescript
const page = Number(params.page ?? 1);
const limit = Number(params.limit ?? 20);
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  Model.find(query).skip(skip).limit(limit),
  Model.countDocuments(query),
]);

return successResponse(items, 'OK', {
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
```

### Soft Delete

Không xoá thật — set `active: false`:

```typescript
await Model.findOneAndUpdate({ _id: id, userId: user.sub }, { active: false });
```

### User-scoped Queries

Mọi query **luôn** filter theo `userId: user.sub` để tránh user A đọc data của user B:

```typescript
const item = await Model.findOne({ _id: id, userId: user.sub });
if (!item) return notFoundResponse();
```

---

## API Route Index

| Method       | Endpoint                   | Mô tả                               |
| ------------ | -------------------------- | ----------------------------------- |
| POST         | `/api/v1/auth/login`       | Đăng nhập                           |
| POST         | `/api/v1/auth/register`    | Đăng ký                             |
| POST         | `/api/v1/auth/refresh`     | Làm mới access token                |
| GET/PATCH    | `/api/v1/profile`          | Lấy / cập nhật hero profile         |
| GET          | `/api/v1/quests`           | Danh sách quests (filter theo ngày) |
| POST         | `/api/v1/quests`           | Tạo quest                           |
| PATCH/DELETE | `/api/v1/quests/:id`       | Cập nhật / xoá quest                |
| POST         | `/api/v1/quests/rollover`  | Chuyển quest chưa xong sang hôm nay |
| GET/POST     | `/api/v1/habits`           | Danh sách / tạo habit               |
| PATCH/DELETE | `/api/v1/habits/:id`       | Cập nhật / xoá habit                |
| GET/POST     | `/api/v1/habits/logs`      | Lấy / toggle habit log              |
| GET/POST     | `/api/v1/tasks`            | Danh sách / tạo task                |
| PATCH/DELETE | `/api/v1/tasks/:id`        | Cập nhật / xoá task                 |
| GET/POST     | `/api/v1/task-logs`        | Task session logs                   |
| GET/POST     | `/api/v1/rewards`          | Marketplace rewards                 |
| PATCH/DELETE | `/api/v1/rewards/:id`      | Cập nhật / xoá reward               |
| GET/POST     | `/api/v1/categories`       | Categories                          |
| GET          | `/api/v1/stats`            | Analytics data                      |
| GET          | `/api/v1/penalty`          | Penalty đang pending                |
| POST         | `/api/v1/penalty`          | Tạo penalty mới                     |
| POST         | `/api/v1/penalty/complete` | Hoàn thành penalty                  |
| POST         | `/api/v1/penalty/fail`     | Áp dụng hình phạt + tăng tier       |
| GET          | `/api/v1/health`           | Health check                        |
