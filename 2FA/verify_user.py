import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from keras_vggface.utils import preprocess_input
from tensorflow.keras.models import load_model
from sklearn.metrics.pairwise import euclidean_distances

# Parametri
THRESHOLD = 0.7
IMAGE_SIZE = (224, 224)

def verify_user_logic(path):
    # Naloži model
    model = load_model("face_classifier_model.h5")
    embedding_model = tf.keras.models.Model(
        inputs=model.input,
        outputs=model.get_layer("embedding").output
    )

    # Obdelaj sliko
    img = image.load_img(path, target_size=IMAGE_SIZE)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    # Izračunaj in normaliziraj embedding
    test_embedding = embedding_model.predict(img_array)[0]
    test_embedding = test_embedding / np.linalg.norm(test_embedding)

    # Pripravi embeddinge po osebah
    embedding_dir = "embeddings"
    user_embeddings = {}

    for file in os.listdir(embedding_dir):
        if not file.endswith(".npy"):
            continue
        username = "_".join(file.split("_")[:1])
        emb = np.load(os.path.join(embedding_dir, file))
        emb = emb / np.linalg.norm(emb)  # Normalize shranjene vektorje
        user_embeddings.setdefault(username, []).append(emb)

    # Primerjaj s povprečnim embeddingom
    min_dist = float("inf")
    matched_user = None

    for username, embeddings in user_embeddings.items():
        avg_emb = np.mean(embeddings, axis=0)
        avg_emb = avg_emb / np.linalg.norm(avg_emb)  # Varnostno ponovno
        dist = euclidean_distances([test_embedding], [avg_emb])[0][0]
        if dist < min_dist:
            min_dist = dist
            matched_user = username

    # Rezultat
    if min_dist < THRESHOLD:
        print(f"[✓] Uporabnik prepoznan kot: {matched_user} (razdalja: {min_dist:.4f})")
        return username #userid
    else:
        print(f"[✗] Uporabnik NI prepoznan (najbližja razdalja: {min_dist:.4f})")
        return 0
