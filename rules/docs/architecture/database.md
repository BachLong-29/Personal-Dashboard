# Database — MongoDB Models

Tất cả models nằm tại `src/server/models/`. App dùng **Mongoose 9** với singleton connection pattern.

---

## Entity Relationship

```
User (1) ──────────────────── (1) UserProfile
User (1) ──────────────────── (1) UserSetting
User (1) ──────────────────── (N) Quest
User (1) ──────────────────── (N) Habit
User (1) ──────────────────── (N) HabitLog ◄── (N) Habit
User (1) ──────────────────── (N) Task
User (1) ──────────────────── (N) TaskLog  ◄── (N) Task
User (1) ──────────────────── (N) Reward
User (1) ──────────────────── (N) Category
User (1) ──────────────────── (N) PenaltyLog
Task    ──── dependencies ──► (N) Task       [self-referential]
Task    ──── habitRef ──────► (1) Habit      [optional]
```

---

## Models

### User

```typescript
{
  email:    String  // unique, lowercase, indexed
  name:     String
  password: String  // bcrypt hash
  role:     'admin' | 'user' | 'moderator'  // default: 'user'
  avatar?:  String
}
```

---

### UserProfile

Lưu toàn bộ thông tin hero và game mechanics. 1:1 với User.

```typescript
{
  userId:       ObjectId  // FK → User, unique

  // Hero Identity
  heroName:     String    // max 40
  title:        String    // max 60, e.g. "The Relentless Wanderer"
  handle:       String    // max 24
  pronouns:     String    // default "they / them"
  region:       String    // max 40
  sigil:        String    // max 2, default "✦"
  motto:        String    // max 120

  // Class & Companion
  classId:      String    // 'scribe'|'ranger'|'artificer'|'warden'|'sage'|'forgeborn'
  companionId:  String    // 'fox'|'crane'|'wolf'|'owl'|'phoenix'
  accent:       String    // 'amber'|'aurora'|'teal'|'rose'|'jade'|'crimson'

  // Stats
  stats: {
    discipline:  Number   // 1-10, default 6
    wisdom:      Number   // 1-10, default 6
    endurance:   Number   // 1-10, default 5
    composition: Number   // 1-10, default 7
    serenity:    Number   // 1-10, default 6
  }
  statPool:     Number    // total points, default 30

  // Customization
  primaryFocus: String[]  // up to 4 focus areas
  badges:       String[]  // earned badge IDs

  // Game Progression
  level:    Number   // min 1, default 1
  xp:       Number   // current XP, min 0
  xpNext:   Number   // XP to next level, default 1000
  streak:   Number   // consecutive days, min 0
  coins:    Number   // soft currency
  gems:     Number   // premium currency
  rank:     String   // 'F'|'E'|'D'|'C'|'B'|'A'|'S'
  joined:   String
}
```

---

### UserSetting

Preferences và config. 1:1 với User.

```typescript
{
  userId: ObjectId; // FK → User, unique

  // Ritual
  morningRitual: Boolean; // default true
  nightlyReview: Boolean; // default true

  // Gameplay
  streakProtection: Number; // 0-3 free passes, default 1
  questDifficulty: 'gentle' | 'rising' | 'harsh'; // default 'rising'
  seasonalRites: Boolean; // default true
  autoReclaim: Boolean; // default false

  // Preferences
  language: String; // 'en'|'vi'|'th', default 'en'
  timezone: String; // default 'UTC'
  theme: 'dark' | 'light' | 'system'; // default 'dark'
  compactMode: Boolean; // default false
}
```

---

### Quest

Daily quest items. Nhiều quest cho một user.

```typescript
{
  userId:      ObjectId  // FK → User, indexed
  title:       String    // max 100
  desc:        String    // max 300, default "Complete this quest"
  type:        'focus'|'habit'|'reflect'|'admin'|'create'|'health'|'break'
  difficulty:  'S'|'A'|'B'|'C'|'D'
  xp:          Number    // computed từ difficulty: S=150, A=120, B=90, C=60, D=50
  coins:       Number    // computed: S=40, A=30, B=25, C=15, D=12
  done:        Boolean   // default false
  tags:        String[]  // default []
  dueDate:     Date      // required, dùng để query theo ngày
  completedAt: Date?     // set khi done=true
}

// Indexes:
// - { userId: 1, dueDate: 1 }  ← compound index, most-used query
```

---

