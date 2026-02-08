
print("Importing...")

import numpy
import imageio

def rgba_from_height(heights:numpy.ndarray) -> numpy.ndarray:
    size = heights.shape
    assert len(size)==2
    grey_shape = list(size)
    grey_shape.append(1)
    grey = heights.reshape(grey_shape)
    rgba = grey.repeat(4, axis=2)
    alphas = rgba[:,:,3]
    alphas[:] = numpy.ones_like(alphas) * 255
    return rgba

def upres_height(map9:numpy.ndarray) -> numpy.ndarray:
    scale = 7
    map_sm = map9.repeat( scale, axis=0 ).repeat( scale, axis=1 )

    noise_scale = 9
    random_seed = 61
    rng = numpy.random.default_rng(random_seed)
    noise = rng.random(size=map_sm.shape)
    noise = ( noise * noise_scale ) - ( noise_scale / 2.0 )
    map_sm += noise
    map_sm = map_sm.clip(min=0)

    return map_sm


def main_mapper():
    print("Starting")
    map9 = numpy.array( [
        [60, 55, 50, 0,  0],
        [70, 65, 60, 0,  0],
        [80, 75, 70, 0,  0],
        [90, 85, 90, 85, 80],
        [100,95, 90, 85, 80]
    ], dtype=numpy.uint32 ) * 2.0
    print(map9)
    print(map9.shape)

    map_sm = upres_height(map9)

    map_image = rgba_from_height(map_sm).astype(numpy.uint8)
    # out_path = "out.png"
    out_path = "content/images/grounds_height.png"
    imageio.v2.imwrite(out_path, map_image)

    print("Done.")

#if __name__ == main:
main_mapper()