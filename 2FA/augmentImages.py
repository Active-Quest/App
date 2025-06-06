import cv2 as cv
import numpy as np
import os
import re
from libs import libs

def get_next_filename(folder, prefix, start=1):
    files = os.listdir(folder)
    numbers = []

    # Regex to match files like Alain_Cervantes_0001.jpg
    pattern = re.compile(re.escape(prefix) + r'_(\d+)\.jpg')

    for file in files:
        match = pattern.match(file)
        if match:
            numbers.append(int(match.group(1)))

    next_number = max(numbers) + 1 if numbers else start
    return next_number

def augment_images_in_folder(folder, prefix):
    next_number = get_next_filename(folder, prefix, start=1)

    for filename in os.listdir(folder):
        if filename.lower().endswith('.jpg'):
            img_path = os.path.join(folder, filename)
            image = cv.imread(img_path)
            if image is None:
                print(f"Failed to load {img_path}")
                continue

            image = cv.resize(image, (128, 128))

            save_path = os.path.join(folder, f"{prefix}_{next_number:04d}.jpg")
            cv.imwrite(save_path, image)
            next_number += 1

            conv_image = libs.konvolucija(image)
            save_path = os.path.join(folder, f"{prefix}_{next_number:04d}.jpg")
            cv.imwrite(save_path, conv_image)
            next_number += 1

            conv_image = libs.brightenImage(image)
            save_path = os.path.join(folder, f"{prefix}_{next_number:04d}.jpg")
            cv.imwrite(save_path, conv_image)
            next_number += 1

            conv_image = libs.rotate(image)
            save_path = os.path.join(folder, f"{prefix}_{next_number:04d}.jpg")
            cv.imwrite(save_path, conv_image)
            next_number += 1

            conv_image = libs.rotate(image,270)
            save_path = os.path.join(folder, f"{prefix}_{next_number:04d}.jpg")
            cv.imwrite(save_path, conv_image)
            next_number += 1



def process_all_images(root_dir):
    for dirpath, dirnames, filenames in os.walk(root_dir):
        prefix = os.path.basename(dirpath)
        print(f"Processing folder: {dirpath} with prefix: {prefix}")
        augment_images_in_folder(dirpath, prefix)


if __name__ == '__main__':
    root_directory = '2FA/images/lfw-deepfunneled'
    process_all_images(root_directory)
