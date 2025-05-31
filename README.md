# Insyd Notifications - Architecture Social Platform

A proof-of-concept notification system for the architecture community built with Next.js, designed for a bootstrapped startup with 100 DAUs in mind.

## Features

- **Social Platform**: Users can post blogs, share job opportunities, and follow each other
- **Real-time Notifications**: Activity notifications from followed users, followers, and organic content discovery
- **Multi-channel Delivery**: In-app notifications with email fallback
- **Optimized for Scale**: Efficient polling-based system perfect for 100 DAU startups

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Nodemailer
- **Deployment**: Vercel
- **Database Hosting**: Neon PostgreSQL

## Notification System

### Why Polling Over WebSockets/Redis?

For a startup with **100 DAUs**, we chose **polling over WebSockets and message queues** for several strategic reasons:

1. **Time Constraints**: Polling is faster to implement and debug
2. **Cost-Effective**: No additional infrastructure (Redis, WebSocket servers)
3. **Perfect Scale**: 100 users × 2 requests/minute = 200 requests/minute (easily manageable)
4. **Reliability**: HTTP requests are more reliable than persistent WebSocket connections
5. **Simplicity**: Easier to maintain, debug, and scale horizontally
6. **Battery Friendly**: Less resource intensive on mobile devices

**Performance Math:**
```
100 DAUs × 30-second polling = 12,000 requests/hour
This is ~0.1% of typical serverless function limits
```

**When to migrate to WebSockets:**
- 1,000+ concurrent users
- Sub-second notification requirements  
- Real-time chat features

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- SMTP email service (Gmail, etc.)

### 1. Clone the repository
```bash
git clone repo url
cd insyd-notifications
```

### 2. Install dependencies
```bash
npm i
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/insyd_notifications"

# Email Configuration (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"


### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push



### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

### Core Tables
- **Users**: User profiles and authentication
- **Blogs**: User blog posts
- **Jobs**: Job postings
- **Notifications**: All notification types
- **Follows**: User follow relationships
- **BlogLikes**: Blog interaction tracking
- **JobApplications**: Job application tracking

### Notification Types
- `follow`: New follower notifications
- `blog`: New blog post from followed users
- `job`: New job post from followed users  
- `like`: Blog like notifications
- `application`: Job application notifications

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration

### Blogs
- `GET /api/blogs` - Get all blogs
- `POST /api/blogs` - Create new blog
- `DELETE /api/blogs/[id]` - Delete blog
- `POST /api/blogs/[id]/like` - Like/unlike blog

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `DELETE /api/jobs/[id]` - Delete job
- `POST /api/jobs/[id]/apply` - Apply to job

### Social
- `POST /api/follow` - Follow/unfollow user
- `GET /api/users` - Get all users

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark notifications as read

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Hosting
- **Recommended**: Neon PostgreSQL (free tier suitable for 100 DAUs)
- **Alternative**: Supabase, PlanetScale, or Railway

## 📈 Performance Optimizations

### For 100 DAUs
- **Polling Interval**: 30 seconds (perfect balance of real-time feel vs efficiency)
- **Database Indexing**: Optimized queries on userId, createdAt
- **Email Batching**: Prevents spam with rate limiting
- **Efficient Queries**: Uses Prisma's include and select optimizations

In an ideal scenario i would have implemented websockets with message queues, but due to my time constraints and this implementation could easily handle 100 DAUs so i solved it with pooling every 30s 

### Monitoring
```bash
# Check database performance
npx prisma studio

# Monitor API responses
# Check Vercel function logs for performance metrics
```

## Testing

### Manual Testing Flow
1. Register with email
2. Create blogs and job posts
3. Follow other users
4. Like blogs and apply to jobs
5. Check notifications in sidebar
6. Verify email notifications

### Database Reset (Development)
```bash
# Reset all data
npx prisma migrate reset --force

# Regenerate client
npx prisma generate
```

## Future Enhancements

When scaling beyond 100 DAUs:

1. **WebSocket Integration**: For real-time notifications
2. **Message Queues**: Redis for notification processing
3. **Push Notifications**: Browser/mobile push notifications
4. **Notification Preferences**: User customizable notification settings
5. **Analytics**: Notification engagement tracking

## Architecture Decisions

### Why This Stack?
- **Next.js**: Full-stack React with excellent developer experience
- **Prisma**: Type-safe database access with great PostgreSQL support
- **Polling**: Optimal for small scale, simpler than WebSockets
- **Vercel**: Excellent Next.js hosting with generous free tier
- **PostgreSQL**: Robust relational database perfect for social platforms

### Scalability Path
```
100 DAUs (Current) → 1K DAUs → 10K DAUs → 100K+ DAUs
Polling → WebSockets → Message Queues → Microservices

According to my current knowledge and skills this is the exact path i think we should follow
```


---

**Built with ❤️ for the architecture community**
