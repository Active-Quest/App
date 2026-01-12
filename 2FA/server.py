from flask import Flask,request,jsonify,Response
import os
import numpy as np
from mpi4py import MPI
from queue import Queue
import sys

from augmentImages import processAllImages
from register_user import register_user_logic 
from verify_user import verify_user_logic

LOG_FILE = "/tmp/server.log"


sys.stdout = open(LOG_FILE,"a",buffering=1)
sys.stderr = open(LOG_FILE,"a",buffering=1)
app = Flask("Pyserver")

@app.route("/register", methods=["POST"])
def register():
    print("Start of register..\n",flush=True)
    if size < 2:
        return jsonify({"error":"No MPI workers available"}),500
    
    user_id = request.form["userId"]
    files = request.files.getlist("images")

    #posljem slike 
    for i, file in enumerate(files):
        print("Sending image to slave\n")
        img_bytes = file.read()
        comm.send({
            "cmd": "PROCESS",
            "user_id": user_id,
            "image": img_bytes
        }, dest=(i % (size-1)) + 1)

    results = []
    for _ in files:
        results.append(comm.recv(source=MPI.ANY_SOURCE))
    status = "error"
    if results[0]["success"] == True:
        status = "ok"
        
    return jsonify({"status": status})


@app.route("/verify", methods=["POST"])
def verify():
    file = request.files["image"]#dobi sliko
    path = "temp_verify.jpg"
    file.save(path)

    matched_user = verify_user_logic(path)
    os.remove(path)

    if(matched_user):
        return jsonify({"verified":True,"user":matched_user})
    return jsonify({"verified":False})

def worker_loop(comm, rank):
    print(f"Worker {rank} started", flush=True)

    while True:
        task = comm.recv(source=0)

        if task["cmd"] == "STOP":
            break

        user_id = task["user_id"]
        img_bytes = task["image"]

        #Unique image TEMPORARY!
        img_path = f"/tmp/{user_id}_{rank}.jpg"
        with open(img_path, "wb") as f:
            f.write(img_bytes)

        success = register_user_logic(user_id, [img_path])

        #TEMPORARY FOLDER
        embedding_dir = f"embeddings/worker_{rank}"
        os.makedirs(embedding_dir, exist_ok=True)

        embedding_files = [
            f for f in os.listdir(embedding_dir)
            if f.startswith(user_id) and f.endswith(".npy")
        ]

        embeddings = []

        for fname in embedding_files:
            emb_path = os.path.join(embedding_dir, fname)
            embeddings.append(np.load(emb_path))
            os.remove(emb_path)

        #clean up after working
        os.remove(img_path)

        #send back to server (master)
        comm.send({
            "user_id": user_id,
            "success": success,
            "embeddings": embeddings
        }, dest=0)

@app.route("/logs", methods=["GET"])
def show_logs():
    try:
        with open("/tmp/server.log","r") as f:
            content = f.read()
            return Response(content,mimetype = "text/plain")
    except FileNotFoundError:
        return "Log file not found", 404

if __name__ == "__main__":
    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    print(f"Rank: {rank}\n Size: {size}")
    
    if rank == 0:
        app.run(host="0.0.0.0", port=3737,debug=False,use_reloader=False)
        print(request)
    else:
        worker_loop(comm,rank)
    