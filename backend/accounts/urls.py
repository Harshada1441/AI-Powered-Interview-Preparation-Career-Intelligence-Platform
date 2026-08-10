from django.urls import path
from .views import (
    RegisterView, 
    LoginView, 
    ProfileView,
    UpdateProfileView, 
    ChangePasswordView,
) 

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/update/", UpdateProfileView.as_view(), name="update-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    
]