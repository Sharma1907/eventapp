from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import DeviceToken, Notification
from . import fcm


@login_required(login_url='/panel/login/')
def notifications_page(request):
    notifs = Notification.objects.all()[:20]
    # Add read counts
    for n in notifs:
        n.delivered = n.delivered_count
        n.seen = n.read_count

    context = {
        'device_count': DeviceToken.objects.filter(is_active=True).count(),
        'notifications': notifs,
    }
    return render(request, 'panel/notifications.html', context)


@login_required(login_url='/panel/login/')
def send_notification(request):
    if request.method != 'POST':
        return redirect('panel_notifications')

    title = request.POST.get('title', '').strip()
    body = request.POST.get('body', '').strip()
    target_type = request.POST.get('target_type', 'all')
    target_role = request.POST.get('target_role', '')
    target_email = request.POST.get('target_email', '').strip()

    if not title or not body:
        messages.error(request, 'Title and message required.')
        return redirect('panel_notifications')

    notif = Notification.objects.create(
        title=title, body=body,
        target_type=target_type,
        target_role=target_role,
        sent_by=request.user,
        status='pending',
    )

    try:
        if target_type == 'all':
            success, failed, bad = fcm.send_to_all(title, body, {}, notif)
        elif target_type == 'role':
            success, failed, bad = fcm.send_to_role(target_role, title, body, {}, notif)
        elif target_type == 'user':
            from apps.accounts.models import User
            user = User.objects.get(email=target_email)
            notif.target_user = user
            success, failed, bad = fcm.send_to_user(user, title, body, {}, notif)
        else:
            raise ValueError('Invalid target')

        if bad:
            DeviceToken.objects.filter(token__in=bad).update(is_active=False)

        notif.status = 'sent'
        notif.sent_count = success
        notif.failed_count = failed
        notif.save()
        messages.success(request, f'Sent to {success} device(s). {failed} failed.')

    except Exception as e:
        notif.status = 'failed'
        notif.save()
        messages.error(request, f'Failed: {str(e)}')

    return redirect('panel_notifications')
