from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate


# register
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "phone",
            "college",
            "branch",
            "target_role",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


#login
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError("Invalid username or password")

        data["user"] = user
        return data

#user profile
class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "college",
            "branch",
            "target_role",
        ]



# what this code actually does is it defines a serializer for changing the password of a user. It checks if the old password provided by the user is correct, if the new password and confirm password match, and if the new password is different from the old password. If any of these conditions are not met, it raises a validation error with an appropriate message.
#Old Password        → बरोबर आहे का? 
# New Password        → नवीन आहे का? 
# Confirm Password    → New Password सारखाच आहे का? 
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = self.context["request"].user

        if not user.check_password(data["old_password"]):
            raise serializers.ValidationError({
                "old_password": "Old password is incorrect."
            })

        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "New passwords do not match."
            })

        if data["old_password"] == data["new_password"]:
            raise serializers.ValidationError({
                "new_password": "New password must be different from old password."
            })

        return data