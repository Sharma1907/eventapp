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


ADMIN_ROLES = ('super_admin', 'mgmt_admin')


def _is_admin(user):
    return hasattr(user, 'role') and user.role in ADMIN_ROLES


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list_view(request):
    """All users — admin only. Supports ?search= and ?role= filters."""
    if not _is_admin(request.user):
        return Response({'error': 'Permission denied'}, status=403)

    qs = User.objects.all().order_by('role', 'first_name', 'last_name')

    search = request.query_params.get('search', '').strip()
    role   = request.query_params.get('role', '').strip()
    if search:
        from django.db.models import Q
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)  |
            Q(email__icontains=search)      |
            Q(registration_id__icontains=search)
        )
    if role:
        qs = qs.filter(role=role)

    data = []
    for u in qs:
        photo = None
        if u.profile_photo:
            try:    photo = request.build_absolute_uri(u.profile_photo.url)
            except: pass
        data.append({
            'id':              str(u.id),
            'email':           u.email,
            'registration_id': u.registration_id or '',
            'first_name':      u.first_name,
            'last_name':       u.last_name,
            'role':            u.role,
            'affiliation':     u.affiliation,
            'is_active':       u.is_active,
            'warning_note':    u.warning_note,
            'suspended_reason':u.suspended_reason,
            'profile_photo_url': photo,
            'created_at':      u.created_at.isoformat(),
        })
    return Response({'users': data, 'total': len(data)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_action_view(request, pk):
    """
    Warn, suspend, or unsuspend a user.
    Body: { action: 'warn'|'suspend'|'unsuspend', note: '...' }
    Admins cannot act on other admins.
    """
    if not _is_admin(request.user):
        return Response({'error': 'Permission denied'}, status=403)

    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    if target.role in ADMIN_ROLES:
        return Response({'error': 'Cannot moderate admin accounts'}, status=400)

    action = request.data.get('action', '').strip()
    note   = request.data.get('note', '').strip()

    if action == 'warn':
        if not note:
            return Response({'error': 'note is required for a warning'}, status=400)
        target.warning_note = note
        target.save(update_fields=['warning_note'])
        # Send push notification to warned user
        try:
            from apps.notifications.models import Notification as Notif
            from apps.notifications import fcm
            notif = Notif.objects.create(
                title='⚠️ Warning from Admin',
                body=note,
                target_type='user',
                target_user=target,
                sent_by=request.user,
                status='pending',
                data={'type': 'admin_warning'},
            )
            success, failed, bad = fcm.send_to_user(target, notif.title, notif.body, notif.data, notif)
            notif.status = 'sent'; notif.sent_count = success; notif.failed_count = failed; notif.save()
        except Exception:
            pass  # non-critical — warning is stored on user regardless
        return Response({'success': True, 'action': 'warned', 'note': note})

    elif action == 'suspend':
        reason = note or 'Account suspended by admin.'
        target.is_active        = False
        target.suspended_reason = reason
        target.save(update_fields=['is_active', 'suspended_reason'])
        # blacklist all tokens — force immediate logout
        try:
            from apps.notifications.models import DeviceToken
            DeviceToken.objects.filter(user=target).update(is_active=False)
        except Exception:
            pass
        # Send suspension email
        try:
            from django.core.mail import send_mail
            send_mail(
                subject='ETD 2026 — Account Suspended',
                message=(
                    f"Dear {target.get_full_name() or target.email},\n\n"
                    f"Your ETD 2026 account has been suspended.\n\n"
                    f"Reason: {reason}\n\n"
                    f"If you believe this is a mistake, please contact the organizing team.\n\n"
                    f"Regards,\nETD 2026 Organising Committee\nIIT Delhi"
                ),
                from_email=None,
                recipient_list=[target.email],
                fail_silently=True,
            )
        except Exception:
            pass  # non-critical
        return Response({'success': True, 'action': 'suspended'})

    elif action == 'unsuspend':
        target.is_active        = True
        target.suspended_reason = ''
        target.save(update_fields=['is_active', 'suspended_reason'])
        return Response({'success': True, 'action': 'unsuspended'})

    return Response({'error': 'action must be warn | suspend | unsuspend'}, status=400)
