from flask import Flask,request,jsonify
import os
import numpy as np

from register_user import register_user_logic 
from verify_user import verify_user_logic

app = Flask("Pyserver")

@app.route("/register",methods=["POST"])
def register():
    user_id = request.form["userId"]; #dobi userId iz requesta
    files = request.files.getlist("images")# 3 slike
    savedpaths = []

    for idx, file in enumerate(files):
        path = f"temp{user_id}{idx}.jpg" #shrani slike v formatu temp+ID+INDEX
        file.save(path)
        savedpaths.append(path)

    success = register_user_logic(user_id,savedpaths)
    for path in savedpaths:
        os.remove(path)
    
    return jsonify({"status":"ok"if success else "error"})

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3737)
