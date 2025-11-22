from rest_framework import routers
from .views import DatasetViewSet

router = routers.DefaultRouter()
router.register(r'datasets', DatasetViewSet)

urlpatterns = router.urls
