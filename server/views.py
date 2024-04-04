from sqlite3 import IntegrityError as SqliteIntegrityError
from django.db import IntegrityError, transaction
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .api import ListGenerator, RandomGenerator, setup_mines
from .models import Tile, TileState, World, WorldState
from .serializers import TileSerializer, WorldSerializer


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


class WorldDetail(APIView):
    def get(self, request, slug, format=None):
        try:
            world = World.objects.get(slug=slug)
            return Response(WorldSerializer(world).data, status=status.HTTP_200_OK)

        except World.DoesNotExist:
            raise Http404


class TileList(APIView):
    def post(self, request, slug, format=None):
        serializer = TileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            world = World.objects.get(slug=slug)
        except World.DoesNotExist:
            world = None

        # TODO: Should this be using the serializer to access fields? Can we consolidate the validation?
        x = request.data['x']
        y = request.data['y']
        state = request.data['state']

        if world == None or world.state != WorldState.PLAYING or x < 0 or y < 0 or x >= world.width or y >= world.height:
            raise Http404

        with transaction.atomic():
            tile = Tile.objects.filter(
                world=world,
                x=x,
                y=y,
            ).first()

            if tile == None:
                tile = Tile(
                    world=world,
                    x=x,
                    y=y,
                    state=state,
                )
            elif tile.has_mine and state == TileState.SHOWN:
                tile.state = TileState.EXPLOSION
                world.state = WorldState.LOST
            else:
                tile.state = state

            if tile.state == TileState.SHOWN:
                world.cleared += 1
                if (world.cleared + world.mine_count) >= (world.width * world.height):
                    world.state = WorldState.WON

            tile.save()
            world.save()
            return Response(TileSerializer(tile).data, status=status.HTTP_201_CREATED)
