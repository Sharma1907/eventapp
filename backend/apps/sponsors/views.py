from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from collections import OrderedDict

from .models import Sponsor
from .serializers import SponsorListSerializer, SponsorDetailSerializer


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




TIER_ORDER = ['national_funding', 'platinum', 'silver', 'bronze']


@api_view(['GET'])
@permission_classes([AllowAny])
def list_sponsors(request):
    """Return sponsors grouped by tier for the mobile app."""
    qs = Sponsor.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer = SponsorListSerializer(qs, many=True, context={'request': request})

    grouped = OrderedDict()
    for tier in TIER_ORDER:
        grouped[tier] = {
            'tier': tier,
            'tier_display': dict(Sponsor.TIER_CHOICES).get(tier, tier),
            'sponsors': [],
        }

    for s in serializer.data:
        tier = s['tier']
        if tier in grouped:
            grouped[tier]['sponsors'].append(s)

    return Response({'groups': list(grouped.values())})


@api_view(['GET'])
@permission_classes([AllowAny])
def sponsor_detail(request, sponsor_id):
    try:
        sponsor = Sponsor.objects.get(pk=sponsor_id, is_active=True)
    except Sponsor.DoesNotExist:
        return Response({'error': 'Sponsor not found'}, status=404)
    serializer = SponsorDetailSerializer(sponsor, context={'request': request})
    return Response(serializer.data)
