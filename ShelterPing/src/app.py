from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = "ShelterPing/src/mecdata.json"

# --- Helper functions ---

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# --- API routes ---

# Get all shelters
@app.route("/api/shelters", methods=["GET"])
def get_shelters():
    shelters = load_data()
    return jsonify(shelters)

# Add new shelter
@app.route("/api/shelters", methods=["POST"])
def add_shelter():
    shelters = load_data()
    new_shelter = request.json
    new_shelter["shelter_id"] = max([s["shelter_id"] for s in shelters], default=0) + 1
    shelters.append(new_shelter)
    save_data(shelters)
    return jsonify({"message": "Shelter added", "shelter": new_shelter}), 201

# Update existing shelter
@app.route("/api/shelters/<int:shelter_id>", methods=["PUT"])
def update_shelter(shelter_id):
    shelters = load_data()
    updated_data = request.json
    for s in shelters:
        if s["shelter_id"] == shelter_id:
            s.update(updated_data)
            save_data(shelters)
            return jsonify({"message": "Shelter updated", "shelter": s}), 200
    return jsonify({"error": "Shelter not found"}), 404

# Delete shelter
@app.route("/api/shelters/<int:shelter_id>", methods=["DELETE"])
def delete_shelter(shelter_id):
    shelters = load_data()
    new_shelters = [s for s in shelters if s["shelter_id"] != shelter_id]
    if len(new_shelters) == len(shelters):
        return jsonify({"error": "Shelter not found"}), 404
    save_data(new_shelters)
    return jsonify({"message": "Shelter deleted"}), 200

# Find nearest shelters
@app.route("/api/shelters/nearby", methods=["GET"])
def get_nearby_shelters():
    from math import radians, cos, sin, acos
    user_lat = request.args.get("lat")
    user_lon = request.args.get("lon")

    if user_lat is None or user_lon is None:
        return jsonify({"error": "Missing lat or lon parameters"}), 400

    user_lat = float(user_lat)
    user_lon = float(user_lon)

    shelters = load_data()
    for s in shelters:
        lat = s["shelter_latitude"]
        lon = s["shelter_longitude"]
        distance = 6371 * acos(
            cos(radians(user_lat)) * cos(radians(lat)) *
            cos(radians(lon) - radians(user_lon)) +
            sin(radians(user_lat)) * sin(radians(lat))
        )
        s["distance_km"] = round(distance, 2)
    shelters.sort(key=lambda x: x["distance_km"])
    return jsonify(shelters[:10])

# Root
@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Emergency Shelter JSON API is running!"})

if __name__ == "__main__":
    app.run(debug=True)