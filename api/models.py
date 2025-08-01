from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import datetime, timedelta
import math

class UserProfile(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=100, default='USA')
    is_owner = models.BooleanField(default=False)
    is_borrower = models.BooleanField(default=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    bio = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_rentals = models.IntegerField(default=0)  # Match the database column name
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Location fields for geographic features
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    location_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_user'  # Specify the correct table name

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def calculate_distance_to(self, lat, lng):
        """Calculate distance to another point using Haversine formula"""
        if not self.latitude or not self.longitude:
            return None
        
        try:
            lat1, lon1 = float(self.latitude), float(self.longitude)
            lat2, lon2 = float(lat), float(lng)
            
            # Haversine formula
            R = 3959  # Earth's radius in miles
            
            lat1_rad = math.radians(lat1)
            lat2_rad = math.radians(lat2)
            delta_lat = math.radians(lat2 - lat1)
            delta_lon = math.radians(lon2 - lon1)
            
            a = (math.sin(delta_lat / 2) ** 2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * 
                 math.sin(delta_lon / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance = R * c
            
            return distance
        except (ValueError, TypeError):
            return None

class UserVerification(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    VERIFICATION_TYPE_CHOICES = [
        ('id_card', 'ID Card'),
        ('passport', 'Passport'),
        ('drivers_license', 'Driver\'s License'),
        ('utility_bill', 'Utility Bill'),
        ('bank_statement', 'Bank Statement'),
    ]
    
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='verifications')
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPE_CHOICES)
    document_front = models.ImageField(upload_to='verification_docs/')
    document_back = models.ImageField(upload_to='verification_docs/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications_reviewed')
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.verification_type} ({self.status})"

class Dispute(models.Model):
    DISPUTE_STATUS_CHOICES = [
        ('open', 'Open'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    DISPUTE_TYPE_CHOICES = [
        ('damage', 'Tool Damage'),
        ('late_return', 'Late Return'),
        ('payment', 'Payment Issue'),
        ('communication', 'Communication Problem'),
        ('other', 'Other'),
    ]
    
    rental_transaction = models.ForeignKey('RentalTransaction', on_delete=models.CASCADE, related_name='disputes')
    initiator = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='disputes_initiated')
    dispute_type = models.CharField(max_length=20, choices=DISPUTE_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=DISPUTE_STATUS_CHOICES, default='open')
    evidence_files = models.JSONField(default=list, blank=True)  # List of file URLs
    resolution = models.TextField(blank=True)
    resolved_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='disputes_resolved')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Dispute #{self.id} - {self.title} ({self.status})"

class DisputeMessage(models.Model):
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    message = models.TextField()
    attachments = models.JSONField(default=list, blank=True)  # List of file URLs
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.username} in Dispute #{self.dispute.id}"

class Tool(models.Model):
    PRICING_TYPE_CHOICES = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='tool_images/', null=True, blank=True)
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES, default='daily')
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    price_per_day = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    price_per_week = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    price_per_month = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    replacement_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    available = models.BooleanField(default=True)
    owner = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='tools_owned')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Location fields for geographic features
    pickup_address = models.TextField(blank=True, default='')
    pickup_city = models.CharField(max_length=100, blank=True, default='')
    pickup_state = models.CharField(max_length=100, blank=True, default='')
    pickup_zip_code = models.CharField(max_length=10, blank=True, default='')
    pickup_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_available = models.BooleanField(default=False)
    delivery_radius = models.IntegerField(default=0)  # in miles
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    
    # Additional location fields
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    location_updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def get_price_for_duration(self, duration_hours):
        """Calculate price based on duration and pricing type"""
        if self.pricing_type == 'hourly':
            return self.price_per_hour * duration_hours
        elif self.pricing_type == 'daily':
            days = max(1, duration_hours / 24)
            return self.price_per_day * days
        elif self.pricing_type == 'weekly':
            weeks = max(1, duration_hours / (24 * 7))
            return self.price_per_week * weeks
        elif self.pricing_type == 'monthly':
            months = max(1, duration_hours / (24 * 30))
            return self.price_per_month * months
        return 0

    def calculate_distance_to(self, lat, lng):
        """Calculate distance to another point using Haversine formula"""
        if not self.latitude or not self.longitude:
            return None
        
        try:
            lat1, lon1 = float(self.latitude), float(self.longitude)
            lat2, lon2 = float(lat), float(lng)
            
            # Haversine formula
            R = 3959  # Earth's radius in miles
            
            lat1_rad = math.radians(lat1)
            lat2_rad = math.radians(lat2)
            delta_lat = math.radians(lat2 - lat1)
            delta_lon = math.radians(lon2 - lon1)
            
            a = (math.sin(delta_lat / 2) ** 2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * 
                 math.sin(delta_lon / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance = R * c
            
            return distance
        except (ValueError, TypeError):
            return None

class RentalTransaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('forfeited', 'Forfeited'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='rentals')
    borrower = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='rentals_as_borrower', null=True, blank=True)
    owner = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='rentals_as_owner', null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_reference = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    # Remove updated_at as it doesn't exist in the database
    
    def __str__(self):
        return f"Rental {self.id}: {self.tool.name} by {self.borrower.username if self.borrower else 'Unknown'}"

class Deposit(models.Model):
    DEPOSIT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
        ('forfeited', 'Forfeited'),
    ]
    
    rental_transaction = models.ForeignKey(RentalTransaction, on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=8, decimal_places=2, default=50.00)
    status = models.CharField(max_length=20, choices=DEPOSIT_STATUS_CHOICES, default='pending')
    payment_date = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True, default='')
    return_date = models.DateTimeField(null=True, blank=True)
    return_reference = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Deposit {self.id}: ${self.amount} for Rental {self.rental_transaction.id}"

class DepositTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('forfeit', 'Forfeit'),
    ]
    
    deposit = models.ForeignKey(Deposit, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    reference = models.CharField(max_length=100, default='')
    description = models.TextField(default='')
    processed_by = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type.title()} - {self.reference}"

class Feedback(models.Model):
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]
    
    rental_transaction = models.ForeignKey(RentalTransaction, on_delete=models.CASCADE, related_name='feedbacks', null=True, blank=True)
    reviewer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='feedbacks_given', null=True, blank=True)
    reviewed_user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='feedbacks_received', null=True, blank=True)
    rating = models.IntegerField(choices=RATING_CHOICES, default=3)
    comment = models.TextField(default='')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Feedback from {self.reviewer.username if self.reviewer else 'Unknown'} to {self.reviewed_user.username if self.reviewed_user else 'Unknown'}"

class BorrowRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='borrow_requests')
    borrower = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='borrow_requests_as_borrower', null=True, blank=True)
    owner = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='borrow_requests_as_owner', null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    owner_response = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Borrow Request {self.id}: {self.tool.name} by {self.borrower.username if self.borrower else 'Unknown'}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def approve(self, owner_response=''):
        """Approve the borrow request and create a rental transaction"""
        self.status = 'approved'
        self.owner_response = owner_response
        self.save()
        
        # Calculate total price
        days = (self.end_date - self.start_date).days + 1
        total_price = self.tool.get_price_for_duration(days * 24)
        
        # Create rental transaction
        rental = RentalTransaction.objects.create(
            tool=self.tool,
            borrower=self.borrower,
            owner=self.owner,
            start_date=self.start_date,
            end_date=self.end_date,
            start_time=self.start_time,
            end_time=self.end_time,
            total_price=total_price,
            status='active'
        )
        
        # Create deposit
        Deposit.objects.create(
            rental_transaction=rental,
            amount=50.00,
            status='paid'
        )
        
        # Mark tool as unavailable
        self.tool.available = False
        self.tool.save()
        
        return rental
    
    def reject(self, owner_response=''):
        """Reject the borrow request"""
        self.status = 'rejected'
        self.owner_response = owner_response
        self.save()
    
    def cancel(self):
        """Cancel the borrow request"""
        self.status = 'cancelled'
        self.save()

class Availability(models.Model):
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='availability_records')
    start_date = models.DateField()
    end_date = models.DateField()
    is_booked = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Availability for {self.tool.name}: {self.start_date} to {self.end_date}"

class FlexibleAvailability(models.Model):
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='flexible_availability')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Flexible Availability for {self.tool.name}"

class RecurringAvailability(models.Model):
    PATTERN_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='recurring_availability')
    pattern_type = models.CharField(max_length=20, choices=PATTERN_TYPE_CHOICES, default='weekly')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    days_of_week = models.JSONField(default=list)  # [0,1,2,3,4,5,6] for Monday-Sunday
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Recurring Availability for {self.tool.name}"

class HourlyAvailability(models.Model):
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='hourly_availability')
    date = models.DateField()
    hour = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(23)])
    is_available = models.BooleanField(default=True)
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['tool', 'date', 'hour']
    
    def __str__(self):
        return f"Hourly Availability for {self.tool.name} on {self.date} at {self.hour}:00"

class Message(models.Model):
    rental_transaction = models.ForeignKey(RentalTransaction, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(UserProfile, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.username if self.sender else 'Unknown'} in Rental {self.rental_transaction.id}"

class UserReview(models.Model):
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]
    
    reviewer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='reviews_given', null=True, blank=True)
    reviewed_user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='reviews_received', null=True, blank=True)
    rating = models.IntegerField(choices=RATING_CHOICES, default=3)
    comment = models.TextField(default='')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['reviewer', 'reviewed_user']
    
    def __str__(self):
        return f"Review from {self.reviewer.username if self.reviewer else 'Unknown'} to {self.reviewed_user.username if self.reviewed_user else 'Unknown'}"

class ApplicationReview(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='application_reviews')
    reviewer = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews_conducted')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Application Review for {self.user.username} by {self.reviewer.username if self.reviewer else 'System'}"
