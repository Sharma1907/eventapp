from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages


def admin_login(request):
    if request.user.is_authenticated:
        return redirect('admin_dashboard')

    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        user = authenticate(request, username=email, password=password)

        if user is not None and user.role in ['super_admin', 'mgmt_admin']:
            login(request, user)
            return redirect('admin_dashboard')
        elif user is not None:
            messages.error(request, 'You do not have admin access.')
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'panel/login.html')


@login_required(login_url='/panel/login/')
def admin_dashboard(request):
    context = {
        'total_participants': 480,
        'checked_in': 312,
        'checkin_percent': 65,
        'photos_uploaded': 847,
        'photos_pending': 34,
        'active_polls': 12,
        'profile_complete_percent': 58,
        'today_events': [
            {'time': '09:00', 'title': 'Opening Ceremony', 'room': 'Hall A', 'status': 'live'},
            {'time': '10:30', 'title': 'Keynote: AI in Research', 'room': 'Hall A', 'status': 'upcoming'},
            {'time': '13:00', 'title': 'Lunch Break', 'room': 'Cafeteria', 'status': 'upcoming'},
            {'time': '14:30', 'title': 'Workshop: Data Science', 'room': 'Room 201', 'status': 'upcoming'},
        ],
        'recent_checkins': [
            {'name': 'Rahul Sharma', 'time': '2 min ago', 'id': 'CONF-0042'},
            {'name': 'Priya Patel', 'time': '5 min ago', 'id': 'CONF-0108'},
            {'name': 'Amit Kumar', 'time': '8 min ago', 'id': 'CONF-0156'},
            {'name': 'Sneha Gupta', 'time': '12 min ago', 'id': 'CONF-0201'},
        ],
    }
    return render(request, 'panel/dashboard.html', context)


@login_required
def admin_logout(request):
    logout(request)
    return redirect('admin_login')
