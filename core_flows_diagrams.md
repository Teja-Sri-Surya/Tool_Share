# Core Flows - Sequence Diagrams

This document illustrates the core user workflows in the EquiShare tool sharing platform using sequence diagrams.

## 1. Tool Rental Booking Flow

The tool rental booking flow allows users to browse available tools, select dates, and complete a rental transaction.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant D as Django API
    participant DB as Database

    U->>F: Browse tools page
    F->>D: GET /api/tools/
    D->>DB: Query available tools
    DB-->>D: Return tool list
    D-->>F: Return mock tool data
    F-->>U: Display available tools

    U->>F: Select tool for rental
    F->>D: GET /api/tools/{toolId}/
    D->>DB: Query tool details
    DB-->>D: Return tool data
    D-->>F: Return tool information
    F-->>U: Show tool details

    U->>F: Navigate to rental booking
    F->>D: GET /api/tools/{toolId}/availability/
    D->>DB: Query tool availability
    DB-->>D: Return availability data
    D-->>F: Return booked dates
    F-->>U: Display calendar with unavailable dates

    U->>F: Select rental dates
    F->>D: POST /api/check-availability-conflict/
    Note over F,D: Check for booking conflicts
    D->>DB: Query overlapping rentals
    DB-->>D: Return conflict status
    D-->>F: Return availability status
    F-->>U: Show availability confirmation

    U->>F: Accept rental agreement
    U->>F: Click "Confirm Booking"
    F->>D: POST /api/rentaltransactions/
    Note over F,D: Create rental transaction
    D->>DB: Insert rental record
    D->>DB: Update tool availability
    D->>DB: Create deposit record
    DB-->>D: Confirm transaction
    D-->>F: Return rental confirmation
    F-->>U: Redirect to confirmation page
```

## 2. Tool Listing Creation Flow

The tool listing creation flow allows tool owners to add their tools to the platform for rental.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant D as Django API
    participant DB as Database

    U->>F: Navigate to tools dashboard
    F->>D: GET /api/tools/
    D->>DB: Query user's tools
    DB-->>D: Return user tools
    D-->>F: Return tool list
    F-->>U: Display user's tools

    U->>F: Click "Add Tool" button
    F-->>U: Open add tool dialog

    U->>F: Fill tool details
    Note over U,F: Name, description, pricing type, rates, replacement value, image
    U->>F: Upload tool image
    F-->>U: Show image preview

    U->>F: Click "Add Tool"
    F->>D: POST /api/tools/
    Note over F,D: Create new tool listing
    D->>DB: Insert tool record
    D->>DB: Set owner relationship
    D->>DB: Create availability records
    DB-->>D: Confirm tool creation
    D-->>F: Return created tool data
    F-->>U: Show success message
    F-->>U: Close dialog and refresh list
```

## 3. Borrow Request Management Flow

The borrow request management flow handles the approval process for tool borrowing requests.

```mermaid
sequenceDiagram
    participant B as Borrower
    participant O as Owner
    participant F as Frontend
    participant D as Django API
    participant DB as Database

    B->>F: Submit borrow request
    F->>D: POST /api/borrow-requests/{toolId}/
    Note over F,D: Create borrow request
    D->>DB: Insert borrow request
    D->>DB: Set status to 'pending'
    DB-->>D: Confirm request creation
    D-->>F: Return request confirmation
    F-->>B: Show request submitted

    O->>F: Navigate to borrow requests
    F->>D: GET /api/borrow-requests/user/
    D->>DB: Query user's requests (as owner/borrower)
    DB-->>D: Return request list
    D-->>F: Return requests data
    F-->>O: Display pending requests

    O->>F: Click "Approve" or "Reject"
    F-->>O: Open response dialog

    alt Approve Request
        O->>F: Add optional message
        O->>F: Click "Approve Request"
        F->>D: POST /api/borrow-requests/{requestId}/approve/
        D->>DB: Update request status to 'approved'
        D->>DB: Create rental transaction
        D->>DB: Create deposit record
        D->>DB: Mark tool as unavailable
        DB-->>D: Confirm approval
        D-->>F: Return approval confirmation
        F-->>O: Show approval success
    else Reject Request
        O->>F: Add optional message
        O->>F: Click "Reject Request"
        F->>D: POST /api/borrow-requests/{requestId}/reject/
        D->>DB: Update request status to 'rejected'
        DB-->>D: Confirm rejection
        D-->>F: Return rejection confirmation
        F-->>O: Show rejection success
    end

    B->>F: Check request status
    F->>D: GET /api/borrow-requests/user/
    D->>DB: Query user's requests
    DB-->>D: Return updated request status
    D-->>F: Return status update
    F-->>B: Display updated status
```

