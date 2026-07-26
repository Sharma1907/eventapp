"""
Push notification service using Expo Push API.
Creates UserNotification records for tracking.
"""
import logging
import json
import urllib.request
import urllib.error
from django.utils import timezone

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


def _send_expo_batch(messages):
    payload = json.dumps(messages).encode('utf-8')
    req = urllib.request.Request(
        EXPO_PUSH_URL,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result.get('data', [])
    except urllib.error.URLError as e:
        logger.error(f"Expo push request failed: {e}")
        return []


def send_to_tokens(tokens_with_users, title, body, data=None, notification_obj=None):
    """
    Send to list of (token, user) tuples.
    Creates UserNotification records for tracking.
    Returns: (success_count, failure_count, failed_tokens)
    """
    from .models import UserNotification

    if not tokens_with_users:
        return 0, 0, []

    # Filter valid Expo tokens
    valid = [(t, u) for t, u in tokens_with_users if t.startswith('ExponentPushToken[') or t.startswith('ExpoPushToken[')]
    skipped = len(tokens_with_users) - len(valid)

    if not valid:
        return 0, len(tokens_with_users), [t for t, u in tokens_with_users]

    success_count = 0
    failure_count = skipped
    failed_tokens = []
    now = timezone.now()

    for i in range(0, len(valid), 100):
        batch = valid[i:i + 100]
        messages = [{
            'to': token,
            'title': title,
            'body': body,
            'data': {**(data or {}), 'notification_id': str(notification_obj.id) if notification_obj else ''},
            'sound': 'default',
            'priority': 'high',
            'channelId': 'default',
        } for token, user in batch]

        tickets = _send_expo_batch(messages)

        for j, ticket in enumerate(tickets):
            token, user = batch[j]
            delivered = ticket.get('status') == 'ok'

            if delivered:
                success_count += 1
            else:
                failure_count += 1
                failed_tokens.append(token)

            # Create UserNotification record
            if notification_obj and user:
                UserNotification.objects.update_or_create(
                    notification=notification_obj,
                    user=user,
                    defaults={
                        'delivered': delivered,
                        'delivered_at': now if delivered else None,
                    }
                )

        if len(tickets) < len(batch):
            failure_count += len(batch) - len(tickets)

    return success_count, failure_count, failed_tokens


def send_to_all(title, body, data=None, notification_obj=None):
    from .models import DeviceToken
    tokens_with_users = list(
        DeviceToken.objects.filter(is_active=True)
        .select_related('user')
        .values_list('token', 'user')
    )
    # Convert to (token, user_obj) — need full user object
    from apps.accounts.models import User
    result = []
    for token, user_id in tokens_with_users:
        try:
            user = User.objects.get(id=user_id)
            result.append((token, user))
        except User.DoesNotExist:
            result.append((token, None))
    return send_to_tokens(result, title, body, data, notification_obj)


def send_to_role(role, title, body, data=None, notification_obj=None):
    from .models import DeviceToken
    from apps.accounts.models import User
    tokens_with_users = list(
        DeviceToken.objects.filter(is_active=True, user__role=role)
        .select_related('user')
        .values_list('token', 'user')
    )
    result = []
    for token, user_id in tokens_with_users:
        try:
            user = User.objects.get(id=user_id)
            result.append((token, user))
        except User.DoesNotExist:
            result.append((token, None))
    return send_to_tokens(result, title, body, data, notification_obj)


def send_to_user(user, title, body, data=None, notification_obj=None):
    from .models import DeviceToken
    tokens = list(DeviceToken.objects.filter(is_active=True, user=user).values_list('token', flat=True))
    tokens_with_users = [(t, user) for t in tokens]
    return send_to_tokens(tokens_with_users, title, body, data, notification_obj)
