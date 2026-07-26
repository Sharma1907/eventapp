from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CheckIn

User = get_user_model()

SCANNER_ROLES = {'super_admin', 'mgmt_admin', 'team_head', 'staff'}


def _require_scanner(view_fn):
    @login_required
    def wrapper(request, *args, **kwargs):
        if request.user.role not in SCANNER_ROLES:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden('Not authorised.')
        return view_fn(request, *args, **kwargs)
    return wrapper


@_require_scanner
def scanner_view(request):
    admin_jwt = str(RefreshToken.for_user(request.user).access_token)
    return render(request, 'panel/scanner.html', {'admin_jwt': admin_jwt})


@_require_scanner
def checkin_list_view(request):
    checkins = CheckIn.objects.filter(
        checkin_type='conference'
    ).select_related('user', 'scanned_by').order_by('-scanned_at')
    return render(request, 'panel/checkin_list.html', {'checkins': checkins})
