from enum import IntEnum
# from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

MAX_WIDTH = 100
MAX_HEIGHT = 100


class WorldState(IntEnum):
    LOADING = 1
    PLAYING = 2
    WON = 3
    LOST = 4

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]


class TileState(IntEnum):
    HIDDEN = 1
    SHOWN = 2
    # this might not need a dedicated state (SHOWN + MINE = explosion)
    EXPLOSION = 3
    FLAG = 4

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

# TODO: I want users to be able to own worlds and maybe invite others to play
#       Let's leave it for now and I can add if I have time. In reading about authentication in Django, I was not fully sure how it worked.


class World(models.Model):
    slug = models.CharField(max_length=255, unique=True)
    state = models.IntegerField(
        choices=WorldState.choices(), default=WorldState.LOADING)
    created_at = models.DateTimeField(auto_now_add=True, blank=True)
    updated_at = models.DateTimeField(auto_now_add=True, blank=True)
    debug_flags = models.CharField(max_length=255)
    width = models.SmallIntegerField(
        validators=[
            MaxValueValidator(MAX_WIDTH),
            MinValueValidator(4),
        ],
    )
    height = models.SmallIntegerField(
        validators=[
            MaxValueValidator(MAX_HEIGHT),
            MinValueValidator(4),
        ],
    )
    mine_count = models.SmallIntegerField(
        validators=[
            MaxValueValidator(MAX_WIDTH * MAX_HEIGHT),
            MinValueValidator(1),
        ],
    )
    cleared = models.SmallIntegerField(
        default=0,
        validators=[
            MaxValueValidator(MAX_WIDTH * MAX_HEIGHT),
            MinValueValidator(0),
        ],
    )


class Tile(models.Model):
    world = models.ForeignKey(World, on_delete=models.CASCADE)
    x = models.SmallIntegerField()
    y = models.SmallIntegerField()
    state = models.IntegerField(
        choices=TileState.choices(), default=TileState.HIDDEN)
    count = models.SmallIntegerField(default=0)
    has_mine = models.BooleanField(default=False)

    class Meta:
        unique_together = ("world", "x", "y")
