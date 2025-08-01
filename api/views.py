from django.shortcuts import render
from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Q
from .models import UserProfile, Tool, Feedback, BorrowRequest, RentalTransaction, Availability, Message, UserReview, ApplicationReview, Deposit, DepositTransaction, FlexibleAvailability, RecurringAvailability, HourlyAvailability, UserVerification, Dispute, DisputeMessage
from django.db import models
from .serializers import UserSerializer, ToolSerializer, FeedbackSerializer, BorrowRequestSerializer, RentalTransactionSerializer, AvailabilitySerializer, MessageSerializer, UserReviewSerializer, ApplicationReviewSerializer, DepositSerializer, DepositTransactionSerializer, FlexibleAvailabilitySerializer, RecurringAvailabilitySerializer, HourlyAvailabilitySerializer, UserVerificationSerializer, DisputeSerializer, DisputeMessageSerializer
from django.utils import timezone

@api_view(['GET'])
def test_endpoint(request):
    """Simple test endpoint to verify server is working"""
    print('=== TEST ENDPOINT CALLED ===')
    return JsonResponse({'message': 'Django server is working!'})
from .serializers import UserSerializer, ToolSerializer, FeedbackSerializer, BorrowRequestSerializer, RentalTransactionSerializer, AvailabilitySerializer, MessageSerializer, UserReviewSerializer, ApplicationReviewSerializer, DepositSerializer, DepositTransactionSerializer, FlexibleAvailabilitySerializer, RecurringAvailabilitySerializer, HourlyAvailabilitySerializer
from django.utils import timezone

@api_view(['GET'])
def get_default_user(request):
    """Get or create a default user for rental transactions"""
    
    # First try to get an existing user
    try:
        user = UserProfile.objects.first()
        if user:
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email
            })
    except Exception as e:
        print(f"Error getting existing user: {e}")
    
    # If no valid user exists, create a new one
    try:
        # Create a new user
        user = UserProfile.objects.create_user(
            username='default_borrower',
            email='borrower@example.com',
            password='defaultpass123',
            first_name='Default',
            last_name='Borrower'
        )
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email
        })
    except Exception as e:
        print(f"Error creating default user: {e}")
        # Return a fallback response
        return Response({
            'id': 1,
            'username': 'default_borrower',
            'email': 'borrower@example.com'
        })

@api_view(['GET'])
def get_user_tools(request):
    """Get tools for the current user only"""
    user_id = request.GET.get('user_id')
    if not user_id:
        return Response({'error': 'user_id parameter is required'}, status=400)
    
    try:
        user = UserProfile.objects.get(id=user_id)
        tools = Tool.objects.filter(owner=user)
        serializer = ToolSerializer(tools, many=True)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

@api_view(['GET'])
def get_current_user(request):
    """Get current user information"""
    try:
        # For PPT demo - return mock user data
        mock_user = {
            'id': 1,
            'email': 'fjo25@txstate.edu',
            'fullName': 'Test User',
            'username': 'testuser',
        }
        return Response(mock_user)
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        return Response({'error': 'Internal server error'}, status=500)

@api_view(['GET'])
def me(request):
    """Get current user information (alternative endpoint)"""
    try:
        # For now, return the user with email ambatisurya08@gmail.com as default
        # In a real app, this would get the authenticated user from the session
        try:
            user = UserProfile.objects.get(email='ambatisurya08@gmail.com')
            mock_user = {
                'id': user.id,
                'email': user.email,
                'fullName': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username,
            }
        except UserProfile.DoesNotExist:
            # Fallback to test user
            mock_user = {
                'id': 1,
                'email': 'fjo25@txstate.edu',
                'fullName': 'Test User',
                'username': 'testuser',
            }
        
        return Response({'user': mock_user})
    except Exception as e:
        print(f"Error in me: {e}")
        return Response({'error': 'Internal server error'}, status=500)

