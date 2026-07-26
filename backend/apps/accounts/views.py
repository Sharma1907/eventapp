from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import LoginSerializer, UserSerializer, ChangePasswordSerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)

    return Response({
        'success': True,
        'message': 'Login successful',
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'user': UserSerializer(user, context={'request': request}).data,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({
        'success': True,
        'user': UserSerializer(request.user, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({
            'success': False,
            'message': 'Current password is incorrect.',
        }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.must_change_password = False
    user.save()

    refresh = RefreshToken.for_user(user)

    return Response({
        'success': True,
        'message': 'Password changed successfully.',
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_profile_view(request):
    user = request.user
    was_complete = user.profile_complete

    serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # Refresh from DB to get updated fields
    user.refresh_from_db()

    # Check profile completion
    is_now_complete = all([
        user.first_name,
        user.last_name,
        user.affiliation,
        user.bio or user.research_interests,
    ])

    points_awarded = 0

    if is_now_complete and not was_complete:
        user.profile_complete = True
        user.save(update_fields=['profile_complete'])
        # Award points for profile completion
        try:
            from apps.leaderboard.utils import award_points
            from apps.leaderboard.models import PointAction, PointEntry
            if not PointEntry.objects.filter(user=user, action=PointAction.PROFILE_COMPLETION).exists():
                award_points(user, PointAction.PROFILE_COMPLETION, 'Profile completed')
                points_awarded = 50
        except Exception:
            pass
    elif not is_now_complete and was_complete:
        user.profile_complete = False
        user.save(update_fields=['profile_complete'])

    response_data = {
        'success': True,
        'message': 'Profile updated.',
        'user': UserSerializer(user, context={'request': request}).data,
    }

    if points_awarded > 0:
        response_data['points_awarded'] = points_awarded
        response_data['points_message'] = f'🎉 +{points_awarded} points for completing your profile!'

    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass

    return Response({
        'success': True,
        'message': 'Logged out successfully.',
    })
