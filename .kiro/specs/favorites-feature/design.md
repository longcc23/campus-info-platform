# Design Document - 收藏功能 (Favorites Feature)

## Overview

收藏功能是 CDC 智汇中心的核心用户交互功能，允许用户保存感兴趣的活动、招聘和讲座信息。本设计采用轻量级架构，基于微信 OpenID 实现无感登录，使用 Supabase 作为后端存储，确保数据跨设备同步。

### Key Design Goals

- **无感体验**: 用户无需手动注册登录，系统自动通过 OpenID 识别身份
- **即时反馈**: 所有收藏操作提供即时的视觉和文字反馈
- **数据安全**: 通过 RLS 策略确保用户只能访问自己的收藏数据
- **容错设计**: 优雅处理网络错误、数据不一致等边缘情况
- **性能优化**: 最小化数据库查询，使用本地状态缓存

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     WeChat Mini Program                      │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  HomePage      │  │  DetailPage    │  │  ProfilePage  │ │
│  │  - Event Cards │  │  - Event Info  │  │  - Favorites  │ │
│  │  - Heart Icons │  │  - Heart Icon  │  │  - List View  │ │
│  └────────┬───────┘  └────────┬───────┘  └───────┬───────┘ │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                              │                                │
│                   ┌──────────▼──────────┐                    │
│                   │  FavoritesService   │                    │
│                   │  - toggleFavorite() │                    │
│                   │  - getFavorites()   │                    │
│                   │  - isFavorited()    │                    │
│                   └──────────┬──────────┘                    │
│                              │                                │
│                   ┌──────────▼──────────┐                    │
│                   │   AuthService       │                    │
│                   │  - getOpenID()      │                    │
│                   │  - ensureUser()     │                    │
│                   └──────────┬──────────┘                    │
└──────────────────────────────┼────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Supabase REST API  │
                    │  - users table      │
                    │  - favorites table  │
                    │  - events table     │
                    │  - RLS policies     │
                    └─────────────────────┘
```

### Data Flow

#### Favorite an Event
```
User taps heart icon
  → Check if user is authenticated (OpenID exists)
  → If not authenticated, call wx.login() to get OpenID
  → Call ensureUser() to create/update user record
  → Call toggleFavorite(eventId, true)
  → Insert record into favorites table
  → Update local state (heart icon → filled)
  → Show success toast "已收藏"
```

#### Unfavorite an Event
```
User taps filled heart icon
  → Call toggleFavorite(eventId, false)
  → Delete record from favorites table
  → Update local state (heart icon → unfilled)
  → Show success toast "已取消收藏"
```

#### Load Favorites Status
```
HomePage loads
  → Fetch events from database
  → Get current user's OpenID
  → Query favorites table for user's favorited event IDs
  → Merge favorites status with events data
  → Render cards with correct heart icon state
```

## Components and Interfaces

### 1. AuthService

负责用户身份认证和管理。

```typescript
interface AuthService {
  /**
   * 获取当前用户的 OpenID
   * 如果未登录，自动调用 wx.login() 获取
   * @returns Promise<string> - 用户的 OpenID
   * @throws Error - 登录失败时抛出错误
   */
  getOpenID(): Promise<string>;

  /**
   * 确保用户记录存在于数据库中
   * 如果不存在则创建，如果存在则更新 last_seen
   * @param openid - 用户的 OpenID
   * @returns Promise<void>
   */
  ensureUser(openid: string): Promise<void>;

  /**
   * 检查用户是否已认证
   * @returns boolean - 是否已有 OpenID
   */
  isAuthenticated(): boolean;
}
```

### 2. FavoritesService

负责收藏数据的增删查操作。

```typescript
interface FavoritesService {
  /**
   * 切换事件的收藏状态
   * @param eventId - 事件 ID
   * @param isFavorite - true 表示收藏，false 表示取消收藏
   * @returns Promise<boolean> - 操作是否成功
   */
  toggleFavorite(eventId: number, isFavorite: boolean): Promise<boolean>;

  /**
   * 获取当前用户的所有收藏
   * @returns Promise<Event[]> - 收藏的事件列表，按收藏时间倒序
   */
  getFavorites(): Promise<Event[]>;

