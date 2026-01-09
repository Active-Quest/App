from flask import Flask,request,jsonify
import os
import numpy as np
from mpi4py import MPI
from queue import Queue

from register_user import register_user_logic 
from verify_user import verify_user_logic

app = Flask("Pyserver")

@app.route("/register", methods=["POST"])
def register():
    print("Start of register..\n", flush=True)
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
        results.append(comm.recv())

    return jsonify({"status": "ok"})


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
    print("Starting worker loop\n")
    while True:
        task = comm.recv(source=0)

        if task["cmd"] == "STOP":
            break

        user_id = task["user_id"]
        img_bytes = task["image"]

        path = f"/tmp/{rank}.jpg"
        with open(path, "wb") as f:
            f.write(img_bytes)

        embedding = register_user_logic(user_id, [path])

        comm.send({
            "user_id": user_id,
            "embedding": embedding
        }, dest=0)

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
    