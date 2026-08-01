import uuid
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import (
    ConnectionRequest, Conversation, Message, MessageReaction,
    MessageReport, BlockedUser, TOPIC_CHOICES, REACTION_CHOICES,
)

User = get_user_model()


# ── Public media URL helper ────────────────────────────────────────────────

def _public_media_url(request, path):
    if not path:
        return None
    public_origin = (
        request.headers.get('x-public-origin')
        or request.META.get('HTTP_X_PUBLIC_ORIGIN')
        or ''
    ).strip()
    if public_origin:
        return public_origin.rstrip('/') + path
    try:
        return request.build_absolute_uri(path)
    except Exception:
        return path


# ── Push notification helper ───────────────────────────────────────────────

def _send_push(to_user, title, body, data=None):
    """Send push notification WITHOUT creating Notification/UserNotification records.
    Chat messages should not appear in the notifications list."""
    try:
        from apps.notifications.models import DeviceToken
        from apps.notifications.fcm import _send_hybrid

        tokens = list(
            DeviceToken.objects.filter(user=to_user, is_active=True)
            .values_list('token', flat=True)
        )
        if not tokens:
            return

        push_data = data or {}
        push_data['silent_push'] = 'true'  # marker so app knows not to store

        success, failed, bad = _send_hybrid(tokens, title, body, push_data)
        if bad:
            DeviceToken.objects.filter(token__in=bad).update(is_active=False)

    except Exception as e:
        import logging
        logging.getLogger(__name__).error('Chat push error: %s', e)


def _is_blocked(user_a, user_b):
    return BlockedUser.objects.filter(
        Q(blocker=user_a, blocked=user_b) | Q(blocker=user_b, blocked=user_a)
    ).exists()


# ── Helpers ────────────────────────────────────────────────────────────────

def _user_brief(user, request):
    photo = None
    if user.profile_photo:
        try:
            photo = _public_media_url(request, user.profile_photo.url)
        except Exception:
            pass
    interests = [t.strip() for t in (user.research_interests or '').split(',') if t.strip()]
    return {
        'id':                    str(user.id),
        'name':                  user.get_full_name(),
        'first_name':            user.first_name,
        'last_name':             user.last_name,
        'email':                 user.email,
        'designation':           user.designation or '',
        'affiliation':           user.affiliation or '',
        'role':                  user.role,
        'profile_photo_url':     photo,
        'research_interests':    user.research_interests or '',
        'research_interest_list': interests,
    }


def _reaction_data(reactions):
    grouped = {}
    for r in reactions:
        emoji = dict(REACTION_CHOICES).get(r.reaction, r.reaction)
        if emoji not in grouped:
            grouped[emoji] = {'emoji': emoji, 'key': r.reaction, 'count': 0, 'user_ids': []}
        grouped[emoji]['count'] += 1
        grouped[emoji]['user_ids'].append(str(r.user_id))
    return list(grouped.values())


def _message_data(msg, request):
    image_url = None
    if msg.image:
        try:
            image_url = request.build_absolute_uri(msg.image.url)
        except Exception:
            pass

    reply_data = None
    if msg.reply_to and not msg.reply_to.is_deleted:
        reply_data = {
            'id':           str(msg.reply_to.id),
            'sender_id':    str(msg.reply_to.sender_id),
            'sender_name':  msg.reply_to.sender.get_full_name(),
            'content':      msg.reply_to.content[:80] if msg.reply_to.content else '',
            'message_type': msg.reply_to.message_type,
        }

    reactions = _reaction_data(msg.reactions.select_related('user').all()) if hasattr(msg, '_prefetched_objects_cache') else _reaction_data(msg.reactions.all())

    return {
        'id':           str(msg.id),
        'sender_id':    str(msg.sender_id),
        'content':      '' if msg.is_deleted else msg.content,
        'image_url':    None if msg.is_deleted else image_url,
        'message_type': msg.message_type,
        'reply_to':     reply_data,
        'reactions':    reactions,
        'delivered':    msg.delivered,
        'read':         msg.read,
        'read_at':      msg.read_at.isoformat() if msg.read_at else None,
        'is_deleted':   msg.is_deleted,
        'created_at':   msg.created_at.isoformat(),
    }


def _conversation_data(conv, user, request):
    other = conv.other_participant(user)
    last_msg = conv.messages.filter(is_deleted=False).order_by('-created_at').first()
    unread = conv.unread_count_for(user)
    return {
        'id':             str(conv.id),
        'topic':          conv.topic,
        'topic_display':  conv.topic_display,
        'other_user':     _user_brief(other, request),
        'last_message':   _message_data(last_msg, request) if last_msg else None,
        'unread_count':   unread,
        'is_muted':       conv.is_muted_by(user),
        'created_at':     conv.created_at.isoformat(),
        'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None,
    }


