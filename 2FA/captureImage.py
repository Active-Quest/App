import cv2 as cv
import numpy as np
import os
import re
import time
from libs import libs

def get_next_filename(folder, start=1000):
    files = os.listdir(folder)
    numbers = []

    for file in files:
        match = re.match(r"(\d+)\.jpg", file)
        if match:
            numbers.append(int(match.group(1)))

    next_number = max(numbers) + 1 if numbers else start
    return next_number

if __name__ == '__main__':
    kamera = cv.VideoCapture(0)
    if not kamera.isOpened():
        print('Kamera ni bila odprta.')
    else:
        save_dir = '2FA/images'
        os.makedirs(save_dir, exist_ok=True)
        next_number = get_next_filename(save_dir, start=1000)
        while True:
            time.sleep(1)
            ret, slika = kamera.read()
            slika=cv.resize(slika, (128, 128))
            cv.imshow('Kamera', cv.flip(slika,1))
            key=cv.waitKey(1) & 0xFF

            cv.flip(slika,1)
            image_path=os.path.join(save_dir, f"{next_number}.jpg")

            next_number+= 1
            cv.imwrite(image_path, slika)
            
            time.sleep(5)

            if key == ord('q'):
                break

        kamera.release()
        cv.destroyAllWindows()