from django.test import TestCase
from rest_framework.test import APIClient

from ..api import ListGenerator, Point, setup_mines
from ..models import Tile, TileState, World, WorldState


class WorldDetailTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.world = World.objects.create(
            slug="test-basic-details", width=10, height=10, mine_count=3)

    def test_getting_a_basic_world(self):
        response = self.client.get('/api/worlds/test-basic-details/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['width'], 10)
        self.assertEqual(response.data['height'], 10)
        self.assertEqual(response.data['state'], self.world.state)
        self.assertEqual(response.data['mine_count'], 3)

    def test_getting_a_basic_world(self):
        response = self.client.get('/api/worlds/test-not-found/')

        self.assertEqual(response.status_code, 404)


class WorldListTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_creating_a_basic_world(self):
        mine_count = 3

        response = self.client.post('/api/worlds/', {
            'width': 10,
            'height': 10,
            'mine_count': mine_count,
            'slug': 'super-awesome-test',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['state'], WorldState.PLAYING)
        self.assertEqual(response.data['mine_count'], mine_count)

        mines_created = Tile.objects.filter(
            world_id=response.data['id'],
            has_mine=True,
        ).count()
        self.assertEqual(mines_created, mine_count)

        tiles_created = Tile.objects.filter(
            world_id=response.data['id'],
        ).count()
        self.assertGreater(tiles_created, mine_count)

    def test_using_the_simple_debug_flag(self):
        mine_count = 3

        response = self.client.post('/api/worlds/', {
            'width': 10,
            'height': 10,
            'mine_count': mine_count,
            'slug': 'simple-is-good',
            'debug_flag': 'simple'
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['state'], WorldState.PLAYING)
        self.assertEqual(response.data['mine_count'], mine_count)

        mines_created = Tile.objects.filter(
            world_id=response.data['id'],
            has_mine=True,
        ).count()
        self.assertEqual(mines_created, mine_count)

        tiles_created = Tile.objects.filter(
            world_id=response.data['id'],
        ).count()
        self.assertGreater(tiles_created, mine_count)

    def test_cannot_create_a_duplicate_world(self):
        mine_count = 3

        initial_world_count = World.objects.count()

        response = self.client.post('/api/worlds/', {
            'width': 10,
            'height': 10,
            'mine_count': mine_count,
            'slug': 'duplicated-duplicated-duplicated',
        }, format='json')

        self.assertEqual(response.status_code, 201)

        response = self.client.post('/api/worlds/', {
            'width': 10,
            'height': 10,
            'mine_count': mine_count,
            'slug': 'duplicated-duplicated-duplicated',
        }, format='json')

        self.assertEqual(response.status_code, 409)

        final_world_count = World.objects.count()
        self.assertEqual(final_world_count, initial_world_count + 1)


class TileListTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.world = World.objects.create(
            slug="test-basic-tiles", width=10, height=10, mine_count=3, state=WorldState.PLAYING)

        setup_mines(self.world, ListGenerator(
            [
                Point(0, 0),
                Point(1, 1),
                Point(0, 2),
            ]
        ))

    def test_creating_a_blank_tile(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 5,
            'y': 5,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.SHOWN)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual('has_mine' in response.data, False)

    def test_showing_a_tile_twice(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 4,
            'y': 4,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.SHOWN)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual('has_mine' in response.data, False)

        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 4,
            'y': 4,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.SHOWN)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual('has_mine' in response.data, False)

        updated_world = World.objects.get(id=self.world.id)
        self.assertEqual(updated_world.cleared, self.world.cleared + 1)

    def test_showing_a_mine(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 1,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.EXPLOSION)
        self.assertEqual('has_mine' in response.data, False)

        updated_world = World.objects.get(id=self.world.id)
        self.assertEqual(updated_world.state, WorldState.LOST)

    def test_showing_near_a_mine(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 0,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.SHOWN)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual('has_mine' in response.data, False)

    def test_flagging_then_showing(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 2,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.FLAG)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual('has_mine' in response.data, False)

        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 2,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.SHOWN)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual('has_mine' in response.data, False)

        updated_world = World.objects.get(id=self.world.id)
        self.assertEqual(updated_world.cleared, self.world.cleared + 1)

    def test_flagging_then_showing(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 2,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.FLAG)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual('has_mine' in response.data, False)

        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 2,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.SHOWN)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual('has_mine' in response.data, False)

        updated_world = World.objects.get(id=self.world.id)
        self.assertEqual(updated_world.cleared, self.world.cleared)

    def test_flagging_a_mine(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 1,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['state'], TileState.FLAG)
        self.assertEqual('has_mine' in response.data, False)

    def test_showing_the_last_square(self):
        self.world.cleared = 1000000
        self.world.save()

        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 7,
            'y': 7,
            'state': TileState.SHOWN,
        }, format='json')

        self.assertEqual(response.status_code, 202)

        updated_world = World.objects.get(id=self.world.id)
        self.assertEqual(updated_world.state, WorldState.WON)

    def test_calling_a_bad_world(self):
        response = self.client.post('/api/worlds/bad-bad-world/tiles/', {
            'x': 1,
            'y': 1,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 404)

    def test_calling_a_lost_world(self):
        self.world.state = WorldState.LOST
        self.world.save()

        response = self.client.post('/api/worlds/bad-bad-world/tiles/', {
            'x': 1,
            'y': 1,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 404)

    def test_calling_below_of_bounds(self):
        response = self.client.post('/api/worlds/bad-bad-world/tiles/', {
            'x': -1,
            'y': 1,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 404)

    def test_calling_above_of_bounds(self):
        response = self.client.post('/api/worlds/bad-bad-world/tiles/', {
            'x': 100,
            'y': 1,
            'state': TileState.FLAG,
        }, format='json')

        self.assertEqual(response.status_code, 404)

    def test_trying_to_hide(self):
        response = self.client.post('/api/worlds/test-basic-tiles/tiles/', {
            'x': 1,
            'y': 1,
            'state': TileState.HIDDEN,
        }, format='json')

        self.assertEqual(response.status_code, 400)