# ── Connection Requests ────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_request(request):
    receiver_id  = request.data.get('receiver_id', '').strip()
    request_type = request.data.get('request_type', 'contact')
    topic        = request.data.get('topic', 'networking')
    custom_topic = request.data.get('custom_topic', '').strip()
    message      = request.data.get('message', '').strip()

    if not receiver_id:
        return Response({'error': 'receiver_id is required'}, status=400)
    if request_type not in ('contact', 'speaker'):
        return Response({'error': 'request_type must be contact or speaker'}, status=400)
    valid_topics = [t[0] for t in TOPIC_CHOICES]
    if topic not in valid_topics:
        return Response({'error': 'invalid topic'}, status=400)
    if topic == 'other' and not custom_topic:
        return Response({'error': 'custom_topic required when topic is other'}, status=400)

    try:
        receiver = User.objects.get(id=receiver_id, is_active=True)
    except (User.DoesNotExist, ValueError):
        return Response({'error': 'User not found'}, status=404)

    if receiver == request.user:
        return Response({'error': 'Cannot send request to yourself'}, status=400)

    if _is_blocked(request.user, receiver):
        return Response({'error': 'Cannot connect with this user.'}, status=403)

    # Check existing conversation
    existing_conv = Conversation.objects.filter(
        Q(participant_a=request.user, participant_b=receiver) |
        Q(participant_a=receiver, participant_b=request.user)
    ).first()
    if existing_conv:
        return Response({
            'already_connected': True,
            'conversation_id': str(existing_conv.id),
            'message': 'You are already connected.',
        })

    # Clean orphaned accepted requests
    ConnectionRequest.objects.filter(
        Q(sender=request.user, receiver=receiver) |
        Q(sender=receiver, receiver=request.user),
        status='accepted',
    ).exclude(
        id__in=Conversation.objects.values_list('request_id', flat=True)
    ).update(status='declined')

    # Block duplicate pending
    existing_pending = ConnectionRequest.objects.filter(
        Q(sender=request.user, receiver=receiver) |
        Q(sender=receiver, receiver=request.user),
        status__in=['pending', 'accepted']
    ).first()
    if existing_pending:
        if existing_pending.status == 'accepted':
            has_conv = Conversation.objects.filter(request=existing_pending).exists()
            if not has_conv:
                existing_pending.status = 'declined'
                existing_pending.save(update_fields=['status'])
            else:
                return Response({'error': 'You are already connected.', 'status': 'accepted'}, status=400)
        else:
            return Response({'error': 'A pending request already exists.', 'status': existing_pending.status}, status=400)

    req = ConnectionRequest.objects.create(
        sender=request.user, receiver=receiver,
        request_type=request_type, topic=topic,
        custom_topic=custom_topic, message=message, status='pending',
    )

    sender_name = request.user.get_full_name() or request.user.email
    if request_type == 'speaker':
        push_title = f'Discussion Request from {sender_name}'
        push_body  = f'Topic: {req.topic_display}. Tap to review.'
    else:
        push_title = f'{sender_name} sent you a Contact Card'
        push_body  = f'Topic: {req.topic_display}. Accept to start chatting.'
    _send_push(receiver, push_title, push_body, {'type': 'connection_request', 'request_id': str(req.id)})

    return Response({'success': True, 'request_id': str(req.id), 'message': 'Request sent.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inbox(request):
    reqs = ConnectionRequest.objects.filter(
        receiver=request.user, status='pending'
    ).select_related('sender').order_by('-created_at')
    data = [{
        'id':            str(r.id),
        'sender':        _user_brief(r.sender, request),
        'request_type':  r.request_type,
        'topic':         r.topic,
        'topic_display': r.topic_display,
        'custom_topic':  r.custom_topic,
        'message':       r.message,
        'created_at':    r.created_at.isoformat(),
    } for r in reqs]
    return Response({'requests': data, 'count': len(data)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sent_requests(request):
    reqs = ConnectionRequest.objects.filter(
        sender=request.user
    ).select_related('receiver').order_by('-created_at')
    data = [{
        'id':            str(r.id),
        'receiver':      _user_brief(r.receiver, request),
        'request_type':  r.request_type,
        'topic':         r.topic,
        'topic_display': r.topic_display,
        'custom_topic':  r.custom_topic,
        'message':       r.message,
        'status':        r.status,
        'created_at':    r.created_at.isoformat(),
        'responded_at':  r.responded_at.isoformat() if r.responded_at else None,
    } for r in reqs]
    return Response({'requests': data, 'count': len(data)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_request(request, request_id):
    action = request.data.get('action', '').strip()
    if action not in ('accepted', 'declined', 'later'):
        return Response({'error': 'action must be accepted, declined, or later'}, status=400)
    try:
        req = ConnectionRequest.objects.get(id=request_id, receiver=request.user)
    except ConnectionRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=404)
    if req.status not in ('pending', 'later'):
        return Response({'error': f'Request is already {req.status}'}, status=400)

    req.status = action
    req.responded_at = timezone.now()
    req.save(update_fields=['status', 'responded_at'])

    conversation_id = None
    if action == 'accepted':
        conv = Conversation.objects.create(
            request=req, participant_a=req.sender, participant_b=req.receiver,
            topic=req.topic, custom_topic=req.custom_topic,
        )
        conversation_id = str(conv.id)
        _send_push(req.sender, f'{req.receiver.get_full_name()} accepted your request',
                    f'You can now chat about {req.topic_display}.',
                    {'type': 'request_accepted', 'conversation_id': conversation_id})

    return Response({'success': True, 'status': action, 'conversation_id': conversation_id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_request(request, request_id):
    try:
        req = ConnectionRequest.objects.get(id=request_id, sender=request.user, status='pending')
    except ConnectionRequest.DoesNotExist:
        return Response({'error': 'Request not found or not pending'}, status=404)
    req.delete()
    return Response({'success': True, 'message': 'Request withdrawn.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def request_counts(request):
    pending = ConnectionRequest.objects.filter(receiver=request.user, status='pending').count()
    return Response({'pending_count': pending})


# ── Conversations ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_list(request):
    convs = Conversation.objects.filter(
        Q(participant_a=request.user) | Q(participant_b=request.user)
    ).select_related('participant_a', 'participant_b').prefetch_related('messages').order_by('-last_message_at', '-created_at')

    total_unread = sum(c.unread_count_for(request.user) for c in convs)
    return Response({
        'conversations': [_conversation_data(c, request.user, request) for c in convs],
        'total_unread':  total_unread,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_detail(request, conversation_id):
    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)
    return Response(_conversation_data(conv, request.user, request))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_mute(request, conversation_id):
    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if conv.participant_a == request.user:
        conv.muted_by_a = not conv.muted_by_a
        conv.save(update_fields=['muted_by_a'])
        return Response({'success': True, 'muted': conv.muted_by_a})
    else:
        conv.muted_by_b = not conv.muted_by_b
        conv.save(update_fields=['muted_by_b'])
        return Response({'success': True, 'muted': conv.muted_by_b})


# ── Messages ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def message_list(request, conversation_id):
    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

    msgs = conv.messages.select_related('sender', 'reply_to', 'reply_to__sender').prefetch_related('reactions').order_by('created_at')
    return Response({
        'messages':     [_message_data(m, request) for m in msgs],
        'conversation': _conversation_data(conv, request.user, request),
        'my_user_id':   str(request.user.id),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def send_message(request, conversation_id):
    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

    content    = request.data.get('content', '').strip()
    image      = request.FILES.get('image')
    reply_to_id = request.data.get('reply_to', '').strip() if isinstance(request.data.get('reply_to', ''), str) else request.data.get('reply_to')

    if not content and not image:
        return Response({'error': 'content or image required'}, status=400)

    msg_type = 'image' if image else 'text'
    reply_to = None
    if reply_to_id:
        try:
            reply_to = Message.objects.get(id=reply_to_id, conversation=conv)
        except (Message.DoesNotExist, ValueError):
            pass

    msg = Message.objects.create(
        conversation=conv, sender=request.user,
        content=content, image=image, message_type=msg_type,
        reply_to=reply_to, delivered=True,
    )
    conv.last_message_at = msg.created_at
    conv.save(update_fields=['last_message_at'])

    other = conv.other_participant(request.user)
    if not conv.is_muted_by(other):
        sender_name = request.user.get_full_name() or request.user.email
        push_body = f'{sender_name} sent a photo' if msg.message_type == 'image' else (msg.content[:100] or '')
        _send_push(other, sender_name, push_body, {'type': 'new_message', 'conversation_id': str(conv.id)})

    return Response({'success': True, 'message': _message_data(msg, request)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_message(request, conversation_id, message_id):
    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
        msg = Message.objects.get(id=message_id, conversation=conv, sender=request.user)
    except (Conversation.DoesNotExist, Message.DoesNotExist):
        return Response({'error': 'Not found'}, status=404)
    msg.is_deleted = True
    msg.content = ''
    msg.save(update_fields=['is_deleted', 'content'])
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, conversation_id):
    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    now = timezone.now()
    updated = Message.objects.filter(
        conversation=conv, read=False
    ).exclude(sender=request.user).update(read=True, read_at=now)
    return Response({'success': True, 'marked_read': updated})


# ── Reactions ──────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reaction(request, conversation_id, message_id):
    reaction_key = request.data.get('reaction', '').strip()
    valid_keys = [r[0] for r in REACTION_CHOICES]
    if reaction_key not in valid_keys:
        return Response({'error': f'Invalid reaction. Use: {valid_keys}'}, status=400)

    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
        msg = Message.objects.get(id=message_id, conversation=conv)
    except (Conversation.DoesNotExist, Message.DoesNotExist):
        return Response({'error': 'Not found'}, status=404)

    existing = MessageReaction.objects.filter(message=msg, user=request.user).first()
    if existing:
        if existing.reaction == reaction_key:
            existing.delete()
            return Response({'success': True, 'action': 'removed'})
        else:
            existing.reaction = reaction_key
            existing.save(update_fields=['reaction'])
            return Response({'success': True, 'action': 'changed'})
    else:
        MessageReaction.objects.create(message=msg, user=request.user, reaction=reaction_key)
        return Response({'success': True, 'action': 'added'})


# ── Report ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_message(request, conversation_id, message_id):
    reason = request.data.get('reason', 'other').strip()
    detail = request.data.get('detail', '').strip()

    try:
        conv = Conversation.objects.get(
            Q(participant_a=request.user) | Q(participant_b=request.user), id=conversation_id
        )
        msg = Message.objects.get(id=message_id, conversation=conv)
    except (Conversation.DoesNotExist, Message.DoesNotExist):
        return Response({'error': 'Not found'}, status=404)

    if msg.sender == request.user:
        return Response({'error': 'Cannot report your own message'}, status=400)

    report, created = MessageReport.objects.get_or_create(
        message=msg, reporter=request.user,
        defaults={'reason': reason, 'detail': detail}
    )
    return Response({'success': True, 'created': created})


# ── Block ──────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request):
    user_id = request.data.get('user_id', '').strip()
    try:
        target = User.objects.get(id=user_id, is_active=True)
    except (User.DoesNotExist, ValueError):
        return Response({'error': 'User not found'}, status=404)

    if target == request.user:
        return Response({'error': 'Cannot block yourself'}, status=400)

    obj, created = BlockedUser.objects.get_or_create(blocker=request.user, blocked=target)
    return Response({'success': True, 'blocked': True, 'created': created})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request):
    user_id = request.data.get('user_id', '').strip()
    BlockedUser.objects.filter(blocker=request.user, blocked_id=user_id).delete()
    return Response({'success': True, 'blocked': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def blocked_list(request):
    blocks = BlockedUser.objects.filter(blocker=request.user).select_related('blocked')
    return Response({
        'blocked': [{'id': str(b.blocked_id), 'name': b.blocked.get_full_name(), 'email': b.blocked.email} for b in blocks]
    })


# ── Check Connection ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_connection(request, user_id):
    try:
        other = User.objects.get(id=user_id, is_active=True)
    except (User.DoesNotExist, ValueError):
        return Response({'error': 'User not found'}, status=404)

    if _is_blocked(request.user, other):
        return Response({'status': 'blocked', 'conversation_id': None, 'request_id': None})

    conv = Conversation.objects.filter(
        Q(participant_a=request.user, participant_b=other) |
        Q(participant_a=other, participant_b=request.user)
    ).first()
    if conv:
        return Response({'status': 'connected', 'conversation_id': str(conv.id), 'request_id': None})

    # Clean orphaned
    ConnectionRequest.objects.filter(
        Q(sender=request.user, receiver=other) | Q(sender=other, receiver=request.user),
        status='accepted',
    ).exclude(
        id__in=Conversation.objects.values_list('request_id', flat=True)
    ).update(status='declined')

    req = ConnectionRequest.objects.filter(
        Q(sender=request.user, receiver=other) | Q(sender=other, receiver=request.user),
        status__in=['pending', 'later']
    ).first()
    if req:
        direction = 'pending_sent' if req.sender == request.user else 'pending_received'
        return Response({'status': direction, 'conversation_id': None, 'request_id': str(req.id)})

    return Response({'status': 'none', 'conversation_id': None, 'request_id': None})


# ── Connection Count ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connection_count(request):
    count = Conversation.objects.filter(
        Q(participant_a=request.user) | Q(participant_b=request.user)
    ).count()
    return Response({'count': count})
