# ToolShare Key Workflows & Sequence Diagrams

## 1. Tool Booking Workflow

### Theoretical Sequence: "Book a Tool"

**Actors:** Borrower, Tool Owner, ToolShare System, Payment Gateway

**Preconditions:** 
- Borrower is authenticated and verified
- Tool is available for the requested dates
- Borrower has sufficient funds for deposit

**Main Flow:**

```mermaid
sequenceDiagram
    participant B as Borrower
    participant F as Frontend
    participant API as Backend API
    participant DB as Database
    participant O as Tool Owner
    participant PG as Payment Gateway
    participant N as Notification Service

    Note over B,N: Tool Discovery Phase
    B->>F: Search for available tools
    F->>API: GET /tools?location=lat,lng&radius=10&start_date=2024-01-15&end_date=2024-01-17
    API->>DB: Query available tools with location filtering
    DB-->>API: List of available tools within radius
    API-->>F: Filtered tool results with pricing
    F-->>B: Display available tools with map/list view

    Note over B,N: Tool Selection & Availability Check
    B->>F: Select tool and request booking
    F->>API: POST /check-availability-conflict {tool_id, start_date, end_date}
    API->>DB: Check for overlapping rentals/requests
    DB-->>API: No conflicts found
    API-->>F: Availability confirmed
    F-->>B: Show booking form with pricing

    Note over B,N: Booking Request Creation
    B->>F: Submit booking request with message
    F->>API: POST /create-borrow-request {tool_id, dates, message}
    API->>DB: Create borrow request record
    DB-->>API: Request created with pending status
    API->>N: Send notification to tool owner
    N-->>O: Email/SMS notification of new request
    API-->>F: Request submitted successfully
    F-->>B: Show confirmation with request ID

    Note over B,N: Owner Review & Approval
    O->>F: Login and view pending requests
    F->>API: GET /borrow-requests?owner_id=123&status=pending
    API->>DB: Query owner's pending requests
    DB-->>API: List of pending requests
    API-->>F: Pending requests data
    F-->>O: Display requests with borrower details
    O->>F: Approve request with optional message
    F->>API: POST /approve-borrow-request {request_id, response}
    API->>DB: Update request status to approved
    API->>DB: Create rental transaction record
    API->>DB: Create deposit record
    API->>N: Send approval notification to borrower
    N-->>B: Email/SMS notification of approval
    API-->>F: Request approved
    F-->>O: Show confirmation

    Note over B,N: Deposit Payment
    B->>F: View approved rental and pay deposit
    F->>API: GET /rentals/{rental_id}/deposit
    API->>DB: Get deposit details
    DB-->>API: Deposit amount and payment info
    API-->>F: Deposit payment form
    F-->>B: Display payment form
    B->>F: Submit payment details
    F->>PG: Process payment {amount, card_details}
    PG-->>F: Payment successful with reference
    F->>API: POST /process-deposit-payment {deposit_id, payment_reference}
    API->>DB: Update deposit status to paid
    API->>DB: Create deposit transaction record
    API->>N: Send payment confirmation
    N-->>B: Payment confirmation email
    N-->>O: Payment received notification
    API-->>F: Payment processed successfully
    F-->>B: Show rental confirmation with pickup details
```

**Alternative Flows:**
- **Owner Rejects Request**: Owner can reject with reason, system notifies borrower
- **Request Expires**: Automatic expiration after 24 hours if not responded to
- **Payment Fails**: Retry payment or cancel booking
- **Availability Conflict**: System prevents booking if conflicts detected

---

## 2. Deposit Management Workflow

### Theoretical Sequence: "Handle Deposit Lifecycle"

**Actors:** Borrower, Tool Owner, ToolShare System, Payment Gateway, Dispute Resolution Team

**Preconditions:**
- Rental transaction exists with paid deposit
- Tool has been picked up and used
- Rental period has ended

**Main Flow:**

