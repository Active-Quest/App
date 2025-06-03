import cv2 as cv
import numpy as np
import random as rng
import math

def rotate(slika):
    angle = np.random.randint(0, 360)
    (h, w) = slika.shape[:2]
    center = (w // 2, h // 2)

    # Create rotation matrixs
    M = cv.getRotationMatrix2D(center, angle, 1.0)

    # Perform the rotation
    rotated = cv.warpAffine(slika, M, (w, h))
    return rotated