## 4. Deposit Management Flow

The deposit management flow handles the security deposit process for tool rentals.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant D as Django API
    participant DB as Database

    Note over U,DB: Deposit Payment Process
    U->>F: Complete rental booking
    F->>D: POST /api/rentaltransactions/
    D->>DB: Create rental transaction
    D->>DB: Create deposit record (status: 'pending')
    DB-->>D: Confirm creation
    D-->>F: Return rental confirmation

    U->>F: Navigate to deposits page
    F->>D: GET /api/deposits/
    D->>DB: Query user deposits
    DB-->>D: Return deposit list
    D-->>F: Return deposits data
    F-->>U: Display deposit list

    U->>F: Process deposit payment
    F->>D: POST /api/deposits/{depositId}/process-payment/
    D->>DB: Update deposit status to 'paid'
    D->>DB: Create deposit transaction record
    D->>DB: Set payment date and reference
    DB-->>D: Confirm payment processing
    D-->>F: Return payment confirmation
    F-->>U: Show payment success

    Note over U,DB: Deposit Return Process
    U->>F: Return tool in good condition
    F->>D: POST /api/deposits/{depositId}/process-return/
    D->>DB: Update deposit status to 'refunded'
    D->>DB: Create refund transaction record
    D->>DB: Set return date and reference
    DB-->>D: Confirm refund processing
    D-->>F: Return refund confirmation
    F-->>U: Show refund success

    Note over U,DB: Deposit Forfeiture Process
    alt Tool Damaged/Lost
        U->>F: Report tool damage/loss
        F->>D: POST /api/deposits/{depositId}/process-forfeit/
        D->>DB: Update deposit status to 'forfeited'
        D->>DB: Create forfeiture transaction record
        D->>DB: Set forfeiture amount and reason
        DB-->>D: Confirm forfeiture processing
        D-->>F: Return forfeiture confirmation
        F-->>U: Show forfeiture notification
    end
```

## 5. User Authentication Flow

The user authentication flow handles user registration and login.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant D as Django API
    participant DB as Database

    Note over U,DB: User Registration
    U->>F: Navigate to signup page
    U->>F: Fill registration form
    Note over U,F: Full name, username, email, password
    U->>F: Click "Create Account"
    F->>D: POST /api/signup/
    D->>DB: Check if user exists
    DB-->>D: Return user existence status
    
    alt User doesn't exist
        D->>DB: Create new user profile
        D->>DB: Hash password and save
        DB-->>D: Confirm user creation
        D-->>F: Return success response
        F-->>U: Show account created message
        F-->>U: Redirect to login
    else User already exists
        D-->>F: Return error response
        F-->>U: Show error message
    end

    Note over U,DB: User Login
    U->>F: Navigate to login page
    U->>F: Enter email and password
    U->>F: Click "Sign In"
    F->>D: POST /api/login/
    D->>DB: Authenticate user credentials
    DB-->>D: Return authentication result
    
    alt Authentication successful
        D-->>F: Return user data
        F-->>U: Store user session
        F-->>U: Redirect to dashboard
    else Authentication failed
        D-->>F: Return error response
        F-->>U: Show error message
    end

    Note over U,DB: User Logout
    U->>F: Click logout button
    F->>D: POST /api/logout/
    D-->>F: Return logout confirmation
    F-->>U: Clear user session
    F-->>U: Redirect to home page
```

## Key System Components

### Frontend Components
- **React/Next.js**: Main frontend framework
- **UI Components**: Reusable components for forms, dialogs, tables
- **State Management**: Local state and context for user authentication
- **API Integration**: HTTP requests to Django backend

### Backend Components
- **Django REST Framework**: API framework
- **Models**: Database models for users, tools, rentals, deposits
- **Views**: API endpoints for CRUD operations
- **Serializers**: Data validation and transformation
- **MySQL Database**: Primary data storage

### Core Features
- **User Authentication**: Registration, login, logout
- **Tool Management**: Create, update, delete tool listings
- **Rental System**: Book tools, manage availability
- **Borrow Requests**: Request-approval workflow
- **Deposit Management**: Security deposit handling
- **Availability Tracking**: Real-time availability updates
- **Location Services**: Geographic tool search
- **Review System**: User and tool ratings

### Security Features
- **User Verification**: Identity verification system
- **Dispute Resolution**: Conflict management
- **Payment Security**: Secure deposit handling
- **Access Control**: User role-based permissions

This comprehensive flow documentation provides a clear understanding of how users interact with the EquiShare platform across the main use cases. 