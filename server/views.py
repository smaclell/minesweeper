from sqlite3 import IntegrityError as SqliteIntegrityError
from django.db import IntegrityError, transaction
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .api import ListGenerator, RandomGenerator, setup_mines
from .models import WorldState
from .serializers import WorldSerializer


class WorldList(APIView):
    def post(self, request, format=None):
        serializer = WorldSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                world = serializer.save()
            except (IntegrityError, SqliteIntegrityError):
                return Response({'details': 'The slug is not unique'}, status=status.HTTP_409_CONFLICT)

        debug_flags = request.data.get('debug_flags', '')
        generator = RandomGenerator()
        if debug_flags == 'simple':
            generator = ListGenerator(
                [
                    (0, 0),
                    (1, 1),
                    (0, 2),
                ]
            )

        with transaction.atomic():
            setup_mines(world, generator)
            world.state = WorldState.PLAYING
            world.save(force_update=True)

        # TODO: Should I reuse the same serializer
        return Response(serializer.data, status=status.HTTP_201_CREATED)
