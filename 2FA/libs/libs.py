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

def konvolucija(slika):
    jedro = np.full((5, 5), 1, dtype=np.float32) / (5 * 5)
    visina, sirina, kanali = slika.shape
    k_visina, k_sirina = jedro.shape
    
    pad_v = k_visina // 2
    pad_h = k_sirina // 2
    
    slika_padded = np.pad(slika, ((pad_v, pad_v), (pad_h, pad_h), (0, 0)), mode='constant', constant_values=0)
    izhodna_slika = np.zeros_like(slika, dtype=np.float32)
    
    for i in range(visina):
        for j in range(sirina):
            for c in range(kanali):
                region = slika_padded[i:i+k_visina, j:j+k_sirina, c]
                izhodna_slika[i, j, c] = np.sum(region * jedro)

    return np.clip(izhodna_slika, 0, 255).astype(np.uint8)
