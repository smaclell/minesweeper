from rest_framework import serializers
from server.models import Tile, TileState, World

# TODO: Should we convert the enums to strings and back?


class WorldSerializer(serializers.ModelSerializer):
    state = serializers.ReadOnlyField()
    cleared = serializers.ReadOnlyField()

    class Meta:
        model = World
        fields = ['id', 'width', 'height',
                  'mine_count', 'state', 'cleared']


class TileSerializer(serializers.ModelSerializer):
    count = serializers.ReadOnlyField()

    def validate_state(self, value):
        if not (value == TileState.FLAG or value == TileState.SHOWN):
            raise serializers.ValidationError(
                "Tiles can only be flagged (4) or shown (2)")
        return int(value)

    class Meta:
        model = Tile
        fields = ['id', 'x', 'y', 'state', 'count']