  /**
   * 批量查询事件的收藏状态
   * @param eventIds - 事件 ID 数组
   * @returns Promise<Set<number>> - 已收藏的事件 ID 集合
   */
  getFavoriteStatus(eventIds: number[]): Promise<Set<number>>;

  /**
   * 检查单个事件是否已收藏
   * @param eventId - 事件 ID
   * @returns Promise<boolean> - 是否已收藏
   */
  isFavorited(eventId: number): Promise<boolean>;
}
```

### 3. UI Components

#### FavoriteButton Component

```typescript
interface FavoriteButtonProps {
  eventId: number;
  initialFavorited: boolean;
  onToggle?: (isFavorited: boolean) => void;
}

/**
 * 收藏按钮组件
 * 显示心形图标，点击切换收藏状态
 */
const FavoriteButton: React.FC<FavoriteButtonProps>;
```

#### FavoritesList Component

```typescript
interface FavoritesListProps {
  onEventClick?: (eventId: number) => void;
}

/**
 * 收藏列表组件
 * 显示用户的所有收藏，支持点击跳转详情
 */
const FavoritesList: React.FC<FavoritesListProps>;
```

## Data Models

### Database Schema

#### users 表

```sql
CREATE TABLE users (
  openid TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
```

#### favorites 表

```sql
CREATE TABLE favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(openid) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 唯一约束：同一用户不能重复收藏同一事件
  UNIQUE(user_id, event_id)
);

