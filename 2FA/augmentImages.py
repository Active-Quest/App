import cv2 as cv
import numpy as np
import os
import re
from libs import libs

def getNextFilename(folder, prefix, start=1):
    files = os.listdir(folder)
    numbers = []

    # pridobi največjo št v datoteki brez imena
    pattern = re.compile(re.escape(prefix) + r'_(\d+)\.jpg')

    for file in files:
        match = pattern.match(file)
        if match:
            numbers.append(int(match.group(1)))

    nextNumber = max(numbers) + 1 if numbers else start
    return nextNumber

def augmentImagesInFolder(folder, prefix):
    nextNumber = getNextFilename(folder, prefix, start=1)
    # gre skozi vse slike v mapi
    for filename in os.listdir(folder):
        if filename.lower().endswith('.jpg'):
            img_path = os.path.join(folder, filename)
            image = cv.imread(img_path)
            if image is None:
                print(f"Failed to load {img_path}")
                continue

            image = cv.resize(image, (128, 128))

            save_path = os.path.join(folder, f"{prefix}_{nextNumber:04d}.jpg")
            cv.imwrite(save_path, image)
            nextNumber += 1

            augmentedImage = libs.konvolucija(image)
            save_path = os.path.join(folder, f"{prefix}_{nextNumber:04d}.jpg")
            cv.imwrite(save_path, augmentedImage)
            nextNumber += 1

            augmentedImage = libs.brightenImage(image)
            save_path = os.path.join(folder, f"{prefix}_{nextNumber:04d}.jpg")
            cv.imwrite(save_path, augmentedImage)
            nextNumber += 1

            augmentedImage = libs.rotate(image)
            save_path = os.path.join(folder, f"{prefix}_{nextNumber:04d}.jpg")
            cv.imwrite(save_path, augmentedImage)
            nextNumber += 1

            augmentedImage = libs.rotate(image,330)
            save_path = os.path.join(folder, f"{prefix}_{nextNumber:04d}.jpg")
            cv.imwrite(save_path, augmentedImage)
            nextNumber += 1

            try:
                os.remove(img_path) # odstrani orginalno sliko
            except Exception as e:
                print(f"Failed to delete {img_path}: {e}")



def processAllImages(root_dir):
    for dirpath, dirnames, filenames in os.walk(root_dir): 
        prefix = os.path.basename(dirpath) # pridobi ime datoteke
        print(f"Processing folder: {dirpath} with prefix: {prefix}")
        augmentImagesInFolder(dirpath, prefix)


if __name__ == '__main__':
    root_directory = '2FA/images/lfw-deepfunneled'
    processAllImages(root_directory)
