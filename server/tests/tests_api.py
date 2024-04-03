from django.test import TestCase

from ..api import Point, ListGenerator, RandomGenerator, setup_mines
from ..models import Tile, TileState, World


class WorldTestCase(TestCase):
    def test_creating_a_basic_world(self):
        world = World.objects.create(
            slug="test", width=10, height=10, mine_count=3)

        mines = [Point(0, 0), Point(1, 1), Point(0, 2)]
        generator = ListGenerator(mines)
        setup_mines(world, generator)

        count = Tile.objects.filter(world=world).count()
        self.assertEqual(count, 11)

        for mine in mines:
            mine = Tile.objects.get(world=world, x=mine[0], y=mine[1])
            self.assertEqual(mine.has_mine, True)
            self.assertEqual(mine.state, TileState.HIDDEN)

        point_counts = {
            3: [Point(0, 1)],
            2: [Point(1, 0), Point(1, 2)],
            1: [Point(2, 0), Point(2, 1), Point(2, 2), Point(1, 3), Point(0, 3)],
        }

        for count, points in point_counts.items():
            for point in points:
                tile = Tile.objects.get(world=world, x=point.x, y=point.y)
                self.assertEqual(tile.count, count)
                self.assertEqual(tile.has_mine, False)

    def test_random_world(self):
        world = World.objects.create(
            slug="random", width=10, height=10, mine_count=5)

        generator = RandomGenerator()
        setup_mines(world, generator)

        mines = Tile.objects.filter(world=world, has_mine=True)
        self.assertEqual(mines.count(), world.mine_count)

        for mine in mines:
            self.assertEqual(mine.has_mine, True)
            self.assertEqual(mine.state, TileState.HIDDEN)
