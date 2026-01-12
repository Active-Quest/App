from flask import Flask, request, jsonify
import os
import uuid
from mpi4py import MPI

from register_user import register_user_logic
from verify_user import verify_user_logic

app = Flask("Pyserver")
comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

print(f"[MPI] Rank {rank} of {size}", flush=True)

#SAMO MASTER (rank 0)
@app.route("/register", methods=["POST"])
def register():
    print("[MASTER] Start register", flush=True)

    if size < 2:
        return jsonify({"error": "No MPI workers available"}), 500

    user_id = request.form["userId"]
    files = request.files.getlist("images")

    num_tasks = len(files)
    if num_tasks == 0:
        return jsonify({"error": "No images provided"}), 400

    #RAZDELI TASK
    for i, file in enumerate(files):
        img_bytes = file.read()

        dest_rank = (i % (size - 1)) + 1 
        print(f"[MASTER] Sending task {i} to worker {dest_rank}", flush=True)

        comm.send(
            {
                "cmd": "PROCESS",
                "user_id": user_id,
                "image": img_bytes,
            },
            dest=dest_rank,
        )

    #REZULTATI
    results = []
    for _ in range(num_tasks):
        result = comm.recv(source=MPI.ANY_SOURCE)
        print(f"[MASTER] Got result from worker", flush=True)
        results.append(result)

    success = all(r["success"] for r in results)

    return jsonify({
        "status": "ok" if success else "error",
        "processed": len(results)
    })


@app.route("/verify", methods=["POST"])
def verify():
    file = request.files["image"]
    path = f"/tmp/verify_{uuid.uuid4().hex}.jpg"
    file.save(path)

    matched_user = verify_user_logic(path)
    os.remove(path)

    if matched_user:
        return jsonify({"verified": True, "user": matched_user})

    return jsonify({"verified": False})


#WORKER 
def worker_loop():
    print(f"[WORKER {rank}] Started", flush=True)

    while True:
        task = comm.recv(source=0)

        if task["cmd"] == "STOP":
            print(f"[WORKER {rank}] Stopping", flush=True)
            break

        user_id = task["user_id"]
        img_bytes = task["image"]

        # unique temp file
        img_path = f"/tmp/{user_id}_{rank}_{uuid.uuid4().hex}.jpg"
        with open(img_path, "wb") as f:
            f.write(img_bytes)

        print(f"[WORKER {rank}] Processing image", flush=True)

        try:
            success = register_user_logic(user_id, [img_path])
        except Exception as e:
            print(f"[WORKER {rank}] ERROR: {e}", flush=True)
            success = False

        os.remove(img_path)

        comm.send(
            {
                "user_id": user_id,
                "success": success
            },
            dest=0,
        )

if __name__ == "__main__":
    if rank == 0:
        app.run(
            host="0.0.0.0",
            port=3737,
            debug=False,
            use_reloader=False,
            threaded=True,  #POMEMBNO
        )
    else:
        worker_loop()
