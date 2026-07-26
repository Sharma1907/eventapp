from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import DeviceToken, Notification, UserNotification
from . import fcm
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_token(request):
    token = request.data.get('token', '').strip()
    platform = request.data.get('platform', 'android')
    if not token:
        return Response({'error': 'token required'}, status=status.HTTP_400_BAD_REQUEST)
    obj, created = DeviceToken.objects.update_or_create(
        token=token,
        defaults={'user': request.user, 'platform': platform, 'is_active': True}
    )
    return Response({'success': True, 'created': created})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_token(request):
    token = request.data.get('token', '').strip()
    if token:
        DeviceToken.objects.filter(token=token).update(is_active=False)
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):
    if not hasattr(request.user, 'role') or request.user.role not in ('super_admin', 'admin', 'organizer'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title', '').strip()
    body = request.data.get('body', '').strip()
    target_type = request.data.get('target_type', 'all')
    target_role = request.data.get('target_role', '')
    target_user_id = request.data.get('target_user_id')
    data = request.data.get('data', {})

    if not title or not body:
        return Response({'error': 'title and body required'}, status=status.HTTP_400_BAD_REQUEST)

    notif = Notification.objects.create(
        title=title, body=body, data=data,
        target_type=target_type, target_role=target_role,
        sent_by=request.user, status='pending',
    )

    try:
        if target_type == 'all':
            success, failed, bad = fcm.send_to_all(title, body, data, notif)
        elif target_type == 'role' and target_role:
            success, failed, bad = fcm.send_to_role(target_role, title, body, data, notif)
        elif target_type == 'user' and target_user_id:
            from apps.accounts.models import User
            user = User.objects.get(id=target_user_id)
            notif.target_user = user
            success, failed, bad = fcm.send_to_user(user, title, body, data, notif)
        else:
            notif.status = 'failed'
            notif.save()
            return Response({'error': 'Invalid target'}, status=status.HTTP_400_BAD_REQUEST)

        if bad:
            DeviceToken.objects.filter(token__in=bad).update(is_active=False)

        notif.status = 'sent'
        notif.sent_count = success
        notif.failed_count = failed
        notif.save()
        return Response({'success': True, 'sent': success, 'failed': failed})

    except Exception as e:
        logger.error(f"Send error: {e}")
        notif.status = 'failed'
        notif.save()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_history(request):
    """Admin: get all sent notifications with read counts"""
    if not hasattr(request.user, 'role') or request.user.role not in ('super_admin', 'admin', 'organizer'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    notifs = Notification.objects.all()[:50]
    data = [{
        'id': str(n.id),
        'title': n.title,
        'body': n.body,
        'target_type': n.target_type,
        'target_role': n.target_role,
        'status': n.status,
        'sent_count': n.sent_count,
        'failed_count': n.failed_count,
        'delivered_count': n.delivered_count,
        'read_count': n.read_count,
        'created_at': n.created_at.isoformat(),
    } for n in notifs]
    return Response({'notifications': data})


# ─── App Notification Endpoints ──────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    """Get all notifications for current user"""
    user_notifs = UserNotification.objects.filter(user=request.user).select_related('notification')[:50]

    data = [{
        'id': str(un.id),
        'notification_id': str(un.notification.id),
        'title': un.notification.title,
        'body': un.notification.body,
        'data': un.notification.data,
        'read': un.read,
        'delivered_at': un.delivered_at.isoformat() if un.delivered_at else None,
        'read_at': un.read_at.isoformat() if un.read_at else None,
        'created_at': un.created_at.isoformat(),
    } for un in user_notifs]

    unread_count = UserNotification.objects.filter(user=request.user, read=False).count()

    return Response({
        'notifications': data,
        'unread_count': unread_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request):
    """Mark one or more notifications as read"""
    notification_ids = request.data.get('notification_ids', [])
    if isinstance(notification_ids, str):
        notification_ids = [notification_ids]

    now = timezone.now()
    updated = UserNotification.objects.filter(
        user=request.user,
        notification_id__in=notification_ids,
        read=False,
    ).update(read=True, read_at=now)

    return Response({'success': True, 'marked_read': updated})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """Mark all notifications as read for current user"""
    now = timezone.now()
    updated = UserNotification.objects.filter(
        user=request.user,
        read=False,
    ).update(read=True, read_at=now)

    return Response({'success': True, 'marked_read': updated})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get unread notification count for badge"""
    count = UserNotification.objects.filter(user=request.user, read=False).count()
    return Response({'unread_count': count})
