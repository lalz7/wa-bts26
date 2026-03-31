import random

DELAY_MIN = 4
DELAY_MAX = 8

def random_delay():
    return random.randint(DELAY_MIN, DELAY_MAX)