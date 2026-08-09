from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Avg, Count

from .models import (
    ScheduleSession, SessionBookmark,
    FeedbackForm, FeedbackQuestion, FeedbackResponse, FeedbackAnswer
)
from django.utils.dateparse import parse_datetime

def _parse_dt(val):
    """Parse datetime string to aware datetime."""
    if not val:
        return None
    if isinstance(val, str):
        from django.utils import timezone
        dt = parse_datetime(val)
        if dt and dt.tzinfo is None:
            dt = timezone.make_aware(dt)
        return dt
    return val

from .serializers import (
    SessionListSerializer, SessionDetailSerializer,
    BookmarkSerializer, FeedbackFormSerializer,
    FeedbackSubmitSerializer, FeedbackResponseSerializer
)


# ── Schedule ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def session_list(request):
    """
    GET /api/v1/schedule/sessions/
    ?day=1|2|3  — filter by day
    ?featured=1 — only featured
    Returns published sessions with bookmark state for auth users.
    """
    qs = ScheduleSession.objects.filter(is_published=True).prefetch_related('sub_sessions','bookmarks')
    day = request.query_params.get('day')
    if day:
        qs = qs.filter(day=day)
    if request.query_params.get('featured'):
        qs = qs.filter(is_featured=True)
    data = SessionListSerializer(qs, many=True, context={'request': request}).data
    return Response({'sessions': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def session_detail(request, pk):
    """GET /api/v1/schedule/sessions/<pk>/"""
    try:
        sess = ScheduleSession.objects.prefetch_related('sub_sessions','bookmarks').get(pk=pk, is_published=True)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    return Response(SessionDetailSerializer(sess, context={'request': request}).data)


# ── Bookmarks ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, pk):
    """
    POST /api/v1/schedule/sessions/<pk>/bookmark/
    Body: { reminder_minutes: 5|15|30|60 }
    Toggles bookmark. Returns { bookmarked: bool, reminder_minutes: int }
    """
    try:
        sess = ScheduleSession.objects.get(pk=pk, is_published=True)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    bm = SessionBookmark.objects.filter(user=request.user, session=sess).first()
    if bm:
        bm.delete()
        return Response({'bookmarked': False, 'reminder_minutes': None})

    reminder = int(request.data.get('reminder_minutes', 5))
    if reminder not in [5, 15, 30, 60]:
        reminder = 5
    bm = SessionBookmark.objects.create(user=request.user, session=sess, reminder_minutes=reminder)
    return Response({'bookmarked': True, 'reminder_minutes': bm.reminder_minutes})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_reminder(request, pk):
    """
    PATCH /api/v1/schedule/sessions/<pk>/reminder/
    Body: { reminder_minutes: 5|15|30|60 }
    """
    bm = SessionBookmark.objects.filter(user=request.user, session__pk=pk).first()
    if not bm:
        return Response({'error': 'Bookmark not found'}, status=404)
    reminder = int(request.data.get('reminder_minutes', 5))
    if reminder not in [5, 15, 30, 60]:
        return Response({'error': 'Invalid reminder'}, status=400)
    bm.reminder_minutes = reminder
    bm.reminder_sent = False  # reset so it fires again at new time
    bm.save()
    return Response({'reminder_minutes': bm.reminder_minutes})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookmarks(request):
    """GET /api/v1/schedule/bookmarks/ — user's bookmarked sessions."""
    bms = SessionBookmark.objects.filter(user=request.user).select_related('session').prefetch_related('session__sub_sessions','session__bookmarks')
    data = BookmarkSerializer(bms, many=True, context={'request': request}).data
    return Response({'bookmarks': data})


# ── Feedback ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feedback_form(request, pk):
    """
    GET /api/v1/schedule/sessions/<pk>/feedback/
    Returns form + questions. Only if feedback is open and user is checked in.
    """
    try:
        sess = ScheduleSession.objects.get(pk=pk, is_published=True)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    # Must be checked in
    from apps.checkins.models import CheckIn
    if not CheckIn.objects.filter(user=request.user, checkin_type='conference').exists():
        return Response({'error': 'Check-in required to submit feedback'}, status=403)

    if not sess.feedback_open:
        return Response({'error': 'Feedback is not open for this session'}, status=403)

    try:
        form = sess.feedback_form
    except FeedbackForm.DoesNotExist:
        return Response({'error': 'No feedback form configured'}, status=404)

    already = FeedbackResponse.objects.filter(user=request.user, session=sess).exists()
    return Response({
        'form': FeedbackFormSerializer(form).data,
        'already_submitted': already,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_feedback(request, pk):
    """
    POST /api/v1/schedule/sessions/<pk>/feedback/
    Body: { answers: [{question_id, rating_value?, boolean_value?, text_value?}] }
    """
    try:
        sess = ScheduleSession.objects.get(pk=pk, is_published=True)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    # Must be checked in
    from apps.checkins.models import CheckIn
    if not CheckIn.objects.filter(user=request.user, checkin_type='conference').exists():
        return Response({'error': 'Check-in required'}, status=403)

    if not sess.feedback_open:
        return Response({'error': 'Feedback is not open'}, status=403)

    if FeedbackResponse.objects.filter(user=request.user, session=sess).exists():
        return Response({'error': 'Already submitted'}, status=400)

    try:
        form = sess.feedback_form
    except FeedbackForm.DoesNotExist:
        return Response({'error': 'No feedback form'}, status=404)

    ser = FeedbackSubmitSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    # Validate required questions answered
    questions = {q.id: q for q in form.questions.all()}
    answered  = {a['question_id'] for a in ser.validated_data['answers']}
    for qid, q in questions.items():
        if q.is_required and qid not in answered:
            return Response({'error': f'Question {qid} is required'}, status=400)

    resp = FeedbackResponse.objects.create(session=sess, form=form, user=request.user)

    # Award leaderboard points for feedback
    try:
        from apps.leaderboard.utils import award_points
        from apps.leaderboard.models import PointAction
        award_points(request.user, PointAction.FEEDBACK, f'Feedback: {sess.title[:50]}')
    except Exception:
        pass  # Silent fail — points are bonus, not critical
    for ans in ser.validated_data['answers']:
        qid = ans['question_id']
        if qid not in questions:
            continue
        FeedbackAnswer.objects.create(
            response=resp,
            question_id=qid,
            rating_value=ans.get('rating_value'),
            boolean_value=ans.get('boolean_value'),
            text_value=ans.get('text_value', ''),
        )

    return Response({'success': True, 'message': 'Thank you for your feedback!'})


# ── Admin API ─────────────────────────────────────────────────────────────────

def _require_admin(user):
    return user.is_authenticated and user.role in ('super_admin', 'mgmt_admin', 'team_head', 'staff')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_session_list(request):
    """GET /api/v1/schedule/admin/sessions/ — all sessions including unpublished."""
    if not _require_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    qs = ScheduleSession.objects.prefetch_related('sub_sessions').all()
    day = request.query_params.get('day')
    if day:
        qs = qs.filter(day=day)
    return Response({'sessions': SessionDetailSerializer(qs, many=True, context={'request': request}).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_session_create(request):
    """POST /api/v1/schedule/admin/sessions/"""
    if not _require_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    data = request.data
    try:
        sess = ScheduleSession.objects.create(
            day=data['day'],
            title=data['title'],
            session_type=data.get('session_type','technical'),
            start_datetime=_parse_dt(data['start_datetime']),
            end_datetime=_parse_dt(data['end_datetime']),
            room=data.get('room',''),
            description=data.get('description',''),
            is_featured=data.get('is_featured', False),
            is_parallel=data.get('is_parallel', False),
            is_published=data.get('is_published', True),
            feedback_enabled=data.get('feedback_enabled', False),
            feedback_auto_open=data.get('feedback_auto_open', True),
            display_order=data.get('display_order', 0),
        )
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    return Response(SessionDetailSerializer(sess, context={'request': request}).data, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_session_update(request, pk):
    """PATCH /api/v1/schedule/admin/sessions/<pk>/"""
    if not _require_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        sess = ScheduleSession.objects.get(pk=pk)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    fields = [
        'day','title','session_type','start_datetime','end_datetime','room',
        'description','is_featured','is_parallel','is_published',
        'feedback_enabled','feedback_auto_open','feedback_manual_open','display_order'
    ]
    dt_fields = ('start_datetime', 'end_datetime')
    for f in fields:
        if f in request.data:
            val = request.data[f]
            if f in dt_fields:
                val = _parse_dt(val)
            setattr(sess, f, val)
    sess.save()
    return Response(SessionDetailSerializer(sess, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_session_delete(request, pk):
    """DELETE /api/v1/schedule/admin/sessions/<pk>/"""
    if not _require_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        ScheduleSession.objects.get(pk=pk).delete()
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_toggle_feedback(request, pk):
    """
    POST /api/v1/schedule/admin/sessions/<pk>/feedback-toggle/
    Manually open or close feedback.
    """
    if not _require_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        sess = ScheduleSession.objects.get(pk=pk)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    sess.feedback_manual_open = not sess.feedback_manual_open
    sess.save()
    return Response({'feedback_manual_open': sess.feedback_manual_open, 'feedback_open': sess.feedback_open})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_feedback_analytics(request, pk):
    """
    GET /api/v1/schedule/admin/sessions/<pk>/feedback-analytics/
    Returns aggregate stats + individual responses.
    """
    if not _require_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        sess = ScheduleSession.objects.get(pk=pk)
    except ScheduleSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    responses = FeedbackResponse.objects.filter(session=sess).prefetch_related('answers__question')
    total = responses.count()

    # Per-question aggregates
    try:
        questions = sess.feedback_form.questions.all()
    except FeedbackForm.DoesNotExist:
        questions = []

    q_stats = []
    for q in questions:
        stat = {'id': q.id, 'text': q.question_text, 'type': q.question_type}
        if q.question_type == 'rating':
            agg = FeedbackAnswer.objects.filter(question=q).aggregate(avg=Avg('rating_value'))
            stat['avg_rating'] = round(agg['avg'], 2) if agg['avg'] else None
        elif q.question_type == 'boolean':
            yes = FeedbackAnswer.objects.filter(question=q, boolean_value=True).count()
            stat['yes_count'] = yes
            stat['no_count']  = total - yes
            stat['yes_pct']   = round((yes / total * 100), 1) if total else 0
        q_stats.append(stat)

    individual = FeedbackResponseSerializer(responses, many=True).data

    return Response({
        'session_title': sess.title,
        'total_responses': total,
        'question_stats': q_stats,
        'responses': individual,
    })
