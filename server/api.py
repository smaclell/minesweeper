from collections import namedtuple
from random import random
from .models import World, Tile

Point = namedtuple("Point", ['x', 'y'])


def get_neighbours_points(world: World, x: int, y: int) -> list[Point]:
    points = []
    if (x > 0):
        points.append(Point(x - 1, y))
        if (y > 0):
            points.append(Point(x - 1, y - 1))
        if ((y + 1) < world.height):
            points.append(Point(x - 1, y + 1))

    if ((x + 1) < world.width):
        points.append(Point(x + 1, y))

        if (y > 0):
            points.append(Point(x + 1, y - 1))
        if ((y + 1) < world.height):
            points.append(Point(x + 1, y + 1))

    if (y > 0):
        points.append(Point(x, y - 1))
    if ((y + 1) < world.height):
        points.append(Point(x, y + 1))

    return points


class Generator:
    def generate_point(self, world: World) -> Point:
        pass


class ListGenerator(Generator):
    def __init__(self, points: list[Point]):
        self.points = points

    def generate_point(self, world: World) -> list[Point]:
        return self.points.pop()


def find_or_create_tile(world: World, x: int, y: int) -> Tile:
    tile = Tile.objects.filter(world=world, x=x, y=y).first()
    if tile == None:
        tile = Tile.objects.create(world=world, x=x, y=y)
    return tile


def setup_mines(world: World, generator: Generator) -> None:
    mine_count = world.mine_count
    created = set()

    while mine_count > 0:
        x, y = generator.generate_point(world)
        if (x, y) in created:
            continue

        created.add((x, y))
        mine_count -= 1

        mine = find_or_create_tile(world, x, y)
        mine.has_mine = True
        mine.save()

        # TODO: Is there a more idiomatic way to do this?
        for point in get_neighbours_points(world, x, y):
            tile = find_or_create_tile(world, point.x, point.y)
            tile.count = tile.count + 1
            tile.save()
