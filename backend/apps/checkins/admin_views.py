import json as _json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone as _tz
from django.utils.timezone import localdate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CheckIn, MealPass, MealWindow

User = get_user_model()
SCANNER_ROLES = {'super_admin', 'mgmt_admin', 'team_head', 'staff'}


def _require_scanner(view_fn):
    @login_required(login_url='/panel/login/')
    def wrapper(request, *args, **kwargs):
        if request.user.role not in SCANNER_ROLES:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden('Not authorised.')
        return view_fn(request, *args, **kwargs)
    return wrapper


@_require_scanner
def scanner_view(request):
    return render(request, 'panel/scanner.html', {})


@_require_scanner
def checkin_list_view(request):
    search = request.GET.get('search', '').strip()
    tab    = request.GET.get('tab', 'checked_in')
    today  = localdate()

    checkins = CheckIn.objects.filter(
        checkin_type='conference'
    ).select_related('user', 'scanned_by').order_by('-scanned_at')

    checked_in_ids = CheckIn.objects.filter(
        checkin_type='conference'
    ).values_list('user_id', flat=True)

    not_checked_in = User.objects.filter(
        role='participant', is_active=True
    ).exclude(id__in=checked_in_ids).order_by('first_name', 'last_name')

    meal_passes = MealPass.objects.filter(
        date=today
    ).select_related('user', 'scanned_by').order_by('-created_at')

    if search:
        q = (
            Q(first_name__icontains=search) | Q(last_name__icontains=search) |
            Q(email__icontains=search)      | Q(registration_id__icontains=search)
        )
        checkins = checkins.filter(
            Q(user__first_name__icontains=search) | Q(user__last_name__icontains=search) |
            Q(user__email__icontains=search)      | Q(user__registration_id__icontains=search)
        )
        not_checked_in = not_checked_in.filter(q)
        meal_passes = meal_passes.filter(
            Q(user__first_name__icontains=search) | Q(user__last_name__icontains=search) |
            Q(user__email__icontains=search)      | Q(user__registration_id__icontains=search)
        )

    tabs = [
        ('checked_in',     f'Checked In ({CheckIn.objects.filter(checkin_type="conference").count()})'),
        ('not_checked_in', f'Not Checked In ({not_checked_in.count()})'),
        ('meal',           f'Meal Passes ({MealPass.objects.filter(date=today).count()})'),
    ]

    return render(request, 'panel/checkin_list.html', {
        'checkins':            checkins,
        'not_checked_in':      not_checked_in,
        'meal_passes':         meal_passes,
        'checked_in_count':    CheckIn.objects.filter(checkin_type='conference').count(),
        'not_checked_in_count':not_checked_in.count(),
        'meal_used_count':     MealPass.objects.filter(date=today, used=True).count(),
        'search':              search,
        'tab':                 tab,
        'tabs':                tabs,
    })


# ── Panel AJAX endpoints (session-auth) ───────────────────────────────────

@_require_scanner
def panel_scan(request):
    try:
        body = _json.loads(request.body)
    except _json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Bad JSON'}, status=400)

    reg_id = body.get('registration_id', '').strip().upper()
    if not reg_id:
        return JsonResponse({'success': False, 'error': 'No registration ID provided.'}, status=400)

    try:
        user = User.objects.get(registration_id=reg_id, is_active=True)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': f'No active user found with ID "{reg_id}".'}, status=404)

    existing = CheckIn.objects.filter(user=user, checkin_type='conference').first()
    if existing:
        return JsonResponse({
            'success': False, 'already_checked_in': True,
            'message': f'{user.get_full_name()} is already checked in.',
            'checkin_id': existing.id,
            'user': {
                'name':            user.get_full_name(),
                'email':           user.email,
                'registration_id': user.registration_id,
                'affiliation':     user.affiliation or '',
                'photo':           request.build_absolute_uri(user.profile_photo.url) if user.profile_photo else '',
            },
        })

    checkin = CheckIn.objects.create(
        user=user, checkin_type='conference',
        scanned_by=request.user, goodies_status='pending',
    )

    # Points
    try:
        from apps.leaderboard.utils import award_points
        from apps.leaderboard.models import PointAction, PointEntry
        if not PointEntry.objects.filter(user=user, action=PointAction.CHECKIN).exists():
            award_points(user, PointAction.CHECKIN, 'Conference check-in')
    except Exception:
        pass

    # Push to user device
    try:
        from apps.notifications.models import DeviceToken
        from apps.notifications import fcm
        toks = list(DeviceToken.objects.filter(user=user, is_active=True).values_list('token', flat=True))
        if toks:
            fcm.send_to_tokens(toks, '✅ Check-In Successful!',
                               f'Welcome to ETD 2026, {user.first_name}! You are checked in.', {})
    except Exception:
        pass

    return JsonResponse({
        'success':    True,
        'message':    f'{user.get_full_name()} checked in successfully!',
        'checkin_id': checkin.id,
        'user': {
            'name':            user.get_full_name(),
            'email':           user.email,
            'registration_id': user.registration_id,
            'affiliation':     user.affiliation or '',
            'photo':           request.build_absolute_uri(user.profile_photo.url) if user.profile_photo else '',
        },
    })


