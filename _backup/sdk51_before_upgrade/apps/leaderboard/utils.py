from django.db import transaction
from .models import PointEntry, UserPoints, POINT_VALUES


def award_points(user, action, note=''):
    """
    Award points to a user for an action.
    Creates PointEntry + updates UserPoints total.
    Returns (point_entry, user_points) or None if action unknown.
    """
    pts = POINT_VALUES.get(action)
    if pts is None:
        return None

    with transaction.atomic():
        entry = PointEntry.objects.create(
            user=user, action=action, points=pts, note=note,
        )
        summary, _ = UserPoints.objects.get_or_create(user=user)
        summary.total_points = (summary.total_points or 0) + pts
        summary.save(update_fields=['total_points', 'updated_at'])

    return entry, summary
