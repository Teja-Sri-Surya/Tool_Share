from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'tools', views.ToolViewSet)
router.register(r'feedback', views.FeedbackViewSet)
router.register(r'borrowrequests', views.BorrowRequestViewSet)
router.register(r'rentaltransactions', views.RentalTransactionViewSet)
router.register(r'availability', views.AvailabilityViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'user-reviews', views.UserReviewViewSet)
router.register(r'application-reviews', views.ApplicationReviewViewSet)
router.register(r'deposits', views.DepositViewSet)
router.register(r'deposit-transactions', views.DepositTransactionViewSet)
router.register(r'flexible-availability', views.FlexibleAvailabilityViewSet)
router.register(r'recurring-availability', views.RecurringAvailabilityViewSet)
router.register(r'hourly-availability', views.HourlyAvailabilityViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Basic endpoints
    path('test/', views.test_endpoint, name='test_endpoint'),
    path('default-user/', views.get_default_user, name='get_default_user'),
    path('current-user/', views.get_current_user, name='get_current_user'),
    path('user-tools/<int:user_id>/', views.get_user_tools, name='get_user_tools'),
    
    # Authentication
    path('login/', views.django_login, name='django_login'),
    path('signup/', views.django_signup, name='django_signup'),
    path('logout/', views.django_logout, name='django_logout'),
    path('me/', views.me, name='me'),
    
    # Mock data endpoints for PPT demo
    path('tools/', views.get_tools, name='get_tools'),
    path('rentals/', views.get_rentals, name='get_rentals'),
    path('deposits/', views.get_deposits, name='get_deposits'),
    
    # Availability System
    path('tools/<int:tool_id>/availability/', views.get_tool_availability, name='get_tool_availability'),
    path('tools/<int:tool_id>/advanced-availability/', views.get_tool_advanced_availability, name='get_tool_advanced_availability'),
    path('check-availability-conflict/', views.check_availability_conflict, name='check_availability_conflict'),
    path('tools/<int:tool_id>/check-hourly-availability/', views.check_hourly_availability, name='check_hourly_availability'),
    path('tools/<int:tool_id>/create-recurring-availability/', views.create_recurring_availability, name='create_recurring_availability'),
    
    # Location-Based Features
    path('tools/search-near-me/', views.search_tools_near_me, name='search_tools_near_me'),
    path('tools/near-location/', views.find_tools_near_location, name='find_tools_near_location'),
    
    # Trust & Safety
    path('users/<int:user_id>/verify/', views.verify_user_identity, name='verify_user_identity'),
    path('users/<int:user_id>/reviews/', views.get_user_reviews, name='get_user_reviews'),
    path('tools/<int:tool_id>/reviews/', views.get_tool_reviews, name='get_tool_reviews'),
    path('disputes/', views.list_disputes, name='list_disputes'),
    path('disputes/create/', views.create_dispute, name='create_dispute'),
    path('disputes/<int:dispute_id>/resolve/', views.resolve_dispute, name='resolve_dispute'),
    
    # Advanced Rental Features
    path('tools/<int:tool_id>/borrow-request/', views.create_borrow_request, name='create_borrow_request'),
    path('borrow-requests/<int:request_id>/approve/', views.approve_borrow_request, name='approve_borrow_request'),
    path('borrow-requests/<int:request_id>/reject/', views.reject_borrow_request, name='reject_borrow_request'),
    path('borrow-requests/<int:request_id>/cancel/', views.cancel_borrow_request, name='cancel_borrow_request'),
    path('borrow-requests/my-requests/', views.get_user_borrow_requests, name='get_user_borrow_requests'),
    
    # Deposit Management
    path('deposits/<int:deposit_id>/process-payment/', views.process_deposit_payment, name='process_deposit_payment'),
    path('deposits/<int:deposit_id>/process-return/', views.process_deposit_return, name='process_deposit_return'),
    path('deposits/<int:deposit_id>/process-forfeit/', views.process_deposit_forfeit, name='process_deposit_forfeit'),
    
    # Calendar and Advanced Features
    path('tools/<int:tool_id>/calendar-availability/', views.get_tool_calendar_availability, name='get_tool_calendar_availability'),
    path('check-advanced-availability-conflict/', views.check_advanced_availability_conflict, name='check_advanced_availability_conflict'),
]