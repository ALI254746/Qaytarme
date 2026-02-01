# Backend Development Plan - Qaytarme

## 📋 Umumiy Maqsad
Telegram Mini App va Website uchun **bir xil ma'lumotlar bazasidan** foydalanish. Ikkala platforma ham bir xil API'dan ma'lumot olishi kerak.

---

## 🏗️ Tech Stack Tavsiyalari

### Backend Framework
**Tavsiya: Node.js + Express.js yoki Next.js API Routes**

**Variant 1: Next.js API Routes (Hozirgi loyiha bilan)**
- ✅ Bir loyihada frontend + backend
- ✅ TypeScript support
- ✅ Serverless deployment (Vercel)
- ❌ Complex backend logic uchun cheklangan

**Variant 2: Separate Backend (Tavsiya etiladi)**
- ✅ Scalability
- ✅ Microservices architecture
- ✅ Independent deployment
- ✅ Better separation of concerns

**Tech Stack:**
- **Runtime:** Node.js 20+
- **Framework:** Express.js yoki Fastify
- **Language:** TypeScript
- **Database:** PostgreSQL (relational) yoki MongoDB (NoSQL)
- **ORM/ODM:** Prisma (PostgreSQL) yoki Mongoose (MongoDB)
- **Authentication:** JWT + Telegram WebApp Auth
- **File Storage:** AWS S3, Cloudinary yoki local storage
- **Cache:** Redis (optional)
- **Validation:** Zod yoki Joi

---

## 🗄️ Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  language VARCHAR(10) DEFAULT 'uz',
  karma_points INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);
```

### 2. Posts Table (Elonlar)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Post ma'lumotlari
  type VARCHAR(10) NOT NULL CHECK (type IN ('lost', 'found')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  
  -- Location
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Time
  lost_found_date DATE,
  lost_found_time TIME,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'deleted')),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Auto-archive after 30 days
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_location ON posts(latitude, longitude);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_expires_at ON posts(expires_at);
```

### 3. Post Images Table
```sql
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);
```

### 4. Post Tags Table
```sql
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, tag)
);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag);
```

### 5. Matches Table (Mosliklar)
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  found_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Match score (AI/ML algorithm result)
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons JSONB, -- ["location", "category", "description"]
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved', 'rejected')),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(lost_post_id, found_post_id),
  FOREIGN KEY (lost_post_id) REFERENCES posts(id),
  FOREIGN KEY (found_post_id) REFERENCES posts(id)
);

CREATE INDEX idx_matches_lost_post ON matches(lost_post_id);
CREATE INDEX idx_matches_found_post ON matches(found_post_id);
CREATE INDEX idx_matches_score ON matches(match_score DESC);
CREATE INDEX idx_matches_status ON matches(status);
```

### 6. Favorites Table
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_post_id ON favorites(post_id);
```

### 7. Reports Table (Shikoyatlar)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### 8. Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'match', 'message', 'favorite', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB, -- Additional data
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 🔐 Authentication System

### Telegram Mini App Authentication
```typescript
// Telegram WebApp Auth Flow
interface TelegramAuth {
  id: number; // Telegram user ID
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string; // Verification hash
}

// Backend verification
async function verifyTelegramAuth(authData: TelegramAuth): Promise<User> {
  // 1. Verify hash
  // 2. Check auth_date (not older than 24h)
  // 3. Find or create user
  // 4. Generate JWT token
  // 5. Return user + token
}
```

### Website Authentication
```typescript
// Traditional email/password or OAuth
interface WebsiteAuth {
  email: string;
  password: string; // Hashed
  // OR
  provider: 'google' | 'facebook';
  provider_id: string;
}
```

### Unified User System
- **Telegram users** va **Website users** bir xil `users` jadvalida
- `telegram_id` bo'lsa → Telegram user
- `email` bo'lsa → Website user
- Ikkalasi ham bo'lishi mumkin (linked accounts)

---

## 📡 API Endpoints

