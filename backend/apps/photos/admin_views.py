from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.contrib import messages
from django.http import QueryDict
from apps.accounts.admin_views import admin_required
from .models import Photo, PhotoSettings


@login_required
@admin_required
def photos_panel(request):
    cfg = PhotoSettings.get()
    tab = request.POST.get('tab', request.GET.get('tab', 'pending'))

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'toggle_window':
            cfg.upload_open = not cfg.upload_open
            cfg.updated_by = request.user
            cfg.save()
            messages.success(request, f'Upload window {"opened" if cfg.upload_open else "closed"}.')
        elif action == 'toggle_auto':
            cfg.auto_approve = not cfg.auto_approve
            cfg.updated_by = request.user
            cfg.save()
            messages.success(request, f'Auto-approve {"enabled" if cfg.auto_approve else "disabled"}.')
        elif action == 'approve':
            Photo.objects.filter(pk=request.POST.get('pk')).update(
                status=Photo.Status.APPROVED, reviewed_by=request.user, reviewed_at=timezone.now(), rejected_reason='',
            )
        elif action == 'reject':
            Photo.objects.filter(pk=request.POST.get('pk')).update(
                status=Photo.Status.REJECTED, reviewed_by=request.user, reviewed_at=timezone.now(),
                rejected_reason=request.POST.get('reason', '')[:200],
            )
        elif action == 'delete':
            Photo.objects.filter(pk=request.POST.get('pk')).delete()
        elif action == 'approve_all':
            cnt = Photo.objects.filter(status=Photo.Status.PENDING).update(
                status=Photo.Status.APPROVED, reviewed_by=request.user, reviewed_at=timezone.now(),
            )
            messages.success(request, f'{cnt} photos approved.')
        return redirect(f'/panel/photos/?tab={tab}')

    photos = Photo.objects.filter(status=tab).select_related('uploader', 'session').order_by('-created_at')

    return render(request, 'panel/photos.html', {
        'cfg': cfg,
        'photos': photos,
        'tab': tab,
        'pending_count': Photo.objects.filter(status='pending').count(),
        'approved_count': Photo.objects.filter(status='approved').count(),
        'rejected_count': Photo.objects.filter(status='rejected').count(),
    })
