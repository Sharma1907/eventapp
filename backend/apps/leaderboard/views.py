from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.checkins.models import CheckIn
from .models import UserPoints, PointEntry


def _checked_in_user_ids():
    return CheckIn.objects.filter(
        checkin_type='conference'
    ).values_list('user_id', flat=True)


def _eligible_qs():
    return UserPoints.objects.select_related('user').filter(
        user__role='participant',
        user_id__in=_checked_in_user_ids(),
    ).order_by('-total_points', 'updated_at', 'user__first_name', 'user__last_name', 'user_id')


def _photo_url(user, request):
    if user.profile_photo:
        return request.build_absolute_uri(user.profile_photo.url)
    return None


def _serialise_entry(entry, rank, request, is_me=False):
    u = entry.user
    return {
        'rank': rank,
        'user_id': str(u.id),
        'name': u.get_full_name() or u.email.split('@')[0],
        'email': u.email,
        'points': entry.total_points,
        'affiliation': u.affiliation or '',
        'profile_photo_url': _photo_url(u, request),
        'is_me': is_me,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_points(request):
    """
    Return current user's total points, checked-in leaderboard rank,
    recent activity and score breakdown.
    """
    summary, _ = UserPoints.objects.get_or_create(user=request.user)
    eligible = CheckIn.objects.filter(
        user=request.user,
        checkin_type='conference',
    ).exists()

    total = summary.total_points
    rank = summary.rank if eligible else 0

    higher = None
    if eligible:
        higher = _eligible_qs().filter(total_points__gt=total).first()

    recent = PointEntry.objects.filter(user=request.user)[:15]
    history = [
        {
            'action': e.action,
            'action_display': e.get_action_display(),
            'points': e.points,
            'note': e.note,
            'date': e.created_at.isoformat(),
        }
        for e in recent
    ]

    breakdown = {}
    agg = PointEntry.objects.filter(user=request.user).values('action').annotate(total=Sum('points'))
    for row in agg:
        breakdown[row['action']] = row['total']

    return Response({
        'eligible': eligible,
        'total_points': total,
        'rank': rank,
        'next_rank_points': higher.total_points if higher else None,
        'next_rank_name': (higher.user.get_full_name() or higher.user.email.split('@')[0]) if higher else None,
        'next_gap': (higher.total_points - total) if higher else 0,
        'history': history,
        'breakdown': breakdown,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """
    Top 50 checked-in participants by points.
    Ties share the same rank.
    """
    top = list(_eligible_qs()[:50])

    data = []
    prev_points = None
    prev_rank = 0
    for idx, entry in enumerate(top, start=1):
        rank = prev_rank if prev_points == entry.total_points else idx
        prev_rank = rank
        prev_points = entry.total_points
        data.append(_serialise_entry(entry, rank, request, is_me=(entry.user_id == request.user.id)))

    my_summary, _ = UserPoints.objects.get_or_create(user=request.user)
    my_eligible = CheckIn.objects.filter(user=request.user, checkin_type='conference').exists()
    my_rank = my_summary.rank if my_eligible else 0
    my_entry = None
    if my_eligible:
        my_entry = _serialise_entry(my_summary, my_rank, request, is_me=True)

    return Response({
        'leaderboard': data,
        'my_rank': my_rank,
        'my_points': my_summary.total_points,
        'my_in_top': any(d['is_me'] for d in data),
        'my_entry': my_entry,
        'total_participants': _eligible_qs().count(),
    })
