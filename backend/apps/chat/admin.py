from django.contrib import admin
from .models import ConnectionRequest, Conversation, Message, MessageReaction, MessageReport, BlockedUser


@admin.register(ConnectionRequest)
class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'receiver', 'request_type', 'topic', 'status', 'created_at']
    list_filter   = ['status', 'request_type', 'topic']
    search_fields = ['sender__email', 'receiver__email']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ['participant_a', 'participant_b', 'topic', 'last_message_at', 'created_at']
    search_fields = ['participant_a__email', 'participant_b__email']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'conversation', 'message_type', 'read', 'is_deleted', 'created_at']
    list_filter   = ['message_type', 'read', 'is_deleted']
    search_fields = ['sender__email', 'content']


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'reaction', 'message', 'created_at']
    list_filter  = ['reaction']


@admin.register(MessageReport)
class MessageReportAdmin(admin.ModelAdmin):
    list_display  = ['reporter', 'reason', 'reviewed', 'created_at']
    list_filter   = ['reason', 'reviewed']


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ['blocker', 'blocked', 'created_at']
