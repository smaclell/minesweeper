from collections import namedtuple
from random import randint
from .models import World, Tile

Point = namedtuple("Point", ['x', 'y'])


def get_neighbours_points(world: World, point: Point) -> list[Point]:
    points = []
    x, y = point
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


class RandomGenerator(Generator):
    def generate_point(self, world: World) -> Point:
        return Point(
            x=randint(0, world.width - 1),
            y=randint(0, world.height - 1),
        )

# TODO: (learning) Is there a more idiomatic way to find/create or find/update?


def find_or_create_tile(world: World, point: Point) -> Tile:
    tile = Tile.objects.filter(world=world, x=point.x, y=point.y).first()
    if tile == None:
        tile = Tile.objects.create(world=world, x=point.x, y=point.y)
    return tile


def setup_mines(world: World, generator: Generator) -> None:
    mine_count = world.mine_count
    created = set()

    while mine_count > 0:
        point = generator.generate_point(world)
        if point in created:
            continue

        created.add(point)
        mine_count -= 1

        mine = find_or_create_tile(world, point)
        mine.has_mine = True
        mine.save()

        for point in get_neighbours_points(world, point):
            tile = find_or_create_tile(world, point)
            tile.count = tile.count + 1
            tile.save()
