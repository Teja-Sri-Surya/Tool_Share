# Authentication & Authorization Setup Guide

## Overview
This project implements a complete authentication and authorization system using:
- **Next.js 15** with App Router
- **JWT (JSON Web Tokens)** for stateless authentication
- **HTTP-only cookies** for secure token storage
- **Prisma** for database operations
- **bcrypt** for password hashing

## Features Implemented

### ✅ Authentication
- User registration with email/password
- User login with JWT token generation
- Secure password hashing with bcrypt
- HTTP-only cookie storage for tokens
- Automatic token verification

### ✅ Authorization
- Protected routes with middleware
- Route-level authentication checks
- Client-side authentication state management
- Automatic redirects for unauthenticated users

### ✅ Security
- JWT tokens with expiration (7 days)
- HTTP-only cookies (XSS protection)
- Password hashing with salt
- CSRF protection via same-site cookies
- Input validation and sanitization

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory with:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/toolshare"

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:9002

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 3. Start the Application
```bash
# Start Next.js development server
npm run dev
```

## API Endpoints

### Authentication Endpoints
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth/me` - Get current user

### Request/Response Examples

#### Signup
```json
POST /api/signup
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}

Response: 201
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```json
POST /api/login
{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Usage in Components

### Using the Authentication Hook
```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes
```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>This is a protected page</div>
    </ProtectedRoute>
  );
}
```

## Security Considerations

### JWT Token Security
- Tokens expire after 7 days
- Stored in HTTP-only cookies
- Server-side verification on each request
- Automatic token refresh (can be implemented)

### Password Security
- Passwords hashed with bcrypt (salt rounds: 12)
- Minimum 6 character requirement
- Input validation and sanitization

### Cookie Security
- HTTP-only flag prevents XSS attacks
- Secure flag in production
- Same-site lax for CSRF protection
- Automatic expiration

## Middleware Protection

The middleware automatically protects:
- `/dashboard/*` - Requires authentication
- `/login` - Redirects authenticated users to dashboard
- `/signup` - Redirects authenticated users to dashboard

## Error Handling

The system provides comprehensive error handling:
- Invalid credentials
- Duplicate email/username
- Missing required fields
- Server errors
- Network errors

## Testing the Authentication

1. **Register a new user** at `/signup`
2. **Login** at `/login`
3. **Access protected routes** at `/dashboard`
4. **Logout** using the logout button
5. **Verify protection** by trying to access `/dashboard` without authentication

## Troubleshooting

### Common Issues

1. **"JWT_SECRET not found"**
   - Ensure `.env` file exists with JWT_SECRET

2. **"Database connection failed"**
   - Check DATABASE_URL in `.env`
   - Ensure database is running
   - Run `npx prisma migrate dev`

3. **"Invalid token" errors**
   - Clear browser cookies
   - Check JWT_SECRET consistency
   - Verify token expiration

4. **CORS errors**
   - Ensure CORS settings in Django backend
   - Check allowed origins

## Production Deployment

### Security Checklist
- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure proper CORS origins
- [ ] Use environment-specific database URLs
- [ ] Enable rate limiting
- [ ] Set up proper logging

### Environment Variables for Production
```env
JWT_SECRET=your-production-jwt-secret
DATABASE_URL=your-production-database-url
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
```

## Additional Features to Implement

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Social login (Google, GitHub)
- [ ] Role-based access control
- [ ] Session management
- [ ] Rate limiting
- [ ] Audit logging