### Base URL
```
Production: https://api.qaytarme.uz
Development: http://localhost:3001
```

### Authentication Endpoints

#### POST `/api/auth/telegram`
Telegram Mini App authentication
```typescript
Request: {
  initData: string; // Telegram WebApp.initData
}

Response: {
  user: User;
  token: string; // JWT
}
```

#### POST `/api/auth/register` (Website)
Website user registration
```typescript
Request: {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}

Response: {
  user: User;
  token: string;
}
```

#### POST `/api/auth/login` (Website)
Website user login
```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  user: User;
  token: string;
}
```

### Posts Endpoints

#### GET `/api/posts`
Get all posts with filters
```typescript
Query params: {
  type?: 'lost' | 'found';
  category?: string;
  status?: 'active' | 'resolved' | 'archived';
  latitude?: number;
  longitude?: number;
  radius?: number; // km
  page?: number;
  limit?: number;
  sort?: 'newest' | 'closest' | 'relevance';
  search?: string;
}

Response: {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET `/api/posts/:id`
Get single post details
```typescript
Response: {
  post: Post;
  images: string[];
  tags: string[];
  user: User;
  matchCount: number;
}
```

#### POST `/api/posts`
Create new post
```typescript
Request: {
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location_name: string;
  latitude: number;
  longitude: number;
  lost_found_date: string; // ISO date
  lost_found_time?: string; // HH:mm
  tags: string[];
  images: File[]; // Multipart form data
}

Response: {
  post: Post;
  images: string[];
}
```

#### PUT `/api/posts/:id`
Update post
```typescript
Request: {
  title?: string;
  description?: string;
  status?: 'active' | 'resolved' | 'archived';
  // ... other fields
}

Response: {
  post: Post;
}
```

#### DELETE `/api/posts/:id`
Delete post (soft delete)
```typescript
Response: {
  success: boolean;
}
```

### Matches Endpoints

#### GET `/api/matches`
Get matches for user's posts
```typescript
Query params: {
  post_id?: string; // Filter by specific post
  min_score?: number; // Minimum match score
  status?: 'pending' | 'contacted' | 'resolved';
  page?: number;
  limit?: number;
}

Response: {
  matches: Match[];
  pagination: Pagination;
}
```

#### POST `/api/matches/:id/contact`
Mark match as contacted
```typescript
Response: {
  match: Match;
}
```

#### POST `/api/matches/:id/resolve`
Mark match as resolved
```typescript
Response: {
  match: Match;
  post: Post; // Updated post status
}
```

### User Endpoints

#### GET `/api/users/me`
Get current user profile
```typescript
Response: {
  user: User;
  stats: {
    posts_count: number;
    found_count: number;
    returned_count: number;
    karma_points: number;
  };
}
```

#### GET `/api/users/:id/posts`
Get user's posts
```typescript
Query params: {
  type?: 'lost' | 'found';
  status?: 'active' | 'resolved' | 'archived';
  page?: number;
  limit?: number;
}

Response: {
  posts: Post[];
  pagination: Pagination;
}
```

#### PUT `/api/users/me`
Update user profile
```typescript
Request: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  language?: 'uz' | 'ru' | 'en';
}

Response: {
  user: User;
}
```

### Favorites Endpoints

#### GET `/api/favorites`
Get user's favorite posts
```typescript
Response: {
  posts: Post[];
}
```

#### POST `/api/favorites/:postId`
Add post to favorites
```typescript
Response: {
  success: boolean;
}
```

#### DELETE `/api/favorites/:postId`
Remove from favorites
```typescript
Response: {
  success: boolean;
}
```

### Reports Endpoints

#### POST `/api/reports`
Report a post
```typescript
Request: {
  post_id: string;
  reason: string;
  description?: string;
}

Response: {
  report: Report;
}
```

### Notifications Endpoints

#### GET `/api/notifications`
Get user notifications
```typescript
Query params: {
  unread_only?: boolean;
  page?: number;
  limit?: number;
}