@_require_scanner
def panel_goodies(request):
    try:
        body = _json.loads(request.body)
    except _json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Bad JSON'}, status=400)

    checkin_id = body.get('checkin_id')
    status_val = body.get('status', 'received')
    reason     = body.get('reason', '').strip()

    try:
        checkin = CheckIn.objects.get(id=checkin_id)
        checkin.goodies_status       = status_val
        checkin.goodies_note         = reason
        checkin.goodies_confirmed_by = request.user
        checkin.goodies_confirmed_at = _tz.now()
        checkin.save(update_fields=['goodies_status', 'goodies_note', 'goodies_confirmed_by', 'goodies_confirmed_at'])
        return JsonResponse({'success': True, 'message': f'Conference Kit marked {status_val}.'})
    except CheckIn.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Check-in record not found.'}, status=404)


@_require_scanner
def panel_stats(request):
    total      = User.objects.filter(role='participant', is_active=True).count()
    checked_in = CheckIn.objects.filter(checkin_type='conference').count()
    return JsonResponse({
        'total':      total,
        'checked_in': checked_in,
        'remaining':  max(total - checked_in, 0),
    })


@_require_scanner
def panel_meal_window_status(request):
    today  = localdate()
    window = MealWindow.objects.filter(meal_type='meal', date=today).first()
    return JsonResponse({
        'date': str(today),
        'meal': {'is_open': window.is_open if window else False},
    })


@_require_scanner
def panel_meal_window_toggle(request):
    try:
        body = _json.loads(request.body)
    except _json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Bad JSON'}, status=400)

    action = body.get('action', 'open')
    today  = localdate()

    if action == 'open':
        window, created = MealWindow.objects.get_or_create(
            meal_type='meal', date=today,
            defaults={'opened_by': request.user, 'is_open': True},
        )
        if not created and not window.is_open:
            window.is_open = True; window.opened_by = request.user; window.closed_at = None
            window.save(update_fields=['is_open', 'opened_by', 'closed_at'])
    else:
        MealWindow.objects.filter(meal_type='meal', date=today).update(is_open=False, closed_at=_tz.now())

    return JsonResponse({'success': True, 'message': f'Meal window {action}ed.'})


@_require_scanner
def panel_meal_scan(request):
    try:
        body = _json.loads(request.body)
    except _json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Bad JSON'}, status=400)

    qr_raw = body.get('qr_code', '').strip()
    today  = localdate()
    mp     = None

    if qr_raw:
        try:
            payload = _json.loads(qr_raw)
            pass_id = payload.get('pass_id')
            mp = MealPass.objects.select_related('user').filter(id=pass_id).first()
        except Exception:
            try:
                user = User.objects.get(registration_id=qr_raw.upper(), is_active=True)
                mp   = MealPass.objects.select_related('user').filter(user=user, date=today).first()
            except User.DoesNotExist:
                pass

    if not mp:
        return JsonResponse({'success': False, 'error': 'No meal pass found.'}, status=404)

    if mp.used:
        return JsonResponse({
            'success': False, 'already_used': True,
            'message': f'{mp.user.get_full_name()} already used this meal pass.',
            'user': {'name': mp.user.get_full_name(), 'email': mp.user.email},
        })

    mp.used = True; mp.used_at = _tz.now(); mp.scanned_by = request.user
    mp.save(update_fields=['used', 'used_at', 'scanned_by'])

    return JsonResponse({
        'success': True,
        'message': f'{mp.user.get_full_name()} — Meal pass verified!',
        'user': {'name': mp.user.get_full_name(), 'email': mp.user.email},
    })
