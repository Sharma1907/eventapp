from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.utils import timezone

from apps.checkins.models import CheckIn
from .models import Photo, PhotoSettings, ScheduleSession


def _is_checked_in(user):
    return CheckIn.objects.filter(user=user, checkin_type='conference').exists()


def _photo_data(photo, request):
    return {
        'id': photo.id,
        'image_url': request.build_absolute_uri(photo.image.url),
        'caption': photo.caption,
        'session_id': str(photo.session_id) if photo.session_id else None,
        'session_title': photo.session.title if photo.session_id else None,
        'uploader': photo.uploader.get_full_name() or photo.uploader.email.split('@')[0],
        'created_at': photo.created_at.isoformat(),
    }


# ── Public / participant ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gallery(request):
    """
    GET /api/v1/photos/gallery/
    ?session=<uuid>  — filter by session
    ?wall=1          — general wall only (no session)
    Checked-in only.
    """
    if not _is_checked_in(request.user):
        return Response({'error': 'Conference check-in required'}, status=403)

    qs = Photo.objects.filter(status=Photo.Status.APPROVED).select_related('uploader', 'session')

    session_id = request.query_params.get('session')
    if session_id:
        qs = qs.filter(session_id=session_id)
    elif request.query_params.get('wall'):
        qs = qs.filter(session__isnull=True)

    return Response({
        'upload_open': PhotoSettings.get().upload_open,
        'photos': [_photo_data(p, request) for p in qs[:200]],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload(request):
    """
    POST /api/v1/photos/upload/
    Fields: image (file), caption (str, optional), session_id (uuid, optional)
    Checked-in only. Window must be open.
    """
    if not _is_checked_in(request.user):
        return Response({'error': 'Conference check-in required'}, status=403)

    settings = PhotoSettings.get()
    if not settings.upload_open:
        return Response({'error': 'Photo uploads are currently closed'}, status=403)

    image = request.FILES.get('image')
    if not image:
        return Response({'error': 'No image provided'}, status=400)

    # 10 MB cap
    if image.size > 10 * 1024 * 1024:
        return Response({'error': 'Image must be under 10 MB'}, status=400)

    session = None
    session_id = request.data.get('session_id')
    if session_id:
        try:
            session = ScheduleSession.objects.get(pk=session_id, is_published=True)
        except ScheduleSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

    status = Photo.Status.APPROVED if settings.auto_approve else Photo.Status.PENDING

    photo = Photo.objects.create(
        uploader=request.user,
        image=image,
        caption=request.data.get('caption', '').strip()[:300],
        session=session,
        status=status,
    )

    return Response({
        'id': photo.id,
        'status': photo.status,
        'auto_approved': settings.auto_approve,
        'message': 'Photo uploaded and approved!' if settings.auto_approve else 'Photo uploaded and pending admin approval.',
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_photos(request):
    """GET /api/v1/photos/mine/ — user's own uploads with status."""
    qs = Photo.objects.filter(uploader=request.user).select_related('session')
    return Response({
        'photos': [
            {
                **_photo_data(p, request),
                'status': p.status,
                'rejected_reason': p.rejected_reason,
            }
            for p in qs
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sessions_with_photos(request):
    """GET /api/v1/photos/sessions/ — sessions that have approved photos."""
    if not _is_checked_in(request.user):
        return Response({'error': 'Conference check-in required'}, status=403)

    from django.db.models import Count
    sessions = ScheduleSession.objects.filter(
        photos__status=Photo.Status.APPROVED,
        is_published=True,
    ).annotate(photo_count=Count('photos')).order_by('day', 'start_datetime')

    return Response({
        'sessions': [
            {
                'id': str(s.id),
                'title': s.title,
                'day': s.day,
                'session_type': s.session_type,
                'photo_count': s.photo_count,
            }
            for s in sessions
        ]
    })


# ── Admin API ──────────────────────────────────────────────────────

def _is_admin(user):
    return user.role in ('super_admin', 'mgmt_admin', 'team_head', 'staff')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_settings(request):
    """GET/POST /api/v1/photos/admin/settings/"""
    if not _is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)

    cfg = PhotoSettings.get()

    if request.method == 'POST':
        if 'upload_open' in request.data:
            cfg.upload_open = bool(request.data['upload_open'])
        if 'auto_approve' in request.data:
            cfg.auto_approve = bool(request.data['auto_approve'])
        cfg.updated_by = request.user
        cfg.save()

    return Response({
        'upload_open': cfg.upload_open,
        'auto_approve': cfg.auto_approve,
        'updated_at': cfg.updated_at.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_queue(request):
    """GET /api/v1/photos/admin/queue/ — pending photos for moderation."""
    if not _is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)

    status_filter = request.query_params.get('status', 'pending')
    qs = Photo.objects.filter(status=status_filter).select_related('uploader', 'session')

    return Response({
        'photos': [
            {
                'id': p.id,
                'image_url': request.build_absolute_uri(p.image.url),
                'caption': p.caption,
                'uploader': p.uploader.get_full_name() or p.uploader.email,
                'uploader_email': p.uploader.email,
                'session_title': p.session.title if p.session else None,
                'status': p.status,
                'rejected_reason': p.rejected_reason,
                'created_at': p.created_at.isoformat(),
            }
            for p in qs
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_review(request, pk):
    """
    POST /api/v1/photos/admin/<pk>/review/
    Body: { action: 'approve'|'reject', reason: '' }
    """
    if not _is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)

    try:
        photo = Photo.objects.get(pk=pk)
    except Photo.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    action = request.data.get('action')
    if action == 'approve':
        photo.status = Photo.Status.APPROVED
        photo.rejected_reason = ''
    elif action == 'reject':
        photo.status = Photo.Status.REJECTED
        photo.rejected_reason = request.data.get('reason', '')[:200]
    else:
        return Response({'error': 'action must be approve or reject'}, status=400)

    photo.reviewed_by = request.user
    photo.reviewed_at = timezone.now()
    photo.save()

    # Award leaderboard points on first approval
    if action == 'approve':
        try:
            already = Photo.objects.filter(
                uploader=photo.uploader,
                status=Photo.Status.APPROVED,
            ).exclude(pk=photo.pk).exists()
            if not already:
                from apps.leaderboard.utils import award_points
                from apps.leaderboard.models import PointAction
                award_points(photo.uploader, PointAction.PHOTO_UPLOAD, 'Photo approved')
        except Exception:
            pass

    return Response({'id': photo.id, 'status': photo.status})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete(request, pk):
    """DELETE /api/v1/photos/admin/<pk>/delete/"""
    if not _is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        Photo.objects.get(pk=pk).delete()
    except Photo.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    return Response({'success': True})
