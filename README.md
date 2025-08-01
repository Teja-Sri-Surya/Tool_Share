# Setup & Usage Instructions

This guide provides step-by-step instructions to set up and run the EquiShare tool sharing platform locally.

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8+** (for Django backend)
- **Node.js 18+** (for React/Next.js frontend)
- **MySQL 8.0+** (database)
- **Git** (version control)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "New folder"
```

### 2. Backend Setup (Django)

#### Install Python Dependencies

```bash
# Create and activate virtual environment
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Database Configuration

1. **Create MySQL Database**
```sql
CREATE DATABASE equishare_db;
CREATE USER 'equishare_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON equishare_db.* TO 'equishare_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Configure Database Settings**
   
   Edit `toolshare_backend/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'equishare_db',
        'USER': 'equishare_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

#### Run Django Migrations

```bash
# Apply database migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

#### Start Django Development Server

```bash
# Run Django server on port 8000
python manage.py runserver
```

The Django API will be available at: `http://localhost:8000`

### 3. Frontend Setup (Next.js)

#### Install Node.js Dependencies

```bash
# Navigate to project root
cd "New folder"

# Install dependencies
npm install
```

#### Configure Environment Variables

Create `.env.local` file in the project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Start Next.js Development Server

```bash
# Run Next.js development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## Database Setup

### Initial Data Population

Run the provided management commands to populate the database with sample data:

```bash
# Create demo users
python manage.py create_demo_users

# Create test tools
python manage.py create_test_rentals

# Setup database objects
python manage.py setup_database_objects

# Apply database optimizations
python manage.py apply_database_optimizations
```

### Database Schema

The application uses the following key tables:
- `api_user` - User profiles and authentication
- `api_tool` - Tool listings and details
- `api_rentaltransaction` - Rental records
- `api_borrowrequest` - Borrow requests
- `api_deposit` - Security deposits
- `api_feedback` - User reviews and ratings

## Running the Application

### 1. Start Backend (Terminal 1)

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Start Django server
python manage.py runserver
```

### 2. Start Frontend (Terminal 2)

```bash
# Start Next.js development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

## API Endpoints

### Authentication
- `POST /api/signup/` - User registration
- `POST /api/login/` - User login
- `POST /api/logout/` - User logout

### Tools
- `GET /api/tools/` - List all tools
- `POST /api/tools/` - Create new tool
- `GET /api/tools/{id}/` - Get tool details
- `PUT /api/tools/{id}/` - Update tool

### Rentals
- `GET /api/rentaltransactions/` - List rentals
- `POST /api/rentaltransactions/` - Create rental
- `GET /api/rentaltransactions/{id}/` - Get rental details

### Borrow Requests
- `POST /api/borrow-requests/{toolId}/` - Create borrow request
- `POST /api/borrow-requests/{id}/approve/` - Approve request
- `POST /api/borrow-requests/{id}/reject/` - Reject request

### Availability
- `GET /api/tools/{id}/availability/` - Get tool availability
- `POST /api/check-availability-conflict/` - Check conflicts

## Development Workflow

### Making Changes

1. **Backend Changes**
   ```bash
   # Create new migration after model changes
   python manage.py makemigrations
   
   # Apply migrations
   python manage.py migrate
   
   # Test changes
   python manage.py test
   ```

2. **Frontend Changes**
   ```bash
   # The development server will auto-reload
   # Check for linting issues
   npm run lint
   
   # Build for production
   npm run build
   ```

### Database Management

```bash
# Reset database (WARNING: This will delete all data)
python manage.py flush

# Create new migration
python manage.py makemigrations api

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in settings.py
   - Ensure database exists

2. **Port Already in Use**
   ```bash
   # Kill process on port 8000 (Django)
   lsof -ti:8000 | xargs kill -9
   
   # Kill process on port 3000 (Next.js)
   lsof -ti:3000 | xargs kill -9
   ```

3. **Node Modules Issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Python Dependencies Issues**
   ```bash
   # Recreate virtual environment
   deactivate
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### Environment-Specific Setup

#### Windows
```bash
# Use Windows-specific commands
venv\Scripts\activate
python manage.py runserver
```

#### macOS/Linux
```bash
# Use Unix-specific commands
source venv/bin/activate
python manage.py runserver
```

## Production Deployment

### Environment Variables

Set the following environment variables for production:

```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=mysql://user:password@host:port/database
ALLOWED_HOSTS=your-domain.com
```

### Build Commands

```bash
# Frontend build
npm run build

# Django static files
python manage.py collectstatic
```

## Support

For additional help:
- Check the Django documentation: https://docs.djangoproject.com/
- Check the Next.js documentation: https://nextjs.org/docs
- Review the project's README.md for specific project details

## Quick Commands Reference

```bash
# Start both servers
python manage.py runserver & npm run dev

# Stop all servers
pkill -f "python manage.py runserver"
pkill -f "npm run dev"

# Reset everything
python manage.py flush
npm run build
```

The application should now be running locally with both frontend and backend servers active!.
