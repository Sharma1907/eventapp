from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserPoints, PointEntry


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_points(request):
    """Return current user's total points, rank, and recent activity."""
    summary, _ = UserPoints.objects.get_or_create(user=request.user)
    total = summary.total_points
    rank = summary.rank  # 1-based, always >= 1 once row exists

    recent = PointEntry.objects.filter(user=request.user)[:10]
    history = [
        {
            'action': e.get_action_display(),
            'points': e.points,
            'note': e.note,
            'date': e.created_at.isoformat(),
        }
        for e in recent
    ]

    return Response({
        'total_points': total,
        'rank': rank,
        'history': history,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Top 50 users by points."""
    top = UserPoints.objects.select_related('user').filter(user__role='participant').order_by('-total_points')[:50]
    return Response({
        'leaderboard': [
            {
                'rank': i + 1,
                'name': entry.user.get_full_name() or entry.user.email,
                'points': entry.total_points,
                'affiliation': entry.user.affiliation,
            }
            for i, entry in enumerate(top)
        ],
    })
