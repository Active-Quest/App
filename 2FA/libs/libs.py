import cv2 as cv
import numpy as np
import random as rng
import math

def rotate(slika):
    angle = rng.randint(0, 360)
    (h, w) = slika.shape[:2]
    center = (w // 2, h // 2)

    # Create rotation matrixs
    M = cv.getRotationMatrix2D(center, angle, 1.0)

    # Perform the rotation
    rotated = cv.warpAffine(slika, M, (w, h))
    return rotated

def konvolucija(slika):
    jedro = np.full((3, 3), 1, dtype=np.float32)/3*3
    visina, sirina = slika.shape[:2]
    k_visina, k_sirina = jedro.shape
    
    pad_v = k_visina // 2 
    pad_h = k_sirina // 2
    
    slika_padded = np.pad(slika, ((pad_v, pad_v), (pad_h, pad_h), (0, 0)), mode='constant', constant_values=0)
    
    izhodna_slika = np.zeros_like(slika, dtype=np.float32)
    
    for i in range(visina):
        for j in range(sirina):
            region = slika_padded[i:i+k_visina, j:j+k_sirina]
            
            izhodna_slika[i, j] = np.sum(region * jedro)
    
    return izhodna_slika

def filtriraj_z_gaussovim_jedrom(slika,sigma=1.0):
    velikost_jedra= int((2*sigma)*2+1)
    k=(velikost_jedra/2)-1/2
    gjedro = np.zeros((velikost_jedra, velikost_jedra), dtype=np.float32)
    for i in range(velikost_jedra):
        for j in range(velikost_jedra):
            gjedro[i, j] = (1 / (2 * math.pi * sigma * sigma)) * math.exp(-((pow(i - k, 2) + pow(j - k, 2)) / (2 * sigma * sigma)))

    gjedro /= np.sum(gjedro)
    izhodna_slika = np.zeros_like(slika, dtype=np.float32)
    izhodna_slika=konvolucija(slika,gjedro)
    izhodna_slika = (izhodna_slika - izhodna_slika.min()) / (izhodna_slika.max() - izhodna_slika.min()) * 255
    return izhodna_slika