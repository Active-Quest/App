import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from keras_vggface.utils import preprocess_input
from tensorflow.keras.models import load_model

# --- Parametri ---
IMAGE_PATH = "mm7.jpg"
IME_OSEBE = "Matic_Murko"
IMAGE_SIZE = (224, 224)

# --- Naloži model ---
model = load_model("face_classifier_model.h5")
embedding_model = tf.keras.models.Model(
    inputs=model.input,
    outputs=model.get_layer("embedding").output
)

# --- Obdelaj sliko ---
img = image.load_img(IMAGE_PATH, target_size=IMAGE_SIZE)
img_array = image.img_to_array(img)
img_array = np.expand_dims(img_array, axis=0)
img_array = preprocess_input(img_array)

# --- Izračunaj in normaliziraj embedding ---
embedding = embedding_model.predict(img_array)[0]
embedding = embedding / np.linalg.norm(embedding)

# --- Ustvari mapo, če ne obstaja ---
os.makedirs("embeddings", exist_ok=True)

# --- Poišči naslednjo številko datoteke ---
obstojece = [f for f in os.listdir("embeddings") if f.startswith(IME_OSEBE) and f.endswith(".npy")]
next_index = len(obstojece) + 1
filename = os.path.join("embeddings", f"{IME_OSEBE}_{next_index:04d}.npy")

# --- Shrani embedding ---
np.save(filename, embedding)
print(f"[✓] Embedding za {IME_OSEBE} shranjen v {filename}")