Response: {
  notifications: Notification[];
  pagination: Pagination;
}
```

#### PUT `/api/notifications/:id/read`
Mark notification as read
```typescript
Response: {
  notification: Notification;
}
```

#### PUT `/api/notifications/read-all`
Mark all as read
```typescript
Response: {
  success: boolean;
}
```

---

## 🔄 Integration Plan

### Phase 1: Database Setup (1-2 kun)
1. ✅ Database schema yaratish
2. ✅ Migration files yaratish
3. ✅ Seed data (test data)
4. ✅ Indexes optimizatsiya

### Phase 2: Authentication (2-3 kun)
1. ✅ Telegram WebApp auth verification
2. ✅ JWT token generation
3. ✅ Website auth (email/password)
4. ✅ Middleware for protected routes

### Phase 3: Core APIs (5-7 kun)
1. ✅ Posts CRUD operations
2. ✅ Image upload handling
3. ✅ Location-based search
4. ✅ Matches algorithm (basic)
5. ✅ Favorites system

### Phase 4: Advanced Features (3-5 kun)
1. ✅ Notifications system
2. ✅ Reports system
3. ✅ User profiles
4. ✅ Statistics

### Phase 5: Integration (3-5 kun)
1. ✅ Frontend API integration
2. ✅ Error handling
3. ✅ Loading states
4. ✅ Testing

### Phase 6: Deployment (2-3 kun)
1. ✅ Production database setup
2. ✅ API deployment
3. ✅ Environment variables
4. ✅ Monitoring & logging

---

## 🛠️ Development Setup

### Backend Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── telegram.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── posts.controller.ts
│   │   ├── matches.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Post.model.ts
│   │   └── Match.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── posts.routes.ts
│   │   └── matches.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── posts.service.ts
│   │   ├── matches.service.ts
│   │   └── image.service.ts
│   ├── utils/
│   │   ├── telegram.verify.ts
│   │   ├── jwt.ts
│   │   └── distance.ts
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔒 Security Considerations

1. **Input Validation:** Zod yoki Joi bilan barcha input'larni validate qilish
2. **SQL Injection:** Prisma ORM ishlatish (automatic protection)
3. **XSS:** Sanitize user input
4. **Rate Limiting:** Express-rate-limit
5. **CORS:** Telegram Mini App va Website domain'larini allow qilish
6. **File Upload:** File type va size validation
7. **Telegram Auth:** Hash verification

---

## 📊 Monitoring & Logging

1. **Error Tracking:** Sentry yoki similar
2. **API Monitoring:** Logging middleware
3. **Database Monitoring:** Query performance
4. **Uptime Monitoring:** Health check endpoint

---

## 🚀 Deployment Strategy

### Option 1: Vercel (Next.js API Routes)
- ✅ Easy deployment
- ✅ Serverless
- ❌ Database connection limits

### Option 2: Railway / Render
- ✅ Easy setup
- ✅ PostgreSQL included
- ✅ Good for MVP

### Option 3: AWS / DigitalOcean
- ✅ Full control
- ✅ Scalable
- ❌ More complex setup

---

## 📝 Next Steps

1. **Database choice:** PostgreSQL yoki MongoDB?
2. **Backend framework:** Separate backend yoki Next.js API Routes?
3. **Hosting:** Qayerda deploy qilamiz?
4. **Start development:** Phase 1 dan boshlash

---

## ❓ Savollar

1. Hozirgi website qanday tech stack ishlatmoqda?
2. Database qaysi birini tanlaymiz? (PostgreSQL/MongoDB)
3. Backend alohida yoki Next.js API Routes?
4. Image storage qayerda? (S3, Cloudinary, local)
5. Budget qancha? (Hosting, services)

---

**Yakuniy tavsiya:** 
- **PostgreSQL** + **Prisma** (type-safe, migration support)
- **Separate Express.js backend** (scalability uchun)
- **Railway yoki Render** (easy deployment, PostgreSQL included)
- **Cloudinary** (image storage, free tier bor)
