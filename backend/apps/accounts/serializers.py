from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')

        # Check suspended BEFORE authenticate (Django skips inactive users)
        try:
            from django.contrib.auth import get_user_model
            u = get_user_model().objects.get(email=email)
            if not u.is_active:
                reason = u.suspended_reason or 'Contact the organizers.'
                raise serializers.ValidationError(f'Account suspended: {reason}')
        except get_user_model().DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')

        user = authenticate(username=email, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'affiliation', 'bio', 'designation', 'gender',
            'research_interests', 'profile_photo', 'profile_photo_url',
            'registration_id', 'must_change_password', 'profile_complete',
            'show_phone', 'show_linkedin', 'linkedin_url', 'created_at',
            'warning_note', 'suspended_reason',
        ]
        read_only_fields = ['id', 'email', 'role', 'registration_id', 'created_at', 'warning_note', 'suspended_reason']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError('Password must contain an uppercase letter.')
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError('Password must contain a number.')
        return value
