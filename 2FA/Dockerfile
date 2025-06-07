FROM python:3.10

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt && \
    sed -i 's/from keras.engine.topology import get_source_inputs/from tensorflow.keras.utils import get_source_inputs/' /usr/local/lib/python3.10/site-packages/keras_vggface/models.py

EXPOSE 3737
CMD ["python", "server.py"]
