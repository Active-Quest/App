import cv2 as cv
import numpy as np
import random as rng
import math

def rotate(slika,angle=30):
    if angle > 360 or angle < 0:
        return slika
    if angle <= 350:
        angle += np.random.randint(5, 10)
    h, w = slika.shape[:2]
    center = (w // 2, h // 2)

    M = cv.getRotationMatrix2D(center, angle, 1.0)

    rotated = cv.warpAffine(slika, M, (w, h),borderMode=cv.BORDER_REFLECT) # rotira slika za podan kot 
    #borderMode=cv.BORDER_REFLECT v kotah kjer nebi bilo "slike" zercali sosednje piksle
    return rotated

def flip(slika , direction = "h"):
    if direction == "h":
        cv.flip(slika , 1) # obrne sliko horiziotalno
    elif direction == "v":
        cv.flip(slika , 0) # obrne sliko vertikalno
    elif direction == "b":
        cv.flip(slika , -1) # obrne sliko horiziotalno in vertikalno
    return slika

def brightenImage(slika, brightnessIncrease=30):
    if brightnessIncrease < 1:
        return slika
    hsv = cv.cvtColor(slika, cv.COLOR_BGR2HSV)
    h, s, v = cv.split(hsv)

    v = v.astype(np.int32) + brightnessIncrease # spremeni v int32(v uint8 bi svetle točke postale črne) in doda podano vrednost ki osvetli sliko
    v = np.clip(v, 0, 255).astype(np.uint8) # spremeni nazaj v uint8 in odreže vrednosti večje od 255 in manjše od 0

    hsv_bright = cv.merge([h, s, v])
    brightened = cv.cvtColor(hsv_bright, cv.COLOR_HSV2BGR)
    return brightened