@api_view(['GET'])
def get_tool_availability(request, tool_id):
    """Get availability data for a specific tool"""
    try:
        tool = Tool.objects.get(id=tool_id)
        
        # Get all active rentals for this tool
        active_rentals = RentalTransaction.objects.filter(
            tool=tool,
            status='active'
        ).values('start_date', 'end_date')
        
        # Get all approved borrow requests
        approved_requests = BorrowRequest.objects.filter(
            tool=tool,
            status='approved'
        ).values('start_date', 'end_date')
        
        # Get availability records
        availability_records = Availability.objects.filter(
            tool=tool
        ).values('start_date', 'end_date', 'is_booked')
        
        # Combine all booked dates
        booked_dates = []
        
        # Add rental dates
        for rental in active_rentals:
            booked_dates.append({
                'start_date': rental['start_date'],
                'end_date': rental['end_date'],
                'type': 'rental'
            })
        
        # Add approved request dates
        for request in approved_requests:
            booked_dates.append({
                'start_date': request['start_date'],
                'end_date': request['end_date'],
                'type': 'request'
            })
        
        # Add availability record dates
        for availability in availability_records:
            if availability['is_booked']:
                booked_dates.append({
                    'start_date': availability['start_date'],
                    'end_date': availability['end_date'],
                    'type': 'availability'
                })
        
        return Response({
            'tool_id': tool_id,
            'tool_name': tool.name,
            'is_available': tool.available,
            'booked_dates': booked_dates,
            'availability_records': availability_records
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def check_availability_conflict(request):
    """Check if a date range conflicts with existing bookings"""
    try:
        tool_id = request.data.get('tool_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not all([tool_id, start_date, end_date]):
            return Response({'error': 'Missing required fields'}, status=400)
        
        tool = Tool.objects.get(id=tool_id)
        
        # Check for overlapping active rentals
        overlapping_rentals = RentalTransaction.objects.filter(
            tool=tool,
            status='active',
            start_date__lt=end_date,
            end_date__gt=start_date
        )
        
        # Check for overlapping approved requests
        overlapping_requests = BorrowRequest.objects.filter(
            tool=tool,
            status='approved',
            start_date__lt=end_date,
            end_date__gt=start_date
        )
        
        has_conflict = overlapping_rentals.exists() or overlapping_requests.exists()
        
        return Response({
            'has_conflict': has_conflict,
            'conflicting_rentals': list(overlapping_rentals.values('start_date', 'end_date')),
            'conflicting_requests': list(overlapping_requests.values('start_date', 'end_date'))
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer

class ToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer

    def list(self, request, *args, **kwargs):
        """Return mock tool data for the frontend"""
        try:
            # For PPT demo - return mock data in the format frontend expects
            mock_tools = [
                {
                    'id': 1,
                    'name': 'Drill Set',
                    'description': 'Professional power drill with multiple attachments',
                    'image': 'https://placehold.co/300x200.png',
                    'price_per_day': '25.00',
                    'available': True,
                    'owner': {
                        'id': 1,
                        'username': 'tool_owner'
                    }
                },
                {
                    'id': 2,
                    'name': 'Lawn Mower',
                    'description': 'Gas-powered lawn mower for large yards',
                    'image': 'https://placehold.co/300x200.png',
                    'price_per_day': '35.00',
                    'available': True,
                    'owner': {
                        'id': 1,
                        'username': 'tool_owner'
                    }
                },
                {
                    'id': 3,
                    'name': 'Ladder',
                    'description': '10-foot aluminum extension ladder',
                    'image': 'https://placehold.co/300x200.png',
                    'price_per_day': '15.00',
                    'available': True,
                    'owner': {
                        'id': 1,
                        'username': 'tool_owner'
                    }
                }
            ]
            return Response(mock_tools)
        except Exception as e:
            print(f"Error in ToolViewSet.list: {e}")
            return Response({'error': 'Internal server error'}, status=500)

    def retrieve(self, request, *args, **kwargs):
        """Return mock tool data for a specific tool"""
        try:
            tool_id = kwargs.get('pk')
            mock_tool = {
                'id': tool_id,
                'name': 'Drill Set',
                'description': 'Professional power drill with multiple attachments',
                'image_url': 'https://placehold.co/300x200.png',
                'daily_rate': 25.00,
                'available': True,
                'owner_id': 1
            }
            return Response(mock_tool)
        except Exception as e:
            print(f"Error in ToolViewSet.retrieve: {e}")
            return Response({'error': 'Internal server error'}, status=500)

    def create(self, request, *args, **kwargs):
        print(f"ToolViewSet.create called with data: {request.data}")
        try:
            # Get the owner ID from the request data
            owner_id = request.data.get('owner')
            if not owner_id:
                return Response({'error': 'Owner ID is required'}, status=400)
            
            # Create tool directly without using serializer
            tool = Tool.objects.create(
                name=request.data.get('name'),
                description=request.data.get('description'),
                pricing_type=request.data.get('pricing_type', 'daily'),
                price_per_hour=request.data.get('price_per_hour'),
                price_per_day=request.data.get('price_per_day'),
                price_per_week=request.data.get('price_per_week'),
                price_per_month=request.data.get('price_per_month'),
                replacement_value=request.data.get('replacement_value'),
                available=request.data.get('available', True),
                owner_id=owner_id
            )
            
            # Return the created tool data
            tool_data = {
                'id': tool.id,
                'name': tool.name,
                'description': tool.description,
                'pricing_type': tool.pricing_type,
                'price_per_hour': str(tool.price_per_hour) if tool.price_per_hour else None,
                'price_per_day': str(tool.price_per_day) if tool.price_per_day else None,
                'price_per_week': str(tool.price_per_week) if tool.price_per_week else None,
                'price_per_month': str(tool.price_per_month) if tool.price_per_month else None,
                'replacement_value': str(tool.replacement_value) if tool.replacement_value else None,
                'available': tool.available,
                'owner': {
                    'id': tool.owner.id,
                    'username': tool.owner.username
                }
            }
            
            return Response(tool_data, status=201)
        except Exception as e:
            print(f"Error in ToolViewSet.create: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    def update(self, request, *args, **kwargs):
        print(f"ToolViewSet.update called with data: {request.data}")
        try:
            # Get the current tool instance
            tool = self.get_object()
            old_available = tool.available
            
            # Update the tool
            response = super().update(request, *args, **kwargs)
            
            # Check if availability changed
            if old_available != tool.available:
                print(f"Tool {tool.name} availability changed to {tool.available}")
            
            return response
        except Exception as e:
            print(f"Error in ToolViewSet.update: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def partial_update(self, request, *args, **kwargs):
        print(f"ToolViewSet.partial_update called with data: {request.data}")
        try:
            # Get the current tool instance
            tool = self.get_object()
            old_available = tool.available
            
            # Update the tool
            response = super().partial_update(request, *args, **kwargs)
            
            # Refresh the tool instance to get updated availability
            tool.refresh_from_db()
            
            # Check if availability changed
            if old_available != tool.available:
                print(f"Tool {tool.name} availability changed to {tool.available}")
                
                # Update availability records - mark the tool as available
                availability_records = Availability.objects.filter(
                    tool=tool,
                    start_date=tool.created_at.date(), # Assuming created_at is the date the tool was first listed
                    end_date=tool.created_at.date() + timezone.timedelta(days=365) # Mark for a year
                )
                for availability in availability_records:
                    availability.is_booked = False
                    availability.save()
                print(f"Updated {availability_records.count()} availability records for tool {tool.name}")
            
            return response
        except Exception as e:
            print(f"Error in ToolViewSet.partial_update: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

class UserReviewViewSet(viewsets.ModelViewSet):
    queryset = UserReview.objects.all()
    serializer_class = UserReviewSerializer

class ApplicationReviewViewSet(viewsets.ModelViewSet):
    queryset = ApplicationReview.objects.all()
    serializer_class = ApplicationReviewSerializer

class DepositViewSet(viewsets.ModelViewSet):
    queryset = Deposit.objects.all()
    serializer_class = DepositSerializer

class DepositTransactionViewSet(viewsets.ModelViewSet):
    queryset = DepositTransaction.objects.all()
    serializer_class = DepositTransactionSerializer

class FlexibleAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = FlexibleAvailability.objects.all()
    serializer_class = FlexibleAvailabilitySerializer

class RecurringAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = RecurringAvailability.objects.all()
    serializer_class = RecurringAvailabilitySerializer

class HourlyAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = HourlyAvailability.objects.all()
    serializer_class = HourlyAvailabilitySerializer

@api_view(['GET'])
def get_tool_advanced_availability(request, tool_id):
    """Get comprehensive availability data for a tool including flexible, recurring, and hourly"""
    try:
        tool = Tool.objects.get(id=tool_id)
        
        # Get flexible availability
        flexible_availability = FlexibleAvailability.objects.filter(tool=tool, is_available=True)
        
        # Get recurring availability
        recurring_availability = RecurringAvailability.objects.filter(tool=tool, is_active=True)
        
        # Get hourly availability for next 7 days
        from datetime import date, timedelta
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        hourly_availability = HourlyAvailability.objects.filter(
            tool=tool,
            date__range=[start_date, end_date],
            is_available=True,
            is_booked=False
        )
        
        # Get active rentals
        active_rentals = RentalTransaction.objects.filter(
            tool=tool,
            status='active'
        ).values('start_date', 'end_date', 'start_time', 'end_time')
        
        return Response({
            'tool_id': tool_id,
            'tool_name': tool.name,
            'pricing_type': tool.pricing_type,
            'flexible_availability': FlexibleAvailabilitySerializer(flexible_availability, many=True).data,
            'recurring_availability': RecurringAvailabilitySerializer(recurring_availability, many=True).data,
            'hourly_availability': HourlyAvailabilitySerializer(hourly_availability, many=True).data,
            'active_rentals': active_rentals
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def create_recurring_availability(request, tool_id):
    """Create a recurring availability pattern for a tool"""
    try:
        tool = Tool.objects.get(id=tool_id)
        
        # Create recurring availability
        recurring = RecurringAvailability.objects.create(
            tool=tool,
            pattern_type=request.data.get('pattern_type', 'weekly'),
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date'),
            days_of_week=request.data.get('days_of_week', []),
            start_time=request.data.get('start_time'),
            end_time=request.data.get('end_time'),
            is_active=True
        )
        
        # Generate hourly slots for the recurring pattern
        from datetime import date, timedelta, time
        import json
        
        start_date = date.fromisoformat(request.data.get('start_date'))
        end_date = date.fromisoformat(request.data.get('end_date')) if request.data.get('end_date') else start_date + timedelta(days=365)
        days_of_week = request.data.get('days_of_week', [])
        start_time = time.fromisoformat(request.data.get('start_time'))
        end_time = time.fromisoformat(request.data.get('end_time'))
        
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() in days_of_week:
                # Create hourly slots for this day
                current_hour = start_time.hour
                while current_hour < end_time.hour:
                    HourlyAvailability.objects.get_or_create(
                        tool=tool,
                        date=current_date,
                        hour=current_hour,
                        defaults={'is_available': True, 'is_booked': False}
                    )
                    current_hour += 1
            current_date += timedelta(days=1)
        
        return Response({
            'message': 'Recurring availability created successfully',
            'recurring_id': recurring.id
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def check_hourly_availability(request, tool_id):
    """Check hourly availability for a specific date range"""
    try:
        tool = Tool.objects.get(id=tool_id)
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        
        # Check for conflicts in hourly availability
        from datetime import datetime, time, date
        
        start_datetime = datetime.combine(
            date.fromisoformat(start_date),
            time.fromisoformat(start_time) if start_time else time.min
        )
        end_datetime = datetime.combine(
            date.fromisoformat(end_date),
            time.fromisoformat(end_time) if end_time else time.max
        )
        
        # Check hourly availability conflicts
        conflicting_hours = HourlyAvailability.objects.filter(
            tool=tool,
            date__range=[start_date, end_date],
            is_booked=True
        )
        
        # Check rental conflicts
        conflicting_rentals = RentalTransaction.objects.filter(
            tool=tool,
            status='active',
            start_date__lt=end_date,
            end_date__gt=start_date
        )
        
        has_conflict = conflicting_hours.exists() or conflicting_rentals.exists()
        
        return Response({
            'has_conflict': has_conflict,
            'conflicting_hours': list(conflicting_hours.values('date', 'hour')),
            'conflicting_rentals': list(conflicting_rentals.values('start_date', 'end_date', 'start_time', 'end_time'))
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Approval Workflow Views
@api_view(['POST'])
def create_borrow_request(request, tool_id):
    """Create a borrow request for a tool"""
    try:
        from django.contrib.auth.models import User as DjangoUser
        
        tool = Tool.objects.get(id=tool_id)
        # For now, use the first Django user as the borrower
        # In a real app, this would get the authenticated user
        borrower = DjangoUser.objects.first()
        
        # Check if user is trying to borrow their own tool
        if borrower.id == tool.owner.id:
            return Response({'error': 'You cannot borrow your own tool'}, status=400)
        
        # Check if tool is available
        if not tool.available:
            return Response({'error': 'Tool is not available for borrowing'}, status=400)
        
        # Create borrow request
        serializer = BorrowRequestSerializer(
            data=request.data,
            context={'tool_id': tool_id, 'borrower_id': borrower.id}
        )
        
        if serializer.is_valid():
            borrow_request = serializer.save()
            return Response({
                'message': 'Borrow request created successfully',
                'request_id': borrow_request.id,
                'status': borrow_request.status
            }, status=201)
        else:
            return Response(serializer.errors, status=400)
            
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def approve_borrow_request(request, request_id):
    """Approve a borrow request and create rental transaction"""
    try:
        borrow_request = BorrowRequest.objects.get(id=request_id)
        
        # Check if user is the owner of the tool
        if request.user.id != borrow_request.owner.id:
            return Response({'error': 'Only the tool owner can approve requests'}, status=403)
        
        # Check if request is still pending
        if borrow_request.status != 'pending':
            return Response({'error': 'Request is not pending'}, status=400)
        
        # Check if request has expired
        if borrow_request.is_expired():
            borrow_request.status = 'expired'
            borrow_request.save()
            return Response({'error': 'Request has expired'}, status=400)
        
        # Approve the request
        owner_response = request.data.get('owner_response', '')
        rental = borrow_request.approve(owner_response)
        
        return Response({
            'message': 'Borrow request approved successfully',
            'rental_id': rental.id,
            'status': 'approved'
        })
        
    except BorrowRequest.DoesNotExist:
        return Response({'error': 'Borrow request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def reject_borrow_request(request, request_id):
    """Reject a borrow request"""
    try:
        borrow_request = BorrowRequest.objects.get(id=request_id)
        
        # Check if user is the owner of the tool
        if request.user.id != borrow_request.owner.id:
            return Response({'error': 'Only the tool owner can reject requests'}, status=403)
        
        # Check if request is still pending
        if borrow_request.status != 'pending':
            return Response({'error': 'Request is not pending'}, status=400)
        
        # Reject the request
        owner_response = request.data.get('owner_response', '')
        borrow_request.reject(owner_response)
        
        return Response({
            'message': 'Borrow request rejected successfully',
            'status': 'rejected'
        })
        
    except BorrowRequest.DoesNotExist:
        return Response({'error': 'Borrow request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def cancel_borrow_request(request, request_id):
    """Cancel a borrow request (by borrower)"""
    try:
        borrow_request = BorrowRequest.objects.get(id=request_id)
        
        # Check if user is the borrower
        if request.user.id != borrow_request.borrower.id:
            return Response({'error': 'Only the borrower can cancel requests'}, status=403)
        
        # Check if request is still pending
        if borrow_request.status != 'pending':
            return Response({'error': 'Request is not pending'}, status=400)
        
        # Cancel the request
        borrow_request.cancel()
        
        return Response({
            'message': 'Borrow request cancelled successfully',
            'status': 'cancelled'
        })
        
    except BorrowRequest.DoesNotExist:
        return Response({'error': 'Borrow request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Location-based Views
@api_view(['GET'])
def search_tools_near_me(request):
    """Search for tools near the user's location"""
    try:
        user_lat = request.GET.get('lat')
        user_lng = request.GET.get('lng')
        radius = float(request.GET.get('radius', 10))  # Default 10 miles
        pricing_type = request.GET.get('pricing_type')
        
        if not user_lat or not user_lng:
            return Response({'error': 'User location required'}, status=400)
        
        # Get all available tools
        tools = Tool.objects.filter(available=True)
        
        # Filter by pricing type if specified
        if pricing_type:
            tools = tools.filter(pricing_type=pricing_type)
        
        # Calculate distances and filter by radius
        nearby_tools = []
        for tool in tools:
            if tool.pickup_latitude and tool.pickup_longitude:
                distance = tool.calculate_distance_to(user_lat, user_lng)
                if distance is not None and distance <= radius:
                    nearby_tools.append({
                        'tool': ToolSerializer(tool, context={'request': request}).data,
                        'distance': round(distance, 2)
                    })
        
        # Sort by distance
        nearby_tools.sort(key=lambda x: x['distance'])
        
        return Response({
            'tools': nearby_tools,
            'search_radius': radius,
            'user_location': {'lat': user_lat, 'lng': user_lng}
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_user_borrow_requests(request):
    """Get borrow requests for the current user (as borrower or owner)"""
    try:
        user = request.user
        
        # Get requests where user is borrower
        as_borrower = BorrowRequest.objects.filter(borrower=user).order_by('-created_at')
        
        # Get requests where user is owner
        as_owner = BorrowRequest.objects.filter(owner=user).order_by('-created_at')
        
        return Response({
            'as_borrower': BorrowRequestSerializer(as_borrower, many=True, context={'request': request}).data,
            'as_owner': BorrowRequestSerializer(as_owner, many=True, context={'request': request}).data
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def process_deposit_payment(request, deposit_id):
    """Process a deposit payment"""
    try:
        deposit = Deposit.objects.get(id=deposit_id)
        
        # Update deposit status to paid
        deposit.status = 'paid'
        deposit.payment_date = timezone.now()
        deposit.payment_reference = request.data.get('payment_reference', f'PAY-{deposit_id}-{int(timezone.now().timestamp())}')
        deposit.save()
        
        # Create transaction record
        DepositTransaction.objects.create(
            deposit=deposit,
            transaction_type='payment',
            amount=deposit.amount,
            reference=deposit.payment_reference,
            description='Deposit payment processed',
            processed_by=request.data.get('processed_by')
        )
        
        return Response({
            'message': 'Deposit payment processed successfully',
            'deposit_id': deposit.id,
            'amount': deposit.amount,
            'payment_reference': deposit.payment_reference
        })
        
    except Deposit.DoesNotExist:
        return Response({'error': 'Deposit not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def process_deposit_return(request, deposit_id):
    """Process a deposit return/refund"""
    try:
        deposit = Deposit.objects.get(id=deposit_id)
        
        # Update deposit status to returned
        deposit.status = 'returned'
        deposit.return_date = timezone.now()
        deposit.return_reference = request.data.get('return_reference', f'REF-{deposit_id}-{int(timezone.now().timestamp())}')
        deposit.save()
        
        # Create transaction record
        DepositTransaction.objects.create(
            deposit=deposit,
            transaction_type='refund',
            amount=deposit.amount,
            reference=deposit.return_reference,
            description='Deposit refund processed',
            processed_by=request.data.get('processed_by')
        )
        
        return Response({
            'message': 'Deposit return processed successfully',
            'deposit_id': deposit.id,
            'amount': deposit.amount,
            'return_reference': deposit.return_reference
        })
        
    except Deposit.DoesNotExist:
        return Response({'error': 'Deposit not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def process_deposit_forfeit(request, deposit_id):
    """Process a deposit forfeiture (when tool is damaged/lost)"""
    try:
        deposit = Deposit.objects.get(id=deposit_id)
        forfeit_amount = request.data.get('forfeit_amount', deposit.amount)
        reason = request.data.get('reason', 'Tool damaged or lost')
        
        # Update deposit status to forfeited
        deposit.status = 'forfeited'
        deposit.notes = reason
        deposit.save()
        
        # Create transaction record
        DepositTransaction.objects.create(
            deposit=deposit,
            transaction_type='forfeit',
            amount=forfeit_amount,
            reference=f'FORFEIT-{deposit_id}-{int(timezone.now().timestamp())}',
            description=f'Deposit forfeited: {reason}',
            processed_by=request.data.get('processed_by')
        )
        
        return Response({
            'message': 'Deposit forfeiture processed successfully',
            'deposit_id': deposit.id,
            'forfeit_amount': forfeit_amount,
            'reason': reason
        })
        
    except Deposit.DoesNotExist:
        return Response({'error': 'Deposit not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Tool custom views
class ToolListCreateView(generics.ListCreateAPIView):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"Creating tool with request data: {request.data}")
        
        # Get the owner from the request data or use the first user as fallback
        owner_id = request.data.get('owner')
        if owner_id:
            try:
                owner = UserProfile.objects.get(id=owner_id)
                print(f"Using provided owner: {owner}")
            except UserProfile.DoesNotExist:
                print(f"User with ID {owner_id} not found or invalid, using first valid user")
                owner = UserProfile.objects.first()
        else:
            owner = UserProfile.objects.first()
            print(f"No owner provided, using first valid user: {owner}")
        
        if not owner:
            # Create a default user
            owner = UserProfile.objects.create_user(
                username='default_owner',
                email='default@example.com',
                password='defaultpass123',
                first_name='Default',
                last_name='Owner'
            )
            print(f"Created default user: {owner}")
        
        # Create the tool with owner
        tool_data = request.data.copy()
        tool_data['owner'] = owner.id
        
        print(f"Final tool_data: {tool_data}")
        
        serializer = self.get_serializer(data=tool_data)
        print(f"Serializer is valid: {serializer.is_valid()}")
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
        
        tool = serializer.save()
        print(f"Tool created: {tool}")
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ToolRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer

# User custom views
class UserListCreateView(generics.ListCreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer

# Feedback custom views
class FeedbackListCreateView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

class FeedbackRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

# BorrowRequest custom views
class BorrowRequestListCreateView(generics.ListCreateAPIView):
    queryset = BorrowRequest.objects.all()
    serializer_class = BorrowRequestSerializer

class BorrowRequestRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BorrowRequest.objects.all()
    serializer_class = BorrowRequestSerializer

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def list(self, request, *args, **kwargs):
        """Return mock feedback data for the frontend"""
        try:
            # For PPT demo - return mock data
            mock_feedbacks = [
                {
                    'id': 1,
                    'tool': 1,
                    'rating': 5,
                    'comment': 'Great drill set, very professional quality!',
                    'reviewer': {
                        'id': 2,
                        'username': 'borrower1'
                    },
                    'reviewed_user': {
                        'id': 1,
                        'username': 'tool_owner'
                    },
                    'created_at': '2025-07-28T10:00:00Z'
                },
                {
                    'id': 2,
                    'tool': 2,
                    'rating': 4,
                    'comment': 'Lawn mower worked perfectly, very clean cut.',
                    'reviewer': {
                        'id': 3,
                        'username': 'borrower2'
                    },
                    'reviewed_user': {
                        'id': 1,
                        'username': 'tool_owner'
                    },
                    'created_at': '2025-07-22T10:00:00Z'
                }
            ]
            return Response(mock_feedbacks)
        except Exception as e:
            print(f"Error in FeedbackViewSet.list: {e}")
            return Response({'error': 'Internal server error'}, status=500)

class BorrowRequestViewSet(viewsets.ModelViewSet):
    queryset = BorrowRequest.objects.all()
    serializer_class = BorrowRequestSerializer

class RentalTransactionViewSet(viewsets.ModelViewSet):
    queryset = RentalTransaction.objects.all()
    serializer_class = RentalTransactionSerializer

    def create(self, request, *args, **kwargs):
        """Create a new rental transaction"""
        try:
            print(f"Creating rental with request data: {request.data}")
            
            # Extract data from request
            data = request.data.copy()
            
            # Map frontend field names to backend field names
            field_mapping = {
                'toolId': 'tool',
                'borrowerId': 'borrower', 
                'ownerId': 'owner',
                'startDate': 'start_date',
                'endDate': 'end_date',
                'totalAmount': 'total_price',
                'paymentStatus': 'payment_status'
            }
            
            # Transform the data
            transformed_data = {}
            for frontend_key, backend_key in field_mapping.items():
                if frontend_key in data:
                    transformed_data[backend_key] = data[frontend_key]
            
            # Copy other fields that don't need transformation
            for key, value in data.items():
                if key not in field_mapping:
                    transformed_data[key] = value
            
            print(f"Transformed data: {transformed_data}")
            
            # Create serializer with transformed data
            serializer = self.get_serializer(data=transformed_data)
            serializer.is_valid(raise_exception=True)
            rental = serializer.save()
            
            # Update tool availability
            tool = rental.tool
            tool.available = False
            tool.save()
            
            print(f"Rental created successfully: {rental.id}")
            return Response(serializer.data, status=201)
            
        except Exception as e:
            print(f"Error creating rental transaction: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)

    def list(self, request, *args, **kwargs):
        """Return mock rental data for the frontend"""
        try:
            # For PPT demo - return mock data in the format frontend expects
            mock_rentals = [
                {
                    'id': 1,
                    'tool': {
                        'id': 1,
                        'name': 'Drill Set',
                        'description': 'Professional power drill with multiple attachments',
                        'price_per_day': '25.00',
                        'image': 'https://placehold.co/300x200.png',
                        'available': True,
                        'owner': {
                            'id': 1,
                            'username': 'tool_owner'
                        }
                    },
                    'owner': {
                        'id': 1,
                        'username': 'tool_owner'
                    },
                    'borrower': {
                        'id': 2,
                        'username': 'borrower1'
                    },
                    'start_date': '2025-07-25',
                    'end_date': '2025-07-28',
                    'total_price': '75.00',
                    'status': 'active',
                    'payment_status': 'paid',
                    'created_at': '2025-07-25T10:00:00Z'
                },
                {
                    'id': 2,
                    'tool': {
                        'id': 2,
                        'name': 'Lawn Mower',
                        'description': 'Gas-powered lawn mower for large yards',
                        'price_per_day': '35.00',
                        'image': 'https://placehold.co/300x200.png',
                        'available': True,
                        'owner': {
                            'id': 1,
                            'username': 'tool_owner'
                        }
                    },
                    'owner': {
                        'id': 1,
                        'username': 'tool_owner'
                    },
                    'borrower': {
                        'id': 3,
                        'username': 'borrower2'
                    },
                    'start_date': '2025-07-20',
                    'end_date': '2025-07-22',
                    'total_price': '70.00',
                    'status': 'completed',
                    'payment_status': 'paid',
                    'created_at': '2025-07-20T10:00:00Z'
                },
                {
                    'id': 3,
                    'tool': {
                        'id': 3,
                        'name': 'Ladder',
                        'description': '10-foot aluminum extension ladder',
                        'price_per_day': '15.00',
                        'image': 'https://placehold.co/300x200.png',
                        'available': True,
                        'owner': {
                            'id': 1,
                            'username': 'tool_owner'
                        }
                    },
                    'owner': {
                        'id': 1,
                        'username': 'tool_owner'
                    },
                    'borrower': {
                        'id': 2,  # This will show up for user with ID 2
                        'username': 'borrower1'
                    },
                    'start_date': '2025-07-30',
                    'end_date': '2025-08-02',
                    'total_price': '60.00',
                    'status': 'active',
                    'payment_status': 'paid',
                    'created_at': '2025-07-30T10:00:00Z'
                }
            ]
            return Response(mock_rentals)
        except Exception as e:
            print(f"Error in RentalTransactionViewSet.list: {e}")
            return Response({'error': 'Internal server error'}, status=500)

    def retrieve(self, request, *args, **kwargs):
        """Return mock rental data for a specific rental"""
        try:
            rental_id = kwargs.get('pk')
            mock_rental = {
                'id': rental_id,
                'borrower_id': 2,
                'tool_id': 1,
                'start_date': '2025-07-25',
                'end_date': '2025-07-28',
                'total_price': 75.00,
                'status': 'active',
                'payment_status': 'paid'
            }
            return Response(mock_rental)
        except Exception as e:
            print(f"Error in RentalTransactionViewSet.retrieve: {e}")
            return Response({'error': 'Internal server error'}, status=500)

@api_view(['POST'])
def django_login(request):
    """Django login endpoint for frontend authentication"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        print(f"Login attempt for email: {email}")
        
        if not email or not password:
            return Response({'message': 'Email and password are required'}, status=400)
        
        # Try to authenticate with real user credentials
        try:
            from django.contrib.auth import authenticate
            
            # First try to authenticate with email as username
            user = authenticate(username=email, password=password)
            
            # If that fails, try to find user by email and authenticate with username
            if user is None:
                try:
                    user_profile = UserProfile.objects.get(email=email)
                    user = authenticate(username=user_profile.username, password=password)
                except UserProfile.DoesNotExist:
                    user = None
            
            if user is not None:
                # User authenticated successfully
                return Response({
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'fullName': f"{user.first_name} {user.last_name}".strip() or user.username,
                        'username': user.username,
                    }
                })
            else:
                # Check if user exists but password is wrong
                try:
                    user_exists = UserProfile.objects.get(email=email)
                    return Response({'message': 'Invalid password'}, status=401)
                except UserProfile.DoesNotExist:
                    return Response({'message': 'User not found'}, status=401)
                    
        except Exception as auth_error:
            print(f"Authentication error: {auth_error}")
            return Response({'message': 'Authentication failed'}, status=401)
            
    except Exception as e:
        print(f"Login error: {e}")
        return Response({'message': 'Internal server error'}, status=500)

@api_view(['POST'])
def django_signup(request):
    """Django signup endpoint for frontend authentication"""
    try:
        full_name = request.data.get('fullName')
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not all([full_name, username, email, password]):
            return Response({'message': 'All fields are required'}, status=400)
        
        # Check if user already exists
        if UserProfile.objects.filter(email=email).exists():
            return Response({'message': 'User with this email already exists'}, status=400)
        
        if UserProfile.objects.filter(username=username).exists():
            return Response({'message': 'Username already taken'}, status=400)
        
        # Split full name into first and last name
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create new user
        user = UserProfile.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        return Response({
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'fullName': full_name,
                'username': user.username,
            }
        })
        
    except Exception as e:
        print(f"Signup error: {e}")
        return Response({'message': 'Internal server error'}, status=500)

@api_view(['POST'])
def django_logout(request):
    """Django logout endpoint for frontend authentication"""
    try:
        # For now, just return success
        # In a real app, this would invalidate tokens/sessions
        return Response({
            'message': 'Logout successful'
        })
        
    except Exception as e:
        print(f"Logout error: {e}")
        return Response({'message': 'Internal server error'}, status=500)

@api_view(['GET'])
def list_deposits(request):
    """List all deposits for the current user"""
    try:
        # For now, return all deposits since authentication is not set up
        # In a real app, this would filter by the authenticated user
        deposits = Deposit.objects.all().order_by('-created_at')
        serializer = DepositSerializer(deposits, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in list_deposits: {e}")
        return Response({'error': str(e)}, status=500)

# Trust & Safety Features
@api_view(['POST'])
def verify_user_identity(request, user_id):
    """Submit user identity verification documents"""
    try:
        user = UserProfile.objects.get(id=user_id)
        
        # Create verification record
        verification = UserVerification.objects.create(
            user=user,
            verification_type=request.data.get('verification_type'),
            document_front=request.FILES.get('document_front'),
            document_back=request.FILES.get('document_back'),
            status='pending'
        )
        
        return Response({
            'message': 'Verification documents submitted successfully',
            'verification_id': verification.id,
            'status': verification.status
        }, status=201)
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_user_reviews(request, user_id):
    """Get reviews for a specific user"""
    try:
        user = UserProfile.objects.get(id=user_id)
        reviews = UserReview.objects.filter(reviewed_user=user, is_public=True).order_by('-created_at')
        
        # Calculate average rating
        avg_rating = reviews.aggregate(avg_rating=models.Avg('rating'))['avg_rating'] or 0
        
        return Response({
            'user_id': user_id,
            'username': user.username,
            'average_rating': round(avg_rating, 2),
            'total_reviews': reviews.count(),
            'reviews': UserReviewSerializer(reviews, many=True).data
        })
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_tool_reviews(request, tool_id):
    """Get reviews for a specific tool"""
    try:
        tool = Tool.objects.get(id=tool_id)
        
        # Get reviews from rental transactions for this tool
        rentals = RentalTransaction.objects.filter(tool=tool)
        reviews = Feedback.objects.filter(rental_transaction__in=rentals, is_public=True).order_by('-created_at')
        
        # Calculate average rating
        avg_rating = reviews.aggregate(avg_rating=models.Avg('rating'))['avg_rating'] or 0
        
        return Response({
            'tool_id': tool_id,
            'tool_name': tool.name,
            'average_rating': round(avg_rating, 2),
            'total_reviews': reviews.count(),
            'reviews': FeedbackSerializer(reviews, many=True).data
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def list_disputes(request):
    """List disputes for the current user"""
    try:
        # For now, return all disputes since authentication is not set up
        # In a real app, this would filter by the authenticated user
        disputes = Dispute.objects.all().order_by('-created_at')
        
        # Create a simple serializer for disputes
        dispute_data = []
        for dispute in disputes:
            dispute_data.append({
                'id': dispute.id,
                'title': dispute.title,
                'dispute_type': dispute.dispute_type,
                'status': dispute.status,
                'created_at': dispute.created_at,
                'initiator': dispute.initiator.username,
                'rental_id': dispute.rental_transaction.id
            })
        
        return Response(dispute_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def create_dispute(request):
    """Create a new dispute"""
    try:
        rental_id = request.data.get('rental_id')
        dispute_type = request.data.get('dispute_type')
        title = request.data.get('title')
        description = request.data.get('description')
        
        if not all([rental_id, dispute_type, title, description]):
            return Response({'error': 'Missing required fields'}, status=400)
        
        rental = RentalTransaction.objects.get(id=rental_id)
        
        # For now, use the first user as initiator since authentication is not set up
        initiator = UserProfile.objects.first()
        
        dispute = Dispute.objects.create(
            rental_transaction=rental,
            initiator=initiator,
            dispute_type=dispute_type,
            title=title,
            description=description,
            status='open'
        )
        
        return Response({
            'message': 'Dispute created successfully',
            'dispute_id': dispute.id,
            'status': dispute.status
        }, status=201)
        
    except RentalTransaction.DoesNotExist:
        return Response({'error': 'Rental transaction not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def resolve_dispute(request, dispute_id):
    """Resolve a dispute"""
    try:
        dispute = Dispute.objects.get(id=dispute_id)
        resolution = request.data.get('resolution')
        new_status = request.data.get('status', 'resolved')
        
        if not resolution:
            return Response({'error': 'Resolution text is required'}, status=400)
        
        # For now, use the first user as resolver since authentication is not set up
        resolver = UserProfile.objects.first()
        
        dispute.resolution = resolution
        dispute.status = new_status
        dispute.resolved_by = resolver
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        return Response({
            'message': 'Dispute resolved successfully',
            'dispute_id': dispute.id,
            'status': dispute.status
        })
        
    except Dispute.DoesNotExist:
        return Response({'error': 'Dispute not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Enhanced Location-Based Features
@api_view(['GET'])
def find_tools_near_location(request):
    """Find tools near a specific location with advanced filtering"""
    try:
        lat = request.GET.get('lat')
        lng = request.GET.get('lng')
        radius = float(request.GET.get('radius', 10))  # Default 10 miles
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        pricing_type = request.GET.get('pricing_type')
        min_rating = float(request.GET.get('min_rating', 0))
        max_price = float(request.GET.get('max_price', 1000))
        
        if not lat or not lng:
            return Response({'error': 'Location coordinates required'}, status=400)
        
        # Get all available tools
        tools = Tool.objects.filter(available=True)
        
        # Filter by pricing type if specified
        if pricing_type:
            tools = tools.filter(pricing_type=pricing_type)
        
        # Filter by price if specified
        if max_price > 0:
            tools = tools.filter(price_per_day__lte=max_price)
        
        # Calculate distances and filter by radius
        nearby_tools = []
        for tool in tools:
            if tool.latitude and tool.longitude:
                distance = tool.calculate_distance_to(lat, lng)
                if distance is not None and distance <= radius:
                    # Check availability for date range if specified
                    is_available = True
                    if start_date and end_date:
                        conflicting_rentals = RentalTransaction.objects.filter(
                            tool=tool,
                            status='active',
                            start_date__lt=end_date,
                            end_date__gt=start_date
                        )
                        is_available = not conflicting_rentals.exists()
                    
                    if is_available:
                        # Get tool rating
                        tool_rentals = RentalTransaction.objects.filter(tool=tool)
                        tool_reviews = Feedback.objects.filter(rental_transaction__in=tool_rentals)
                        avg_rating = tool_reviews.aggregate(avg_rating=models.Avg('rating'))['avg_rating'] or 0
                        
                        # Filter by minimum rating if specified
                        if avg_rating >= min_rating:
                            nearby_tools.append({
                                'tool': ToolSerializer(tool, context={'request': request}).data,
                                'distance': round(distance, 2),
                                'average_rating': round(avg_rating, 2),
                                'total_reviews': tool_reviews.count()
                            })
        
        # Sort by distance
        nearby_tools.sort(key=lambda x: x['distance'])
        
        return Response({
            'tools': nearby_tools,
            'search_radius': radius,
            'user_location': {'lat': lat, 'lng': lng},
            'filters_applied': {
                'pricing_type': pricing_type,
                'min_rating': min_rating,
                'max_price': max_price,
                'date_range': {'start_date': start_date, 'end_date': end_date} if start_date and end_date else None
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Real-time Availability Calendar Updates
@api_view(['GET'])
def get_tool_calendar_availability(request, tool_id):
    """Get detailed calendar availability for a tool"""
    try:
        tool = Tool.objects.get(id=tool_id)
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if not start_date or not end_date:
            return Response({'error': 'Start date and end date required'}, status=400)
        
        # Get all active rentals for this tool in the date range
        active_rentals = RentalTransaction.objects.filter(
            tool=tool,
            status='active',
            start_date__lte=end_date,
            end_date__gte=start_date
        ).values('start_date', 'end_date', 'start_time', 'end_time')
        
        # Get availability records
        availability_records = Availability.objects.filter(
            tool=tool,
            start_date__lte=end_date,
            end_date__gte=start_date
        ).values('start_date', 'end_date', 'is_booked')
        
        # Get flexible availability
        flexible_availability = FlexibleAvailability.objects.filter(
            tool=tool,
            start_date__lte=end_date,
            end_date__gte=start_date,
            is_available=True
        ).values('start_date', 'end_date')
        
        # Get recurring availability
        recurring_availability = RecurringAvailability.objects.filter(
            tool=tool,
            is_active=True
        ).values('pattern_type', 'days_of_week', 'start_time', 'end_time')
        
        # Get hourly availability for the date range
        hourly_availability = HourlyAvailability.objects.filter(
            tool=tool,
            date__range=[start_date, end_date]
        ).values('date', 'hour', 'is_available', 'is_booked')
        
        return Response({
            'tool_id': tool_id,
            'tool_name': tool.name,
            'date_range': {'start_date': start_date, 'end_date': end_date},
            'active_rentals': list(active_rentals),
            'availability_records': list(availability_records),
            'flexible_availability': list(flexible_availability),
            'recurring_availability': list(recurring_availability),
            'hourly_availability': list(hourly_availability),
            'tool_available': tool.available
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Advanced Conflict Checking
@api_view(['POST'])
def check_advanced_availability_conflict(request):
    """Advanced conflict checking with multiple availability types"""
    try:
        tool_id = request.data.get('tool_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        
        if not all([tool_id, start_date, end_date]):
            return Response({'error': 'Missing required fields'}, status=400)
        
        tool = Tool.objects.get(id=tool_id)
        
        # Check for overlapping active rentals
        overlapping_rentals = RentalTransaction.objects.filter(
            tool=tool,
            status='active',
            start_date__lt=end_date,
            end_date__gt=start_date
        )
        
        # Check for overlapping availability records
        overlapping_availability = Availability.objects.filter(
            tool=tool,
            start_date__lt=end_date,
            end_date__gt=start_date,
            is_booked=True
        )
        
        # Check for overlapping flexible availability (unavailable periods)
        overlapping_flexible = FlexibleAvailability.objects.filter(
            tool=tool,
            start_date__lt=end_date,
            end_date__gt=start_date,
            is_available=False
        )
        
        # Check hourly conflicts if time is specified
        hourly_conflicts = []
        if start_time and end_time:
            from datetime import datetime, time, date
            start_datetime = datetime.combine(
                date.fromisoformat(start_date),
                time.fromisoformat(start_time)
            )
            end_datetime = datetime.combine(
                date.fromisoformat(end_date),
                time.fromisoformat(end_time)
            )
            
            # Check hourly availability conflicts
            conflicting_hours = HourlyAvailability.objects.filter(
                tool=tool,
                date__range=[start_date, end_date],
                is_booked=True
            )
            hourly_conflicts = list(conflicting_hours.values('date', 'hour'))
        
        has_conflict = (
            overlapping_rentals.exists() or 
            overlapping_availability.exists() or 
            overlapping_flexible.exists() or
            len(hourly_conflicts) > 0
        )
        
        return Response({
            'has_conflict': has_conflict,
            'conflicting_rentals': list(overlapping_rentals.values('start_date', 'end_date', 'start_time', 'end_time')),
            'conflicting_availability': list(overlapping_availability.values('start_date', 'end_date')),
            'conflicting_flexible': list(overlapping_flexible.values('start_date', 'end_date')),
            'hourly_conflicts': hourly_conflicts,
            'conflict_details': {
                'rental_conflicts': overlapping_rentals.count(),
                'availability_conflicts': overlapping_availability.count(),
                'flexible_conflicts': overlapping_flexible.count(),
                'hourly_conflicts': len(hourly_conflicts)
            }
        })
        
    except Tool.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_tools(request):
    """Get all tools for the frontend"""
    try:
        # For PPT demo - return mock data
        mock_tools = [
            {
                'id': 1,
                'name': 'Drill Set',
                'description': 'Professional power drill with multiple attachments',
                'image': 'https://placehold.co/300x200.png',
                'price_per_day': 25.00,
                'available': True,
                'owner': {
                    'id': 1,
                    'username': 'tool_owner',
                    'fullName': 'Tool Owner'
                }
            },
            {
                'id': 2,
                'name': 'Lawn Mower',
                'description': 'Gas-powered lawn mower for large yards',
                'image': 'https://placehold.co/300x200.png',
                'price_per_day': 35.00,
                'available': True,
                'owner': {
                    'id': 1,
                    'username': 'tool_owner',
                    'fullName': 'Tool Owner'
                }
            },
            {
                'id': 3,
                'name': 'Ladder',
                'description': '10-foot aluminum extension ladder',
                'image': 'https://placehold.co/300x200.png',
                'price_per_day': 15.00,
                'available': True,
                'owner': {
                    'id': 1,
                    'username': 'tool_owner',
                    'fullName': 'Tool Owner'
                }
            }
        ]
        return Response(mock_tools)
    except Exception as e:
        print(f"Error in get_tools: {e}")
        return Response({'error': 'Internal server error'}, status=500)

@api_view(['GET'])
def get_rentals(request):
    """Get all rentals for the frontend"""
    try:
        # For PPT demo - return mock data
        mock_rentals = [
            {
                'id': 1,
                'tool': {
                    'id': 1,
                    'name': 'Drill Set',
                    'image': 'https://placehold.co/300x200.png'
                },
                'borrower': {
                    'id': 2,
                    'username': 'borrower1',
                    'fullName': 'John Doe'
                },
                'owner': {
                    'id': 1,
                    'username': 'tool_owner',
                    'fullName': 'Tool Owner'
                },
                'start_date': '2025-07-25',
                'end_date': '2025-07-28',
                'total_price': 75.00,
                'status': 'active',
                'payment_status': 'paid'
            },
            {
                'id': 2,
                'tool': {
                    'id': 2,
                    'name': 'Lawn Mower',
                    'image': 'https://placehold.co/300x200.png'
                },
                'borrower': {
                    'id': 3,
                    'username': 'borrower2',
                    'fullName': 'Jane Smith'
                },
                'owner': {
                    'id': 1,
                    'username': 'tool_owner',
                    'fullName': 'Tool Owner'
                },
                'start_date': '2025-07-20',
                'end_date': '2025-07-22',
                'total_price': 70.00,
                'status': 'completed',
                'payment_status': 'paid'
            }
        ]
        return Response(mock_rentals)
    except Exception as e:
        print(f"Error in get_rentals: {e}")
        return Response({'error': 'Internal server error'}, status=500)

@api_view(['GET'])
def get_deposits(request):
    """Get all deposits for the frontend"""
    try:
        # For PPT demo - return mock data
        mock_deposits = [
            {
                'id': 1,
                'rental_transaction': {
                    'id': 1,
                    'tool': {'name': 'Drill Set'},
                    'borrower': {'username': 'borrower1'}
                },
                'amount': 50.00,
                'status': 'paid',
                'created_at': '2025-07-25T10:00:00Z'
            },
            {
                'id': 2,
                'rental_transaction': {
                    'id': 2,
                    'tool': {'name': 'Lawn Mower'},
                    'borrower': {'username': 'borrower2'}
                },
                'amount': 50.00,
                'status': 'refunded',
                'created_at': '2025-07-20T10:00:00Z'
            }
        ]
        return Response(mock_deposits)
    except Exception as e:
        print(f"Error in get_deposits: {e}")
        return Response({'error': 'Internal server error'}, status=500)

