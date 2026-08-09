from rest_framework import serializers
from django.utils import timezone
from .models import (
    ScheduleSession, ScheduleSubSession, SessionBookmark,
    FeedbackForm, FeedbackQuestion, FeedbackResponse, FeedbackAnswer
)


class SubSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ScheduleSubSession
        fields = ['id','title','start_datetime','end_datetime','description','display_order']


class SessionListSerializer(serializers.ModelSerializer):
    """Lightweight — for day list view."""
    status          = serializers.ReadOnlyField()
    feedback_open   = serializers.ReadOnlyField()
    is_bookmarked   = serializers.SerializerMethodField()
    bookmark_reminder = serializers.SerializerMethodField()

    class Meta:
        model  = ScheduleSession
        fields = [
            'id','day','title','session_type','start_datetime','end_datetime',
            'room','is_featured','is_parallel','is_published',
            'status','feedback_open','feedback_enabled',
            'is_bookmarked','bookmark_reminder','display_order',
        ]

    def get_is_bookmarked(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return False
        return obj.bookmarks.filter(user=user).exists()

    def get_bookmark_reminder(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return None
        bm = obj.bookmarks.filter(user=user).first()
        return bm.reminder_minutes if bm else None


class SessionDetailSerializer(SessionListSerializer):
    """Full detail — includes sub-sessions."""
    sub_sessions = SubSessionSerializer(many=True, read_only=True)

    class Meta(SessionListSerializer.Meta):
        fields = SessionListSerializer.Meta.fields + ['description','sub_sessions']


class BookmarkSerializer(serializers.ModelSerializer):
    session = SessionListSerializer(read_only=True)

    class Meta:
        model  = SessionBookmark
        fields = ['id','session','reminder_minutes','created_at']


class FeedbackQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeedbackQuestion
        fields = ['id','question_text','question_type','is_required','display_order']


class FeedbackFormSerializer(serializers.ModelSerializer):
    questions = FeedbackQuestionSerializer(many=True, read_only=True)

    class Meta:
        model  = FeedbackForm
        fields = ['id','title','questions']


class FeedbackAnswerInputSerializer(serializers.Serializer):
    question_id   = serializers.IntegerField()
    rating_value  = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)
    boolean_value = serializers.BooleanField(required=False, allow_null=True)
    text_value    = serializers.CharField(required=False, allow_blank=True, default='')


class FeedbackSubmitSerializer(serializers.Serializer):
    answers = FeedbackAnswerInputSerializer(many=True)


class FeedbackAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.question_text')
    question_type = serializers.ReadOnlyField(source='question.question_type')

    class Meta:
        model  = FeedbackAnswer
        fields = ['question_text','question_type','rating_value','boolean_value','text_value']


class FeedbackResponseSerializer(serializers.ModelSerializer):
    answers      = FeedbackAnswerSerializer(many=True, read_only=True)
    user_email   = serializers.ReadOnlyField(source='user.email')
    user_name    = serializers.SerializerMethodField()

    class Meta:
        model  = FeedbackResponse
        fields = ['id','user_email','user_name','submitted_at','answers']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
