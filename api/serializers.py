from rest_framework import serializers
from .models import UserProfile, Tool, Feedback, BorrowRequest, RentalTransaction, Availability, Message, UserReview, ApplicationReview, Deposit, DepositTransaction, FlexibleAvailability, RecurringAvailability, HourlyAvailability, UserVerification, Dispute, DisputeMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class ToolSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Tool
        fields = '__all__'
    
    def create(self, validated_data):
        # Get the owner ID from the context or request
        owner_id = self.context.get('owner_id')
        if owner_id:
            validated_data['owner_id'] = owner_id
        return super().create(validated_data)

class FeedbackSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewed_user = UserSerializer(read_only=True)
    
    class Meta:
        model = Feedback
        fields = '__all__'

class BorrowRequestSerializer(serializers.ModelSerializer):
    tool = ToolSerializer(read_only=True)
    borrower = UserSerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = BorrowRequest
        fields = '__all__'
    
    def create(self, validated_data):
        tool_id = self.context.get('tool_id')
        borrower_id = self.context.get('borrower_id')
        
        if tool_id:
            validated_data['tool_id'] = tool_id
        if borrower_id:
            validated_data['borrower_id'] = borrower_id
        
        return super().create(validated_data)

class RentalTransactionSerializer(serializers.ModelSerializer):
    tool = serializers.PrimaryKeyRelatedField(queryset=Tool.objects.all())
    borrower = serializers.PrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    owner = serializers.PrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    
    class Meta:
        model = RentalTransaction
        fields = '__all__'
    
    def create(self, validated_data):
        print(f"DEBUG: validated_data = {validated_data}")
        
        # Create the rental transaction
        rental = RentalTransaction.objects.create(**validated_data)
        
        # Temporarily disable automatic deposit creation due to database schema issues
        # Deposit.objects.create(
        #     rental_transaction=rental,
        #     amount=50.00,
        #     status='paid'
        # )
        
        return rental

class AvailabilitySerializer(serializers.ModelSerializer):
    tool = ToolSerializer(read_only=True)
    
    class Meta:
        model = Availability
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'

class UserReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewed_user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserReview
        fields = '__all__'

class ApplicationReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reviewer = UserSerializer(read_only=True)
    
    class Meta:
        model = ApplicationReview
        fields = '__all__'

class DepositSerializer(serializers.ModelSerializer):
    rental_transaction = RentalTransactionSerializer(read_only=True)
    
    class Meta:
        model = Deposit
        fields = '__all__'

class DepositTransactionSerializer(serializers.ModelSerializer):
    deposit = DepositSerializer(read_only=True)
    
    class Meta:
        model = DepositTransaction
        fields = '__all__'

class FlexibleAvailabilitySerializer(serializers.ModelSerializer):
    tool = ToolSerializer(read_only=True)
    
    class Meta:
        model = FlexibleAvailability
        fields = '__all__'

class RecurringAvailabilitySerializer(serializers.ModelSerializer):
    tool = ToolSerializer(read_only=True)
    
    class Meta:
        model = RecurringAvailability
        fields = '__all__'

class HourlyAvailabilitySerializer(serializers.ModelSerializer):
    tool = ToolSerializer(read_only=True)
    
    class Meta:
        model = HourlyAvailability
        fields = '__all__'

# New serializers for advanced features
class UserVerificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = UserVerification
        fields = '__all__'

class DisputeMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = DisputeMessage
        fields = '__all__'

class DisputeSerializer(serializers.ModelSerializer):
    rental_transaction = RentalTransactionSerializer(read_only=True)
    initiator = UserSerializer(read_only=True)
    resolved_by = UserSerializer(read_only=True)
    messages = DisputeMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Dispute
        fields = '__all__'

# Enhanced serializers with additional context
class ToolWithReviewsSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Tool
        fields = '__all__'
    
    def get_average_rating(self, obj):
        from django.db.models import Avg
        from .models import Feedback, RentalTransaction
        
        rentals = RentalTransaction.objects.filter(tool=obj)
        reviews = Feedback.objects.filter(rental_transaction__in=rentals)
        avg = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 2) if avg else 0.0
    
    def get_total_reviews(self, obj):
        from .models import Feedback, RentalTransaction
        
        rentals = RentalTransaction.objects.filter(tool=obj)
        reviews = Feedback.objects.filter(rental_transaction__in=rentals)
        return reviews.count()

class UserWithRatingSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = '__all__'
    
    def get_average_rating(self, obj):
        reviews = UserReview.objects.filter(reviewed_user=obj, is_public=True)
        avg = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 2) if avg else 0.0
    
    def get_total_reviews(self, obj):
        return UserReview.objects.filter(reviewed_user=obj, is_public=True).count()
    
    def get_verification_status(self, obj):
        latest_verification = UserVerification.objects.filter(user=obj).order_by('-submitted_at').first()
        return latest_verification.status if latest_verification else 'not_submitted'

class RentalTransactionWithDetailsSerializer(serializers.ModelSerializer):
    tool = ToolSerializer(read_only=True)
    borrower = UserSerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    deposit = DepositSerializer(read_only=True)
    has_disputes = serializers.SerializerMethodField()
    
    class Meta:
        model = RentalTransaction
        fields = '__all__'
    
    def get_has_disputes(self, obj):
        return Dispute.objects.filter(rental_transaction=obj).exists() 