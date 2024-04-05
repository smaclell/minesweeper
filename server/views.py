from sqlite3 import IntegrityError as SqliteIntegrityError
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.http import Http404
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination
from rest_framework import status
from .api import ListGenerator, Point, RandomGenerator, setup_mines
from .models import Tile, TileState, World, WorldState
from .serializers import TileSerializer, WorldSerializer


class WorldList(APIView):
    def post(self, request, format=None):
        serializer = WorldSerializer(data=request.data)
        if not serializer.is_valid():
            if 'slug' in serializer.errors and any(e.code == 'unique' for e in serializer.errors[
                    'slug']):
                return Response(serializer.errors, status.HTTP_409_CONFLICT)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                world = serializer.save()
            except (IntegrityError, SqliteIntegrityError):
                return Response({'details': 'The slug is not unique'}, status=status.HTTP_409_CONFLICT)

        debug_flags = request.data.get('debug_flags', '')
        generator = RandomGenerator()
        if debug_flags == 'simple':
            mines = [Point(0, 0), Point(1, 1), Point(0, 2)]
            generator = ListGenerator(mines)
            world.mine_count = len(mines)
            world.save()

        with transaction.atomic():
            setup_mines(world, generator)
            world.state = WorldState.PLAYING
            world.save(force_update=True)

        # TODO: (learning) Can I reuse the same serializer?
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorldDetail(APIView):
    def get(self, request, slug, format=None):
        try:
            world = World.objects.get(slug=slug)
            return Response(WorldSerializer(world).data, status=status.HTTP_200_OK)

        except World.DoesNotExist:
            raise Http404


class TileList(APIView):
    pagination_class = CursorPagination

    # TODO: (learning) How do I do the pagination right?
    # TODO: (scope) Test this method
    def get(self, request, slug, format=None):
        try:
            world = World.objects.get(slug=slug)
        except World.DoesNotExist:
            world = None

        if world == None:
            raise Http404

        filter = Q(state=TileState.SHOWN) | Q(
            state=TileState.EXPLOSION) | Q(state=TileState.FLAG)
        queryset = Tile.objects.filter(world=world).filter(filter)

        paginator = CursorPagination()
        paginator.ordering = 'id'
        paginator.reverse = True

        paginated_queryset = paginator.paginate_queryset(
            queryset, request, view=self)

        serializer = TileSerializer(paginated_queryset, many=True)
        return Response({
            'next': paginator.get_next_link(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, slug, format=None):
        serializer = TileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            world = World.objects.get(slug=slug)
        except World.DoesNotExist:
            world = None

        # TODO: (learning) Can this use the serializer to access fields? Can we consolidate the validation against the world?
        x = request.data['x']
        y = request.data['y']
        state = request.data['state']

        if world == None or world.state != WorldState.PLAYING or x < 0 or y < 0 or x >= world.width or y >= world.height:
            raise Http404

        # TODO: (fix) ensure postgres does not fail
        with transaction.atomic():
            tile = Tile.objects.filter(
                world=world,
                x=x,
                y=y,
            ).first()

            shown = False
            if tile == None:
                shown = state == TileState.SHOWN
                tile = Tile(
                    world=world,
                    x=x,
                    y=y,
                    state=state,
                )

            elif tile.has_mine and state == TileState.SHOWN:
                tile.state = TileState.EXPLOSION
                world.state = WorldState.LOST

            elif tile.state == TileState.HIDDEN or tile.state == TileState.FLAG:
                if state == TileState.SHOWN:
                    tile.state = state
                    shown = True
                else:
                    tile.state = TileState.FLAG if tile.state == TileState.HIDDEN else TileState.HIDDEN

            # TODO: (fix) Ensure you can win or lose
            # TODO: (scope) Add more tests around this state to ensure cleared only changes when expected
            if shown:
                world.cleared += 1
                if (world.cleared + world.mine_count) >= (world.width * world.height):
                    world.state = WorldState.WON

            world.updated_at = timezone.now()
            tile.save()
            world.save()
            return Response(TileSerializer(tile).data, status=status.HTTP_202_ACCEPTED)