### Habit

Recurring habit với lịch cụ thể.

```typescript
{
  userId:   ObjectId           // FK → User
  name:     String             // max 100
  schedule: [{                 // min 1 entry
    days: HabitDay[]           // ['mon','tue',...], min 1 day
    time: String               // "HH:MM" 24-hour
  }]
  duration: Number?            // phút, 1-1440
  note:     String?            // max 500
  tagId:    String             // category reference
  color:    'gold'|'mint'|'violet'|'cyan'|'rose'|'amber'|'blue'
  icon:     String             // emoji
  active:   Boolean            // default true (soft delete)
}

// Indexes:
// - { userId: 1, active: 1 }
```

---

### HabitLog

Track ngày hoàn thành habit.

```typescript
{
  userId:      ObjectId  // FK → User
  habitId:     ObjectId  // FK → Habit
  date:        Date      // ngày của log (startOfDay)
  done:        Boolean   // default false
  completedAt: Date?
}

// Unique index: { userId: 1, habitId: 1, date: 1 }
// → Đảm bảo chỉ 1 log per user per habit per day
```

---

### Task

Task với support single-day và multi-day.

```typescript
{
  userId:       ObjectId    // FK → User
  name:         String      // max 100
  note:         String?     // max 500
  tagId:        String
  color:        TaskColor   // cùng palette với Habit
  icon:         String
  status:       'todo'|'in_progress'|'pending'|'waiting'|'done'  // default 'todo'
  duration:     Number?     // estimated phút
  startDate:    Date        // required
  startTime:    String?     // "HH:MM", dùng khi reschedule habit
  endDate:      Date?       // nếu null → single-day task
  habitRef:     ObjectId?   // FK → Habit (khi task replace habit 1 ngày)
  dependencies: ObjectId[]  // task IDs phải xong trước
  active:       Boolean     // default true
}

// Indexes:
// - { userId: 1, startDate: 1 }
// - { userId: 1, active: 1 }
```

**Logic single-day vs multi-day:**

- Single-day: `!endDate` → done khi `status === 'done'`
- Multi-day: `endDate > startDate` → done mỗi ngày dựa trên TaskLog

---

### TaskLog

Log mỗi phiên làm việc của multi-day task.

```typescript
{
  userId: ObjectId  // FK → User
  taskId: ObjectId  // FK → Task
  date:   Date      // ngày của session
  note:   String?   // max 200
}

// Unique index: { userId: 1, taskId: 1, date: 1 }
```

---

### Reward

Item trong marketplace.

```typescript
{
  userId:      ObjectId   // FK → User (owner)
  name:        String     // max 100
  description: String?    // max 500
  icon:        String?    // emoji, max 10
  color:       RewardColor
  rarity:      'common'|'uncommon'|'rare'|'epic'|'legendary'  // default 'common'
  status:      'active'|'inactive'|'limited'|'sold_out'       // default 'active'
  coinCost:    Number?
  gemCost:     Number?
  unlockCondition?: {
    minLevel?: Number
    minRank?:  String
  }
  stock:       Number?    // undefined = unlimited
  active:      Boolean    // soft delete

  // Indexes: (userId, rarity), (userId, status), (userId, active)
}
```

---

### Category

User-defined tags cho quests/habits/tasks.

```typescript
{
  userId: ObjectId; // FK → User
  name: String; // max 50
}

// Unique index: { userId: 1, name: 1 }
```

---

### PenaltyLog

Trạng thái penalty đang active.

```typescript
{
  userId:        ObjectId  // FK → User
  tier:          Number    // 1-4, default 1
  status:        'pending' | 'completed'  // default 'pending'
  triggeredDate: Date      // khi penalty được tạo
  unfinished: [{           // snapshot các quest chưa xong
    id:         String
    title:      String
    difficulty: String
  }]
}

// Index: { userId: 1, status: 1 }
// Logic: chỉ 1 pending penalty per user tại một thời điểm
```

---

## MongoDB Connection

```typescript
// src/libs/mongodb/index.ts
// Singleton pattern — tránh tạo nhiều connections khi hot-reload dev
let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI!);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

Model registration dùng pattern:

```typescript
export const QuestModel =
  (mongoose.models.Quest as mongoose.Model<IQuest>) ?? mongoose.model<IQuest>('Quest', questSchema);
```

Tránh lỗi "Cannot overwrite model" khi hot-reload trong dev.