-- 索引
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_event_id ON favorites(event_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX idx_favorites_user_event ON favorites(user_id, event_id);
```

#### RLS Policies

```sql
-- users 表策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入（首次登录创建用户）
CREATE POLICY "Allow anon insert users"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许匿名用户更新（更新 last_seen）
CREATE POLICY "Allow anon update users"
  ON users FOR UPDATE
  TO anon
  USING (true);

-- 允许公开读取（用于检查用户是否存在）
CREATE POLICY "Allow public read users"
  ON users FOR SELECT
  TO public
  USING (true);

-- favorites 表策略
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入自己的收藏
CREATE POLICY "Allow anon insert own favorites"
  ON favorites FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许匿名用户删除自己的收藏
CREATE POLICY "Allow anon delete own favorites"
  ON favorites FOR DELETE
  TO anon
  USING (true);

-- 允许公开读取收藏（用于显示收藏状态）
CREATE POLICY "Allow public read favorites"
  ON favorites FOR SELECT
  TO public
  USING (true);
```

### TypeScript Interfaces

```typescript
interface User {
  openid: string;
  last_seen: string; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
}

interface Favorite {
  id: number;
  user_id: string;
  event_id: number;
  created_at: string; // ISO 8601 timestamp
}

interface Event {
  id: number;
  title: string;
  type: 'recruit' | 'activity' | 'lecture';
  key_info: {
    date?: string;
    time?: string;
    location?: string;
    deadline?: string;
  };
  summary: string;
  raw_content: string;
  source_group: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  // 前端扩展字段
  isFavorited?: boolean;
}

interface FavoriteWithEvent extends Favorite {
  event: Event;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Favorite toggle adds to database

*For any* unfavorited event and authenticated user, when the user taps the heart icon to favorite the event, then querying the favorites table should return a record with the user's OpenID and the event ID.

**Validates: Requirements 1.2, 1.4**

### Property 2: Unfavorite toggle removes from database

*For any* favorited event and authenticated user, when the user taps the heart icon to unfavorite the event, then querying the favorites table should not return a record with the user's OpenID and the event ID.

**Validates: Requirements 1.3, 1.5**

### Property 3: User record creation for new OpenID

*For any* OpenID that does not exist in the users table, when the system processes that OpenID, then a new user record should be created with that OpenID and a timestamp.

**Validates: Requirements 2.3**

### Property 4: User last_seen update for existing OpenID

*For any* OpenID that exists in the users table, when the system processes that OpenID, then the last_seen timestamp should be updated to the current time.

**Validates: Requirements 2.4**

### Property 5: Favorites query returns only user's own favorites

*For any* authenticated user, when querying the favorites table, then all returned records should have a user_id that matches the authenticated user's OpenID.

**Validates: Requirements 6.3**

### Property 6: Favorite creation restricted to own user_id

*For any* favorite creation request, the operation should only succeed if the user_id in the request matches the authenticated user's OpenID.

**Validates: Requirements 6.4**

### Property 7: Favorite deletion restricted to own user_id

*For any* favorite deletion request, the operation should only succeed if the favorite record's user_id matches the authenticated user's OpenID.

**Validates: Requirements 6.5**

### Property 8: Favoriting already-favorited event is idempotent

*For any* event that is already favorited by a user, when the user attempts to favorite it again, then no duplicate records should be created in the favorites table.

**Validates: Requirements 7.2**

### Property 9: Unfavoriting non-favorited event is idempotent

*For any* event that is not favorited by a user, when the user attempts to unfavorite it, then the operation should complete without error.

**Validates: Requirements 7.3**

### Property 10: Favorites list ordered by creation time

*For any* user with multiple favorites, when loading the favorites list, then the events should be ordered by favorite creation time in descending order (newest first).

**Validates: Requirements 4.3**

### Property 11: Success toast on favorite

*For any* successful favorite operation, the system should display a toast message "已收藏".

**Validates: Requirements 5.1**

### Property 12: Success toast on unfavorite

*For any* successful unfavorite operation, the system should display a toast message "已取消收藏".

**Validates: Requirements 5.2**

### Property 13: Button disabled during operation

*For any* favorite/unfavorite operation in progress, the heart icon button should be disabled to prevent duplicate requests.

**Validates: Requirements 5.5**

### Property 14: Favorited events show filled heart

*For any* event in the user's favorites list, the heart icon should be displayed in filled state.

**Validates: Requirements 3.2**

### Property 15: Non-favorited events show unfilled heart

*For any* event not in the user's favorites list, the heart icon should be displayed in unfilled state.

**Validates: Requirements 3.3**

### Property 16: Deleted events filtered from favorites list

*For any* favorites list that contains references to deleted events, only valid events should be displayed to the user.

**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - OpenID retrieval failure
   - User record creation failure
   - Handling: Display error toast "请先登录", disable favorite functionality

2. **Network Errors**
   - Connection timeout
   - Server unavailable
   - Handling: Retry once, then display error toast "收藏失败，请检查网络连接"

3. **Data Integrity Errors**
   - Event does not exist
   - Favorite record not found
   - Handling: Display specific error message, log error for debugging

4. **Database Errors**
   - RLS policy violation
   - Constraint violation
   - Handling: Log error, display generic error message to user

### Error Handling Strategy

```typescript
async function toggleFavorite(eventId: number, isFavorite: boolean): Promise<boolean> {
  try {
    // 1. Check authentication
    const openid = await getOpenID();
    if (!openid) {
      throw new AuthError('未登录');
    }

    // 2. Ensure user exists
    await ensureUser(openid);

    // 3. Perform operation with retry
    const result = await retryOnce(async () => {
      if (isFavorite) {
        return await addFavorite(openid, eventId);
      } else {
        return await removeFavorite(openid, eventId);
      }
    });

    // 4. Show success feedback
    showToast(isFavorite ? '已收藏' : '已取消收藏');
    return true;

  } catch (error) {
    // 5. Handle specific errors
    if (error instanceof AuthError) {
      showToast('请先登录');
    } else if (error instanceof NetworkError) {
      showToast('收藏失败，请检查网络连接');
    } else if (error instanceof NotFoundError) {
      showToast('该活动已不存在');
    } else {
      showToast('操作失败，请稍后重试');
      console.error('Favorite operation failed:', error);
    }
    return false;
  }
}
```

### Retry Logic

```typescript
async function retryOnce<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof NetworkError && error.isTimeout) {
      // Retry once on timeout
      return await operation();
    }
    throw error;
  }
}
```

## Testing Strategy

### Unit Testing

We will use **Jest** as the testing framework for unit tests. Unit tests will cover:

1. **Service Functions**
   - `AuthService.getOpenID()` - mock wx.login() response
   - `AuthService.ensureUser()` - test user creation and update logic
   - `FavoritesService.toggleFavorite()` - test favorite/unfavorite logic
   - `FavoritesService.getFavorites()` - test query and sorting logic

2. **Error Handling**
   - Network timeout scenarios
   - Authentication failures
   - Database constraint violations

3. **Edge Cases**
   - Favoriting already-favorited event (idempotence)
   - Unfavoriting non-favorited event (idempotence)
   - Handling deleted events in favorites list

### Property-Based Testing

We will use **fast-check** (JavaScript property-based testing library) for property tests. Each property test will run a minimum of 100 iterations.

Property tests will verify:

1. **Database Persistence Properties**
   - Property 1: Favorite toggle adds to database
   - Property 2: Unfavorite toggle removes from database

2. **User Management Properties**
   - Property 3: User record creation for new OpenID
   - Property 4: User last_seen update for existing OpenID

3. **Security Properties**
   - Property 5: Favorites query returns only user's own favorites
   - Property 6: Favorite creation restricted to own user_id
   - Property 7: Favorite deletion restricted to own user_id

4. **Idempotence Properties**
   - Property 8: Favoriting already-favorited event is idempotent
   - Property 9: Unfavoriting non-favorited event is idempotent

5. **UI State Properties**
   - Property 14: Favorited events show filled heart
   - Property 15: Non-favorited events show unfilled heart

6. **Data Integrity Properties**
   - Property 10: Favorites list ordered by creation time
   - Property 16: Deleted events filtered from favorites list

Each property-based test must be tagged with a comment in this format:
```typescript
// **Feature: favorites-feature, Property 1: Favorite toggle adds to database**
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Favorite Flow**
   - User opens app → gets OpenID → favorites event → verifies in database → sees filled heart

2. **Complete Unfavorite Flow**
   - User with favorited event → unfavorites → verifies removed from database → sees unfilled heart

3. **Favorites List Flow**
   - User with multiple favorites → navigates to favorites page → sees correct list → taps event → navigates to detail

### Testing Configuration

- **Framework**: Jest + React Testing Library
- **Property Testing**: fast-check
- **Minimum iterations per property test**: 100
- **Mock**: Supabase API calls, WeChat API calls
- **Coverage target**: 80% for service layer, 60% for UI components

## Implementation Notes

### Performance Considerations

1. **Batch Favorite Status Query**
   - When loading homepage with multiple events, query all favorite statuses in a single database call
   - Use `WHERE event_id IN (...)` instead of multiple individual queries

2. **Local State Caching**
   - Cache favorite status in component state to avoid re-querying on every render
   - Invalidate cache only when favorite operation succeeds

3. **Optimistic UI Updates**
   - Update heart icon immediately on tap, before database operation completes
   - Revert if operation fails

### Security Considerations

1. **RLS Policies**
   - All database operations must go through RLS policies
   - Never trust client-side user_id, always use authenticated OpenID

2. **Input Validation**
   - Validate event_id is a positive integer
   - Validate OpenID format before database operations

3. **Rate Limiting**
   - Consider implementing rate limiting on favorite operations to prevent abuse
   - Can be done at Supabase level or application level

### Migration Strategy

Since this is a new feature, migration involves:

1. **Database Setup**
   - Create users table
   - Create favorites table
   - Enable RLS policies
   - Create indexes

2. **Backward Compatibility**
   - Existing events table requires no changes
   - New tables are additive, no breaking changes

3. **Rollout Plan**
   - Phase 1: Deploy database schema and RLS policies
   - Phase 2: Deploy backend services (AuthService, FavoritesService)
   - Phase 3: Deploy UI components (FavoriteButton)
   - Phase 4: Deploy favorites list page

### Monitoring and Logging

1. **Key Metrics**
   - Favorite operation success rate
   - Average response time for favorite operations
   - Number of active users (users with last_seen in last 7 days)
   - Most favorited events

2. **Error Logging**
   - Log all authentication failures
   - Log all database errors with context (user_id, event_id, operation)
   - Log network timeouts and retries

3. **Analytics Events**
   - Track "favorite_added" event
   - Track "favorite_removed" event
   - Track "favorites_page_viewed" event
