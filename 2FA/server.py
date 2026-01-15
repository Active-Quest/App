from flask import Flask, request, jsonify,Response
import os
import uuid
from mpi4py import MPI
import sys

from register_user import register_user_logic
from verify_user import verify_user_logic
from Compress_images.compress_images import compress_flocic,decompress_flocic

LOG_FILE = "/tmp/server.log"
sys.stdout = open(LOG_FILE,"a",buffering=1)
sys.stderr = open(LOG_FILE,"a",buffering=1)

app = Flask("Pyserver")
comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

print(f"[MPI] Rank {rank} of {size}", flush=True)


def ensure_dirs():
    dirs = ["/tmp/compressed", "/tmp/decompressed"]
    for d in dirs:
        if not os.path.exists(d):
            os.makedirs(d, exist_ok=True)
            print(f"[SYSTEM] Created directory: {d}", flush=True)

#SAMO MASTER (rank 0)
@app.route("/register", methods=["POST"])
def register():
    print("[MASTER] Start register", flush=True)
    ensure_dirs()
    if size < 2:
        return jsonify({"error": "No MPI workers available"}), 500

    user_id = request.form["userId"]
    files = request.files.getlist("images")
    if not files:
        files = request.files.getlist("images[]")

    print("FILES COUNT:", len(files), flush=True)

    num_tasks = len(files)
    if num_tasks == 0:
        return jsonify({"error": "No images provided"}), 400

    #RAZDELI TASK
    for i, file in enumerate(files):
        img_bytes = file.read()

        dest_rank = (i % (size - 1)) + 1 
        print(f"[MASTER] Sending task {i} to worker {dest_rank}", flush=True)
        #Shranim slike v tmp, in jih kompresiram z FLOCIC
        img_path = f"/tmp/{user_id}_{uuid.uuid4().hex}.png"
        compressed_img_path = f"/tmp/compressed/{user_id}_{i}.fcic";
        with open(img_path, "wb") as f:
            f.write(img_bytes)
        #KOMPRESIJA SLIKE
        compress_flocic(img_path,compressed_img_path)
        original_img_size = os.path.getsize(img_path)
        compressed_img_size = os.path.getsize(compressed_img_path)
        print(f"[{user_id}_{i}.fcic] - {compressed_img_size}\n [ORIGINAL] - {img_path}")

    
        comm.send(
            {
                "cmd": "PROCESS",
                "user_id": user_id,
                "compressed_image_path": compressed_img_path,
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
    ensure_dirs()
    while True:
        task = comm.recv(source=0)

        if task["cmd"] == "STOP":
            print(f"[WORKER {rank}] Stopping", flush=True)
            break

        user_id = task["user_id"]
        compressed_img_path = task["compressed_img_path"]

        #unique temp file
        #img_path = f"/tmp/{user_id}_{rank}_{uuid.uuid4().hex}.jpg"
        #with open(img_path, "wb") as f:
            #f.write(img_bytes)
        print(f"[WORKER {rank}] Processing image", flush=True)
        img_path = f"/tmp/decompressed/{user_id}_{rank}_{uuid.uuid4().hex}.png"
        #DEKOMPRESIJA FLOCIC 
        decompress_flocic(compressed_img_path,img_path)

        try:
            success = register_user_logic(user_id, [img_path])
        except Exception as e:
            print(f"[WORKER {rank}] ERROR: {e}", flush=True)
            success = False

        os.remove(img_path)
        os.remove(compressed_img_path)

        comm.send(
            {
                "user_id": user_id,
                "success": success
            },
            dest=0,
        )

@app.route("/logs",methods=["GET"])
def showLogs():
    try:
        with open("/tmp/server.log","r") as f:
            content = f.read()
            return Response(content,mimetype="text/plain")
    except FileNotFoundError:
        return "log file not found",404

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