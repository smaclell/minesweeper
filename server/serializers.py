from rest_framework import serializers
from server.models import World, Tile

# TODO: Should we convert the enums to strings and back?


class WorldSerializer(serializers.ModelSerializer):
    state = serializers.ReadOnlyField()
    cleared = serializers.ReadOnlyField()

    class Meta:
        model = World
        fields = ['id', 'width', 'height',
                  'mine_count', 'state', 'cleared']
