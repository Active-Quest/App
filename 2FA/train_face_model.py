import os
import numpy as np
from keras_vggface.vggface import VGGFace
from keras_vggface import utils
import tensorflow as tf
from tensorflow.keras import backend as K
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Dropout
from keras_vggface.utils import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator, load_img, img_to_array
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from sklearn.metrics.pairwise import euclidean_distances

print("Zagon skripte se je začel.")

# --- Parametri ---
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 10
EMBEDDING_DIM = 128

# --- Priprava podatkov ---
datagen = ImageDataGenerator(preprocessing_function=preprocess_input, validation_split=0.2)

train_data = datagen.flow_from_directory(
    'dataset',
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_data = datagen.flow_from_directory(
    'dataset',
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

print("Podatki naloženi:", train_data.samples, "slik")


# --- Gradnja modela ---
base_model = VGGFace(model='resnet50', include_top=False, input_shape=(224, 224, 3), pooling='avg')
base_model.trainable = False  # zamrzni VGG plasti

x = base_model.output
x = Dropout(0.5)(x)
x = Dense(EMBEDDING_DIM, activation='relu', name='embedding')(x)
output = Dense(train_data.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)
model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# --- Treniranje ---
model.fit(train_data, validation_data=val_data, epochs=EPOCHS)
model.save("face_classifier_model.h5")
print("[✓] Model shranjen kot face_classifier_model.h5")

# --- Ustvari embedding model brez softmaxa ---
embedding_model = Model(inputs=model.input, outputs=model.get_layer("embedding").output)

# --- Shrani embeddinge za vsako sliko ---
os.makedirs("embeddings", exist_ok=True)

for class_label in os.listdir("dataset"):
    class_dir = os.path.join("dataset", class_label)
    if not os.path.isdir(class_dir):
        continue
    for img_file in os.listdir(class_dir):
        img_path = os.path.join(class_dir, img_file)
        try:
            img_obj = load_img(img_path, target_size=IMAGE_SIZE)
            img_array = img_to_array(img_obj)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = preprocess_input(img_array)
            emb = embedding_model.predict(img_array)[0]
            name = f"{class_label}_{os.path.splitext(img_file)[0]}.npy"
            np.save(os.path.join("embeddings", name), emb)
            print(f"[✓] Embedding shranjen: embeddings/{name}")
        except Exception as e:
            print(f"[!] Napaka pri {img_path}: {e}")
