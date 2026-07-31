from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from django.contrib import messages

from apps.accounts.admin_views import admin_required
from .models import Speaker, SpeakerTalk


# ─── Speakers List ──────────────────────────────────────────────────────────

@admin_required
def speakers_panel(request):
    keynotes = Speaker.objects.filter(is_keynote=True).prefetch_related('talks')
    regulars = Speaker.objects.filter(is_keynote=False).prefetch_related('talks')
    return render(request, 'panel/speakers_list.html', {
        'keynotes': keynotes,
        'regulars': regulars,
        'total': Speaker.objects.count(),
        'active': Speaker.objects.filter(is_active=True).count(),
    })


# ─── Create Speaker ──────────────────────────────────────────────────────────

@admin_required
def speaker_create(request):
    if request.method == 'POST':
        try:
            speaker = Speaker(
                title         = request.POST.get('title', ''),
                first_name    = request.POST.get('first_name', '').strip(),
                last_name     = request.POST.get('last_name', '').strip(),
                designation   = request.POST.get('designation', '').strip(),
                institute     = request.POST.get('institute', '').strip(),
                country       = request.POST.get('country', '').strip(),
                bio           = request.POST.get('bio', '').strip(),
                email         = request.POST.get('email', '').strip(),
                website_url        = request.POST.get('website_url', '').strip(),
                linkedin_url       = request.POST.get('linkedin_url', '').strip(),
                google_scholar_url = request.POST.get('google_scholar_url', '').strip(),
                researchgate_url   = request.POST.get('researchgate_url', '').strip(),
                twitter_url        = request.POST.get('twitter_url', '').strip(),
                is_keynote    = request.POST.get('is_keynote') == 'on',
                is_active     = request.POST.get('is_active') == 'on',
                display_order = int(request.POST.get('display_order', 0) or 0),
            )
            if 'photo' in request.FILES:
                speaker.photo = request.FILES['photo']
            speaker.save()
            messages.success(request, f'Speaker "{speaker.full_name}" created successfully.')
            return redirect('speakers_panel')
        except Exception as e:
            messages.error(request, f'Error creating speaker: {e}')

    from .models import Speaker
    return render(request, 'panel/speaker_form.html', {
        'action': 'Create', 'speaker': None,
        'title_choices': Speaker.TITLE_CHOICES,
    })


# ─── Edit Speaker ─────────────────────────────────────────────────────────────

@admin_required
def speaker_edit(request, pk):
    speaker = get_object_or_404(Speaker, pk=pk)

    if request.method == 'POST':
        try:
            speaker.title         = request.POST.get('title', '')
            speaker.first_name    = request.POST.get('first_name', '').strip()
            speaker.last_name     = request.POST.get('last_name', '').strip()
            speaker.designation   = request.POST.get('designation', '').strip()
            speaker.institute     = request.POST.get('institute', '').strip()
            speaker.country       = request.POST.get('country', '').strip()
            speaker.bio           = request.POST.get('bio', '').strip()
            speaker.email         = request.POST.get('email', '').strip()
            speaker.website_url        = request.POST.get('website_url', '').strip()
            speaker.linkedin_url       = request.POST.get('linkedin_url', '').strip()
            speaker.google_scholar_url = request.POST.get('google_scholar_url', '').strip()
            speaker.researchgate_url   = request.POST.get('researchgate_url', '').strip()
            speaker.twitter_url        = request.POST.get('twitter_url', '').strip()
            speaker.is_keynote    = request.POST.get('is_keynote') == 'on'
            speaker.is_active     = request.POST.get('is_active') == 'on'
            speaker.display_order = int(request.POST.get('display_order', 0) or 0)

            if 'photo' in request.FILES:
                speaker.photo = request.FILES['photo']
            elif request.POST.get('clear_photo') == 'on':
                speaker.photo = None

            speaker.save()
            messages.success(request, f'Speaker "{speaker.full_name}" updated.')
            return redirect('speakers_panel')
        except Exception as e:
            messages.error(request, f'Error updating speaker: {e}')

    talks = speaker.talks.all()
    return render(request, 'panel/speaker_form.html', {
        'action': 'Edit', 'speaker': speaker, 'talks': talks,
        'title_choices': Speaker.TITLE_CHOICES,
    })


# ─── Delete Speaker ───────────────────────────────────────────────────────────

@admin_required
@require_POST
def speaker_delete(request, pk):
    speaker = get_object_or_404(Speaker, pk=pk)
    name = speaker.full_name
    speaker.delete()
    messages.success(request, f'Speaker "{name}" deleted.')
    return redirect('speakers_panel')


# ─── Talk CRUD (inline via AJAX-style POST) ───────────────────────────────────

@admin_required
def talk_create(request, speaker_pk):
    speaker = get_object_or_404(Speaker, pk=speaker_pk)
    if request.method == 'POST':
        try:
            SpeakerTalk.objects.create(
                speaker       = speaker,
                title         = request.POST.get('title', '').strip(),
                abstract      = request.POST.get('abstract', '').strip(),
                track         = request.POST.get('track', '').strip(),
                talk_date     = request.POST.get('talk_date') or None,
                talk_time     = request.POST.get('talk_time', '').strip(),
                display_order = int(request.POST.get('display_order', 0) or 0),
            )
            messages.success(request, 'Talk added successfully.')
        except Exception as e:
            messages.error(request, f'Error adding talk: {e}')
    return redirect('speaker_edit', pk=speaker_pk)


@admin_required
@require_POST
def talk_delete(request, pk):
    talk = get_object_or_404(SpeakerTalk, pk=pk)
    speaker_pk = talk.speaker_id
    talk.delete()
    messages.success(request, 'Talk removed.')
    return redirect('speaker_edit', pk=speaker_pk)
