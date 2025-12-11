# Requirements Document - 收藏功能 (Favorites Feature)

## Introduction

本文档定义了 CDC 智汇中心小程序的收藏功能需求。收藏功能允许用户保存感兴趣的招聘、讲座和活动信息，方便后续快速查找和回顾。该功能是个人中心模块的核心基础，需要支持用户身份识别、收藏管理和数据持久化。

## Glossary

- **System**: CDC 智汇中心微信小程序
- **User**: 使用小程序的微信用户
- **OpenID**: 微信平台为每个用户在每个小程序中生成的唯一标识符
- **Event**: 系统中的活动、招聘或讲座信息条目
- **Favorite**: 用户收藏的 Event 记录
- **Supabase**: 系统使用的后端数据库服务
- **RLS**: Row Level Security，Supabase 的行级安全策略

## Requirements

### Requirement 1

**User Story:** 作为一个用户，我想要能够收藏感兴趣的活动信息，以便稍后快速找到这些信息。

#### Acceptance Criteria

1. WHEN a User views an Event card on the homepage, THE System SHALL display a heart icon button in the top-right corner of the card
2. WHEN a User taps the heart icon on an unfavorited Event, THE System SHALL add the Event to the User's favorites list and change the heart icon to filled state
3. WHEN a User taps the heart icon on a favorited Event, THE System SHALL remove the Event from the User's favorites list and change the heart icon to unfilled state
4. WHEN a User favorites an Event, THE System SHALL persist the favorite relationship to the Supabase database immediately
5. WHEN a User unfavorites an Event, THE System SHALL remove the favorite relationship from the Supabase database immediately

### Requirement 2

**User Story:** 作为一个用户，我想要系统能够自动识别我的身份，以便我的收藏数据能够跨设备同步，而不需要手动注册登录。

#### Acceptance Criteria

1. WHEN a User opens the System for the first time, THE System SHALL obtain the User's OpenID from WeChat platform silently without requiring explicit login
2. WHEN the System obtains a User's OpenID, THE System SHALL check if a user record exists in the users table
3. IF a user record does not exist for the OpenID, THEN THE System SHALL create a new user record with the OpenID and current timestamp
4. WHEN a user record exists for the OpenID, THE System SHALL update the last_seen timestamp to the current time
5. WHEN the OpenID retrieval fails, THE System SHALL display an error message and disable favorite functionality

### Requirement 3

**User Story:** 作为一个用户，我想要在首页看到哪些活动已经被我收藏过，以便避免重复收藏或快速识别感兴趣的内容。

#### Acceptance Criteria

1. WHEN the System loads the homepage Event list, THE System SHALL query the favorites table to determine which Events are favorited by the current User
2. WHEN an Event is in the User's favorites list, THE System SHALL display the heart icon in filled state
3. WHEN an Event is not in the User's favorites list, THE System SHALL display the heart icon in unfilled state
4. WHEN the favorites data is loading, THE System SHALL display the heart icon in a neutral state without blocking user interaction
5. WHEN the favorites query fails, THE System SHALL log the error and display all heart icons in unfilled state

### Requirement 4

**User Story:** 作为一个用户，我想要在个人中心查看我收藏的所有活动列表，以便集中管理和回顾我感兴趣的机会。

#### Acceptance Criteria

1. WHEN a User navigates to the Profile page, THE System SHALL display a "My Favorites" section
2. WHEN a User taps on "My Favorites", THE System SHALL navigate to a dedicated favorites list page
3. WHEN the favorites list page loads, THE System SHALL query and display all Events favorited by the current User ordered by favorite creation time descending
4. WHEN the favorites list is empty, THE System SHALL display a message "还没有收藏，去首页看看感兴趣的机会吧" with a link to the homepage
5. WHEN a User taps on a favorited Event in the list, THE System SHALL navigate to the Event detail page

### Requirement 5

**User Story:** 作为一个用户，我想要在收藏或取消收藏时得到明确的反馈，以便确认我的操作已经成功执行。

#### Acceptance Criteria

1. WHEN a User successfully favorites an Event, THE System SHALL display a success toast message "已收藏"
2. WHEN a User successfully unfavorites an Event, THE System SHALL display a success toast message "已取消收藏"
3. WHEN a favorite operation fails due to network error, THE System SHALL display an error toast message "收藏失败，请检查网络连接"
4. WHEN a favorite operation fails due to authentication error, THE System SHALL display an error toast message "请先登录"
5. WHEN a favorite operation is in progress, THE System SHALL disable the heart icon button to prevent duplicate requests

### Requirement 6

**User Story:** 作为系统管理员，我想要确保用户只能管理自己的收藏数据，以便保护用户隐私和数据安全。

#### Acceptance Criteria

1. WHEN the Supabase database is configured, THE System SHALL enable RLS policies on the users table
2. WHEN the Supabase database is configured, THE System SHALL enable RLS policies on the favorites table
3. WHEN a User queries favorites, THE System SHALL only return favorites where the user_id matches the authenticated User's OpenID
4. WHEN a User creates a favorite, THE System SHALL only allow creation if the user_id matches the authenticated User's OpenID
5. WHEN a User deletes a favorite, THE System SHALL only allow deletion if the user_id matches the authenticated User's OpenID

### Requirement 7

**User Story:** 作为一个开发者，我想要收藏功能能够处理边缘情况和错误状态，以便提供稳定可靠的用户体验。

#### Acceptance Criteria

1. WHEN a User attempts to favorite an Event that no longer exists, THE System SHALL display an error message "该活动已不存在"
2. WHEN a User attempts to favorite an Event that is already favorited, THE System SHALL treat it as idempotent and not create duplicate records
3. WHEN a User attempts to unfavorite an Event that is not favorited, THE System SHALL treat it as idempotent and not throw an error
4. WHEN the System detects a network timeout during favorite operation, THE System SHALL retry the operation once before showing error
5. WHEN the favorites list contains Events that have been deleted, THE System SHALL filter out those Events and display only valid ones
