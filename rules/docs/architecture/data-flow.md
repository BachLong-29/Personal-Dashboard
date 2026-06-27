# Data Flow & State Management

---

## State Architecture

App chia state thành 3 tầng rõ ràng:

| Tầng           | Tool                 | Phạm vi                                 | Persist            |
| -------------- | -------------------- | --------------------------------------- | ------------------ |
| Server state   | React Query          | quests, habits, tasks, profile, penalty | Cache trong memory |
| UI state       | Zustand `ui.store`   | toasts, sidebar                         | Không              |
| Auth state     | Zustand `auth.store` | user session                            | localStorage       |
| Local UI state | `useState`           | modal, form, animation                  | Không              |

---

## React Query — Server State

### Query Keys Factory

```typescript
// src/constants/query-keys.ts
queryKeys.quests.list(dateFrom, dateTo); // ['quests', 'list', dateFrom, dateTo]
queryKeys.profile.me(); // ['profile', 'me']
queryKeys.penalty.active(); // ['penalty', 'active']
queryKeys.auth.me(); // ['auth', 'me']
```

### Pattern cho mỗi feature

```typescript
// 1. Query (read)
function useQuests(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: queryKeys.quests.list(dateFrom, dateTo),
    queryFn: () => apiClient.get('/quests').then((r) => r.data.data),
  });
}

// 2. Mutation (write) — auto invalidate sau khi thành công
function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/quests', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quests.all }),
  });
}
```

### Invalidation Strategy

- Sau `create` / `update` / `delete`: invalidate toàn bộ list của resource đó
- Sau `penalty/fail`: invalidate cả `penalty.active` + `profile.me` (vì XP/coins thay đổi)
- Sau `penalty/complete`: invalidate `penalty.active`

---

## Axios — HTTP Client

```typescript
// src/libs/axios/instance.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // /api/v1
  withCredentials: true, // gửi cookie theo mỗi request
});

// Request interceptor: thêm Authorization header
apiClient.interceptors.request.use((config) => {
  const token = getAccessTokenFromCookie();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: xử lý 401 → refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await refreshAccessToken(); // POST /api/v1/auth/refresh
      return apiClient(error.config); // retry original request
    }
    return Promise.reject(error);
  },
);
```

---

## Zustand Stores

### Auth Store (`auth.store.ts`)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
}
// Persisted: localStorage key 'auth-storage'
// Dùng để: check nhanh login state phía client (layout, topbar)
```

### UI Store (`ui.store.ts`)

```typescript
interface UIState {
  toasts: Toast[];
  isSidebarOpen: boolean;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
}
// Không persist — reset khi refresh trang
```

---

## Luồng dữ liệu hoàn chỉnh (Example: Complete Quest)

```
User click "Complete Quest"
  │
  ▼
handleToggleQuest(id, burstPos)                    [MainDashboard.tsx]
  │
  ▼
completeQuest(quest, burstPos)
  ├─ setQuests(newQuests)                          [local state update]
  ├─ awardProgress({ xp, coins, gems })
  │    ├─ setChar(nextChar)                        [local state]
  │    └─ syncToApi(patch)
  │         └─ PUT /api/v1/profile { xp, coins, level, ... }
  │              └─ UserProfileModel.findOneAndUpdate(...)
  ├─ setBurst(pos)                                 [animation trigger]
  └─ setToast({ xp, coins })                       [XP popup]
```

---

## Data Flow: Client → API → MongoDB

```
React Component
  └─ useQuery / useMutation (React Query)
       └─ apiClient.get/post/put/delete (Axios)
            └─ /api/v1/[resource]/route.ts
                 ├─ asyncHandler(...)           [try-catch wrapper]
                 ├─ getAuthUser(req)            [verify Bearer JWT]
                 ├─ validateBody(req, schema)   [Zod validation]
                 ├─ connectDB()                 [Mongoose singleton]
                 ├─ Model.find/create/update... [MongoDB query]
                 └─ successResponse(data)       [JSON response]
```

---

## Optimistic Updates

Hiện tại app **không dùng optimistic updates** — mọi mutation đều chờ server response trước khi update UI (thông qua `onSuccess` + `invalidateQueries`).

Ngoại lệ duy nhất: local `setQuests`, `setHabitDoneMap`, `setTaskDoneMap` được update ngay lập tức trong `MainDashboard` để đảm bảo UX nhanh, song song với API call thực sự.
