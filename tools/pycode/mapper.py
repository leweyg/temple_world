
print("Importing...")

import numpy
import imageio

def main_mapper():
    print("Starting")
    map9 = numpy.array( [
        [60,50,0],
        [80,70,0],
        [100,90,80]
    ] )
    print(map9.shape)
    print("Done.")

#if __name__ == main:
main_mapper()