```mermaid
sequenceDiagram
    participant B as Borrower
    participant O as Tool Owner
    participant F as Frontend
    participant API as Backend API
    participant DB as Database
    participant PG as Payment Gateway
    participant DR as Dispute Resolution
    participant N as Notification Service

    Note over B,N: Tool Return & Inspection
    B->>O: Return tool at agreed location/time
    O->>O: Inspect tool condition
    alt Tool in Good Condition
        O->>F: Mark tool as returned in good condition
        F->>API: POST /process-deposit-return {deposit_id, condition=good}
        API->>DB: Update deposit status to refunded
        API->>DB: Create refund transaction record
        API->>PG: Initiate refund to borrower
        PG-->>API: Refund processed successfully
        API->>N: Send refund confirmation
        N-->>B: Refund confirmation email
        API->>N: Send completion notification
        N-->>O: Rental completed notification
        API-->>F: Deposit refunded successfully
        F-->>O: Show completion confirmation
    else Tool Damaged/Missing
        O->>F: Report tool damage/missing
        F->>API: POST /process-deposit-forfeit {deposit_id, reason, evidence}
        API->>DB: Update deposit status to forfeited
        API->>DB: Create forfeit transaction record
        API->>N: Send forfeiture notification
        N-->>B: Deposit forfeited notification
        API->>DR: Create dispute case
        DR->>DR: Review evidence and case
        alt Dispute Resolved in Favor of Owner
            DR->>API: Confirm forfeiture
            API->>DB: Finalize forfeiture
            API->>N: Send final resolution
            N-->>B: Final forfeiture notice
            N-->>O: Forfeiture confirmed
        else Dispute Resolved in Favor of Borrower
            DR->>API: Reverse forfeiture
            API->>DB: Update deposit status to refunded
            API->>PG: Process partial/full refund
            PG-->>API: Refund processed
            API->>N: Send refund notification
            N-->>B: Refund processed notification
        end
    end

    Note over B,N: Post-Rental Review
    B->>F: Leave review for tool and owner
    F->>API: POST /create-feedback {rental_id, rating, comment}
    API->>DB: Create feedback record
    API->>DB: Update user ratings
    API->>N: Send review notification
    N-->>O: New review received
    O->>F: Leave review for borrower
    F->>API: POST /create-feedback {rental_id, rating, comment}
    API->>DB: Create feedback record
    API->>DB: Update borrower rating
    API->>N: Send review notification
    N-->>B: New review received
```

**Alternative Flows:**
- **Partial Damage**: Partial refund based on damage assessment
- **Late Return**: Additional fees or deposit forfeiture
- **Dispute Escalation**: Manual review by support team
- **Insurance Claim**: Third-party insurance processing

---

## 3. Dispute Resolution Workflow

### Theoretical Sequence: "Resolve Rental Dispute"

**Actors:** Dispute Initiator, Other Party, ToolShare Support, Dispute Resolution Team

**Preconditions:**
- Rental transaction exists
- Dispute has been initiated with evidence
- Both parties have been notified

**Main Flow:**

```mermaid
sequenceDiagram
    participant I as Dispute Initiator
    participant OP as Other Party
    participant F as Frontend
    participant API as Backend API
    participant DB as Database
    participant DR as Dispute Resolution
    participant N as Notification Service
    participant PG as Payment Gateway

    Note over I,N: Dispute Initiation
    I->>F: File dispute with evidence
    F->>API: POST /create-dispute {rental_id, type, title, description, evidence}
    API->>DB: Create dispute record
    API->>DB: Store evidence files
    API->>N: Send dispute notification
    N-->>OP: Dispute filed notification
    API->>DR: Assign dispute to resolution team
    API-->>F: Dispute created successfully
    F-->>I: Show dispute confirmation

    Note over I,N: Evidence Collection Phase
    OP->>F: View dispute details and respond
    F->>API: GET /disputes/{dispute_id}
    API->>DB: Get dispute and evidence
    DB-->>API: Dispute details with evidence
    API-->>F: Dispute information
    F-->>OP: Display dispute with evidence
    OP->>F: Submit counter-evidence
    F->>API: POST /disputes/{dispute_id}/evidence {files, description}
    API->>DB: Store additional evidence
    API->>N: Send evidence notification
    N-->>I: New evidence submitted
    API-->>F: Evidence submitted
    F-->>OP: Show confirmation

    Note over I,N: Resolution Process
    DR->>F: Review all evidence and case details
    F->>API: GET /disputes/{dispute_id}/full-details
    API->>DB: Get complete dispute information
    DB-->>API: Full dispute details with all evidence
    API-->>F: Complete case information
    F-->>DR: Display case for review
    DR->>DR: Analyze evidence and make decision
    DR->>F: Submit resolution decision
    F->>API: POST /resolve-dispute {dispute_id, resolution, outcome}
    API->>DB: Update dispute status to resolved
    API->>DB: Record resolution details
    API->>N: Send resolution notification
    N-->>I: Dispute resolved notification
    N-->>OP: Dispute resolved notification

    Note over I,N: Outcome Execution
    alt Resolution in Favor of Initiator
        API->>PG: Process refund/adjustment
        PG-->>API: Payment processed
        API->>DB: Update financial records
        API->>N: Send payment notification
        N-->>I: Payment processed notification
    else Resolution in Favor of Other Party
        API->>DB: Confirm original transaction
        API->>N: Send confirmation
        N-->>OP: Transaction confirmed
    else Split Resolution
        API->>PG: Process partial refunds
        PG-->>API: Payments processed
        API->>DB: Update financial records
        API->>N: Send payment notifications
        N-->>I: Partial refund notification
        N-->>OP: Partial payment notification
    end

    Note over I,N: Post-Resolution
    API->>DB: Update user trust scores
    API->>N: Send final resolution summary
    N-->>I: Final resolution summary
    N-->>OP: Final resolution summary
    API->>DR: Close dispute case
    DR->>DR: Archive case for future reference
```

