FROM python:3.10

RUN apt-get update && \
    apt-get install -y \
        libgl1 \
        libglx-mesa0 \
        mpich \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt && \
    sed -i 's/from keras.engine.topology import get_source_inputs/from tensorflow.keras.utils import get_source_inputs/' /usr/local/lib/python3.10/site-packages/keras_vggface/models.py

EXPOSE 3737
CMD ["mpiexec", "-n", "3", "python", "server.py"]

