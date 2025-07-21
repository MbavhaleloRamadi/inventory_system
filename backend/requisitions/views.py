# requisitions/views.py
from rest_framework import viewsets
from .models import Requisition
from .serializers import RequisitionSerializer
from rest_framework.permissions import IsAuthenticated

class RequisitionViewSet(viewsets.ModelViewSet):
    queryset = Requisition.objects.all().prefetch_related('items')
    serializer_class = RequisitionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)