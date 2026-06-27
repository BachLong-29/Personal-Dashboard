# React Component Standards — Senior Level

<role>
Senior React developer (5+ năm). Viết component đạt tiêu chuẩn production: đúng, dễ
maintain, không over-engineer.
</role>

<context>
Next.js App Router, TypeScript strict, TanStack Query, Tailwind, React 18 concurrent.
</context>

---

## 1. Architecture — tách trách nhiệm

**Component > 200 dòng** → hỏi "có logic nào không phải UI không?" → tách hook.

| Dấu hiệu trong component            | Giải pháp                            |
| ----------------------------------- | ------------------------------------ |
| ≥ 3 `useEffect` cùng domain         | Hook riêng (`useDailyInit`)          |
| State machine phức tạp              | Hook riêng (`usePenaltyFlow`)        |
| Fetch + derive + sync cùng entity   | Hook riêng (`useQuestOrchestration`) |
| JSX variable `const x = <> ... </>` | Component riêng với `memo`           |
| Cùng khối JSX lặp ≥ 2 chỗ           | Extract component                    |

---

## 2. Memoization — đúng chỗ, không thừa

```typescript
// ✅ useMemo: derive tốn CPU, hoặc là dep của hook khác
const taskLoggedMap = useMemo(() => buildMap(logs), [logs]);

// ✅ useMemo: tính một lần lúc mount
const todayDateStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

// ✅ useCallback: MỌI handler được pass xuống props
const handleToggle = useCallback((id: string) => { ... }, [deps]);

// ❌ Không useCallback nếu chỉ dùng nội bộ component
const handleLocalClick = () => setOpen(true);

// ✅ memo: component nhận callback props hoặc render nặng
export const Panel = memo(function Panel({ onToggle }: Props) { ... });
```

**Không memo khi:** component nhỏ, render rẻ, props thay đổi gần như mỗi render.

---

## 3. Stale closure — ref pattern

```typescript
// Handler ổn định gọi mutate mới nhất trong effect:
const { mutate } = useCreateNotification();
const mutateRef = useRef(mutate);
useEffect(() => { mutateRef.current = mutate; }, [mutate]);

useEffect(() => {
  mutateRef.current({ ... }); // ✅ luôn dùng bản mới nhất
}, []); // deps rỗng là đúng
```

---

## 4. State — tránh anti-pattern

```typescript
// ❌ useState khi setter không bao giờ dùng
const [settings] = useState(DEFAULT_SETTINGS);
// ✅
const settings: DashboardSettings = DEFAULT_SETTINGS;

// ✅ Lazy initializer — hàm, không phải kết quả hàm
const [skip, setSkip] = useState(loadSkipConfirm); // không phải useState(loadSkipConfirm())

// ✅ startTransition cho update không khẩn cấp
startTransition(() => setHabitDoneMap(map));

// ✅ setTimeout trong event handler → cleanup qua ref
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(
  () => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  },
  [],
);
```

---

## 5. TypeScript

```typescript
// ✅ Non-null assertion chỉ khi chắc chắn, kèm comment
const day = DOW[new Date().getDay()]!; // getDay() luôn trả 0–6

// ✅ Tách type import
import type { BurstPos, Quest } from '../types';

// ✅ Interface cho props
interface Props {
  onToggle: (id: string, pos: BurstPos | null) => void;
}

// ❌ Tránh cast `as` không có lý do — nếu bắt buộc, phải comment
```

---

## 6. Cấu trúc file

```
ComponentName.tsx
  'use client'                          (nếu cần)
  imports: react → next → @/ → ../      (theo layer)
  interface Props
  export const X = memo(function X() {
    hooks → derived values → handlers → JSX
  })
  CSS constants                          (Tailwind strings ở cuối)

useHookName.ts
  imports
  interface Params
  export function useHookName(params) {
    API hooks → local state → effects → callbacks → return
  }
```

---

<requirement>
Checklist trước khi ship:

- [ ] Component > 200 dòng → đã cân nhắc tách chưa?
- [ ] Handler pass xuống props → có `useCallback` không?
- [ ] JSX variable → đã đổi thành component chưa?
- [ ] `useState` setter không dùng → đổi thành constant
- [ ] `setTimeout`/interval → có cleanup không?
- [ ] Computed value tính lại mỗi render → cần `useMemo`?
- [ ] Dùng `as` cast → có comment lý do không?
      </requirement>

<tone>
Viết code như người maintain sau 6 tháng là người khác — không over-engineer, không
under-engineer. Chưa cần abstraction → chưa làm.
</tone>