**Alternative Flows:**
- **Mediation Required**: Escalation to human mediator
- **Legal Involvement**: External legal process initiation
- **Appeal Process**: Dispute resolution appeal
- **Settlement Agreement**: Mutual agreement between parties

---

## 4. Tool Listing Creation Workflow

### Theoretical Sequence: "Create Tool Listing"

**Actors:** Tool Owner, ToolShare System, Image Processing Service

**Preconditions:**
- User is authenticated and verified as owner
- User has completed identity verification
- User has agreed to terms of service

**Main Flow:**

```mermaid
sequenceDiagram
    participant O as Tool Owner
    participant F as Frontend
    participant API as Backend API
    participant DB as Database
    participant IPS as Image Processing Service
    participant N as Notification Service

    Note over O,N: Listing Creation
    O->>F: Start creating new tool listing
    F->>API: GET /tools/create-form
    API-->>F: Tool creation form with categories
    F-->>O: Display tool creation form
    O->>F: Fill tool details (name, description, category)
    O->>F: Upload tool images
    F->>IPS: Process and optimize images
    IPS-->>F: Optimized image URLs
    O->>F: Set pricing (hourly, daily, weekly, monthly)
    O->>F: Set pickup location and delivery options
    O->>F: Set availability schedule
    O->>F: Submit listing for review

    Note over O,N: Validation & Processing
    F->>API: POST /tools/create {tool_data, images, pricing, location}
    API->>API: Validate tool information
    API->>API: Geocode pickup location
    API->>DB: Create tool record
    API->>DB: Store image references
    API->>DB: Create availability records
    DB-->>API: Tool created successfully
    API->>N: Send listing confirmation
    N-->>O: Listing created notification
    API-->>F: Tool created successfully
    F-->>O: Show tool listing with ID

    Note over O,N: Availability Setup
    O->>F: Configure detailed availability
    F->>API: POST /tools/{tool_id}/availability {schedule_type, dates, times}
    API->>DB: Create availability records
    alt Recurring Schedule
        API->>DB: Create recurring availability pattern
    else Hourly Schedule
        API->>DB: Create hourly availability slots
    else Flexible Schedule
        API->>DB: Create flexible availability periods
    end
    DB-->>API: Availability configured
    API-->>F: Availability set successfully
    F-->>O: Show availability calendar

    Note over O,N: Listing Activation
    O->>F: Review and activate listing
    F->>API: GET /tools/{tool_id}/preview
    API->>DB: Get complete tool details
    DB-->>API: Tool information with availability
    API-->>F: Tool preview data
    F-->>O: Display tool preview
    O->>F: Activate listing
    F->>API: POST /tools/{tool_id}/activate
    API->>DB: Update tool status to available
    API->>N: Send activation notification
    N-->>O: Listing activated notification
    API-->>F: Tool activated successfully
    F-->>O: Show active listing dashboard
```

**Alternative Flows:**
- **Draft Saving**: Save incomplete listing for later completion
- **Listing Rejection**: System flags inappropriate content
- **Verification Required**: Additional verification for high-value tools
- **Category Review**: Manual review for new tool categories

---

## Key Workflow Characteristics

### **Security Measures:**
- **Authentication Required**: All workflows require user authentication
- **Authorization Checks**: Role-based access control for different actions
- **Data Validation**: Input validation at multiple layers
- **Audit Trails**: Complete transaction logging for all actions

### **Performance Optimizations:**
- **Caching**: Frequently accessed data cached for faster response
- **Async Processing**: Non-critical operations processed asynchronously
- **Database Indexing**: Optimized queries for common operations
- **CDN Integration**: Static assets served from content delivery networks

### **Error Handling:**
- **Graceful Degradation**: System continues operating despite component failures
- **Retry Mechanisms**: Automatic retry for transient failures
- **User Feedback**: Clear error messages and recovery suggestions
- **Fallback Options**: Alternative paths when primary operations fail

### **Scalability Considerations:**
- **Horizontal Scaling**: Stateless API design supports multiple instances
- **Database Sharding**: User data can be partitioned across multiple databases
- **Load Balancing**: Requests distributed across multiple servers
- **Microservices**: Different workflows can be handled by specialized services

These theoretical workflows provide the foundation for implementing robust, scalable, and user-friendly tool sharing functionality while maintaining security and performance standards. 