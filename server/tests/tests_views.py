from django.test import TestCase
from rest_framework.test import APIClient

from ..models import Tile, World, WorldState


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
        self.assertEqual(response.data['mine_count'], 3)

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
