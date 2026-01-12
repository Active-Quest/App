import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from keras_vggface.utils import preprocess_input
from tensorflow.keras.models import load_model
from libs import libs
import cv2

# Parameters

IMAGE_SIZE = (224, 224)
def register_user_logic(user_id, img_paths):

    # Load model
    model = load_model("face_classifier_model.h5")
    embedding_model = tf.keras.models.Model(
        inputs=model.input,
        outputs=model.get_layer("embedding").output
    )

    # Ensure embeddings folder exists
    os.makedirs("embeddings", exist_ok=True)

    # Count existing embeddings to generate unique names
    existing = [f for f in os.listdir("embeddings") if f.startswith(user_id) and f.endswith(".npy")]
    start_index = len(existing)

    # Process each image
    counter = 0
    for img_path in img_paths:
        # Load and resize image
        img = image.load_img(img_path, target_size=IMAGE_SIZE)
        img_array = image.img_to_array(img).astype(np.float32)

        # Augment: returns 5 versions
        augmented_images = libs.augmentImage(img_path)

        for aug_img in augmented_images:
            # Preprocess
            aug_img = cv2.resize(aug_img, (224, 224)) 
            aug_img = np.expand_dims(aug_img, axis=0)
            aug_img = aug_img.astype(np.float32)
            aug_img = preprocess_input(aug_img)

            # Get embedding and normalize
            embedding = embedding_model.predict(aug_img)[0]
            embedding = embedding / np.linalg.norm(embedding)

            # Save
            filename = os.path.join("embeddings", f"{user_id}_{start_index + counter:04d}.npy")
            np.save(filename, embedding)
            print(f"Saved: {filename}")
            counter += 1

    if counter > 3:
        return True
    else:
        return False
