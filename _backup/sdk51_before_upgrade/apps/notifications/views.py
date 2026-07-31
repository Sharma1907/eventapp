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
    token    = request.data.get('token', '').strip()
    platform = request.data.get('platform', 'android')
    if not token:
        return Response({'error': 'token required'}, status=400)
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
    if not hasattr(request.user, 'role') or request.user.role not in ('super_admin', 'mgmt_admin'):
        return Response({'error': 'Permission denied'}, status=403)
    title   = request.data.get('title', '').strip()
    body    = request.data.get('body', '').strip()
    if not title or not body:
        return Response({'error': 'title and body required'}, status=400)
    target_type = request.data.get('target_type', 'all')
    target_role = request.data.get('target_role', '')
    data        = request.data.get('data', {})
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
        else:
            notif.status = 'failed'; notif.save()
            return Response({'error': 'Invalid target'}, status=400)
        if bad:
            DeviceToken.objects.filter(token__in=bad).update(is_active=False)
        notif.status = 'sent'; notif.sent_count = success; notif.failed_count = failed
        notif.save()
        return Response({'success': True, 'sent': success, 'failed': failed})
    except Exception as e:
        logger.error("Send error: %s", e)
        notif.status = 'failed'; notif.save()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_history(request):
    if not hasattr(request.user, 'role') or request.user.role not in ('super_admin', 'mgmt_admin'):
        return Response({'error': 'Permission denied'}, status=403)
    notifs = Notification.objects.prefetch_related('attachments').all()[:50]
    result = []
    for n in notifs:
        cover = None
        if n.cover_image:
            try:    cover = request.build_absolute_uri(n.cover_image.url)
            except: pass
        result.append({
            'id':              str(n.id),
            'title':           n.title,
            'body':            n.body,
            'status':          n.status,
            'sent_count':      n.sent_count,
            'failed_count':    n.failed_count,
            'delivered_count': n.delivered_count,
            'read_count':      n.read_count,
            'target_type':     n.target_type,
            'target_role':     n.target_role,
            'cover_image_url': cover,
            'attachment_count': n.attachments.count(),
            'created_at':      n.created_at.isoformat(),
        })
    return Response({'notifications': result})


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def notification_detail(request, pk):
    if not hasattr(request.user, 'role') or request.user.role not in ('super_admin', 'mgmt_admin'):
        return Response({'error': 'Permission denied'}, status=403)
    try:
        from .models import Notification as N
        notif = N.objects.get(pk=pk)
    except N.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'DELETE':
        notif.delete()
        return Response({'success': True})

    # PATCH — title/body only (file uploads stay web-only for now)
    # ceiling: cover_image + attachment upload via multipart not exposed on mobile
    title = request.data.get('title', '').strip()
    body  = request.data.get('body',  '').strip()
    if not title or not body:
        return Response({'error': 'title and body required'}, status=400)
    notif.title = title
    notif.body  = body
    notif.save(update_fields=['title', 'body'])
    return Response({'success': True, 'id': str(notif.id), 'title': notif.title, 'body': notif.body})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    user_notifs = (
        UserNotification.objects
        .filter(user=request.user)
        .select_related('notification')
        .order_by('-created_at')[:50]
    )
    data = []
    for un in user_notifs:
        n = un.notification
        cover = None
        if n.cover_image:
            try:
                cover = request.build_absolute_uri(n.cover_image.url)
            except Exception:
                pass
        attachments = []
        for att in n.attachments.all():
            try:
                attachments.append({
                    'id':       att.pk,
                    'filename': att.filename,
                    'url':      request.build_absolute_uri(att.file.url),
                })
            except Exception:
                pass
        data.append({
            'id':              str(un.id),
            'notification_id': str(n.id),
            'title':           n.title,
            'body':            n.body,
            'cover_image_url': cover,
            'attachments':     attachments,
            'data':            n.data,
            'read':            un.read,
            'delivered_at':    un.delivered_at.isoformat() if un.delivered_at else None,
            'read_at':         un.read_at.isoformat()      if un.read_at      else None,
            'created_at':      un.created_at.isoformat(),
        })
    return Response({
        'notifications': data,
        'unread_count': UserNotification.objects.filter(user=request.user, read=False).count(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request):
    ids = request.data.get('notification_ids', [])
    if isinstance(ids, str):
        ids = [ids]
    updated = UserNotification.objects.filter(
        user=request.user, notification_id__in=ids, read=False,
    ).update(read=True, read_at=timezone.now())
    return Response({'success': True, 'marked_read': updated})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    updated = UserNotification.objects.filter(
        user=request.user, read=False,
    ).update(read=True, read_at=timezone.now())
    return Response({'success': True, 'marked_read': updated})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = UserNotification.objects.filter(user=request.user, read=False).count()
    return Response({'unread_count': count})
