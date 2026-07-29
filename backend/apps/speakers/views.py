from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Speaker
from .serializers import SpeakerListSerializer, SpeakerDetailSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def list_speakers(request):
    """
    Returns all active speakers split into keynote + regular groups.
    GET /api/v1/speakers/
    """
    qs = Speaker.objects.filter(is_active=True)
    keynotes = qs.filter(is_keynote=True)
    regulars = qs.filter(is_keynote=False)

    ctx = {'request': request}
    data = {
        'keynotes': SpeakerListSerializer(keynotes, many=True, context=ctx).data,
        'speakers': SpeakerListSerializer(regulars, many=True, context=ctx).data,
        'total':    qs.count(),
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def speaker_detail(request, pk):
    """
    Returns full speaker detail.
    GET /api/v1/speakers/<pk>/
    """
    try:
        speaker = Speaker.objects.get(pk=pk, is_active=True)
    except Speaker.DoesNotExist:
        return Response({'error': 'Speaker not found.'}, status=status.HTTP_404_NOT_FOUND)

    ctx = {'request': request}
    return Response(SpeakerDetailSerializer(speaker, context=ctx).data)
