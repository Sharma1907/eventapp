from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.contrib import messages
from apps.accounts.admin_views import admin_required
from .models import Photo, PhotoSettings


@login_required
@admin_required
def photos_panel(request):
    cfg = PhotoSettings.get()

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'toggle_window':
            cfg.upload_open = not cfg.upload_open
            cfg.updated_by = request.user
            cfg.save()
            state = 'opened' if cfg.upload_open else 'closed'
            messages.success(request, f'Upload window {state}.')
        elif action == 'toggle_auto':
            cfg.auto_approve = not cfg.auto_approve
            cfg.updated_by = request.user
            cfg.save()
            state = 'enabled' if cfg.auto_approve else 'disabled'
            messages.success(request, f'Auto-approve {state}.')
        elif action == 'approve':
            pk = request.POST.get('pk')
            Photo.objects.filter(pk=pk).update(
                status=Photo.Status.APPROVED,
                reviewed_by=request.user,
                reviewed_at=timezone.now(),
                rejected_reason='',
            )
        elif action == 'reject':
            pk = request.POST.get('pk')
            reason = request.POST.get('reason', '')[:200]
            Photo.objects.filter(pk=pk).update(
                status=Photo.Status.REJECTED,
                reviewed_by=request.user,
                reviewed_at=timezone.now(),
                rejected_reason=reason,
            )
        elif action == 'delete':
            pk = request.POST.get('pk')
            Photo.objects.filter(pk=pk).delete()
        elif action == 'approve_all':
            Photo.objects.filter(status=Photo.Status.PENDING).update(
                status=Photo.Status.APPROVED,
                reviewed_by=request.user,
                reviewed_at=timezone.now(),
            )
            messages.success(request, 'All pending photos approved.')
        return redirect('photos_panel')

    tab = request.GET.get('tab', 'pending')
    qs = Photo.objects.filter(status=tab).select_related('uploader', 'session').order_by('-created_at')

    counts = {
        'pending':  Photo.objects.filter(status='pending').count(),
        'approved': Photo.objects.filter(status='approved').count(),
        'rejected': Photo.objects.filter(status='rejected').count(),
    }

    tabs = [('pending','Pending'),('approved','Approved'),('rejected','Rejected')]
    return render(request, 'panel/photos.html', {
        'cfg': cfg,
        'photos': qs,
        'tab': tab,
        'counts': counts,
        'tabs': tabs,
    })
