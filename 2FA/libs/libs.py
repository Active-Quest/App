import cv2 as cv
import numpy as np
import random as rng
import math

def rotate(slika,angle):
    angle += np.random.randint(5, 10)
    h, w = slika.shape[:2]
    center = (w // 2, h // 2)

    M = cv.getRotationMatrix2D(center, angle, 1.0)

    rotated = cv.warpAffine(slika, M, (w, h),borderMode=cv.BORDER_REFLECT) # rotira slika za podan kot 
    #borderMode=cv.BORDER_REFLECT v kotah kjer nebi bilo "slike" zercali sosednje piksle
    return rotated


