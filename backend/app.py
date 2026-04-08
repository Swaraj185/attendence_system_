import base64
import io
import os
import threading
from datetime import datetime

import requests
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient

load_dotenv()

FACE_FIND_API = os.getenv("FACE_FIND_API", "http://72.61.241.101:8000/find")
FACE_REGISTER_API = os.getenv("FACE_REGISTER_API", "http://72.61.241.101:8000/register")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "attendance_system")
ATTENDANCE_THRESHOLD = float(os.getenv("ATTENDANCE_THRESHOLD", "0.8"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
PORT = int(os.getenv("PORT", "5000"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "attendance-secret")
CORS(app)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    ping_timeout=20,
    ping_interval=10,
    async_mode="threading",
)

mongo_client = MongoClient(MONGODB_URI)
db = mongo_client[DB_NAME]
accounts_collection = db["accounts"]
users_collection = db["users"]
attendance_collection = db["attendance"]
frame_processing_lock = threading.Lock()

for collection, index_name in (
    (users_collection, "name_1"),
    (attendance_collection, "name_1_date_1"),
):
    try:
        collection.drop_index(index_name)
    except Exception:
        pass

accounts_collection.create_index("email", unique=True)
users_collection.create_index([("ownerId", 1), ("name", 1)], unique=True)
attendance_collection.create_index([("ownerId", 1), ("name", 1), ("date", 1)], unique=True)
attendance_collection.create_index("date")


def get_today_strings():
    now = datetime.now()
    return now.strftime("%Y-%m-%d"), now.strftime("%H:%M")


def normalize_base64_image(image_data: str) -> str:
    if not image_data:
        raise ValueError("Image data is required.")
    if "," in image_data:
        return image_data.split(",", 1)[1]
    return image_data


def decode_base64_image(image_data: str) -> bytes:
    try:
        return base64.b64decode(image_data, validate=True)
    except Exception as exc:
        raise ValueError("Invalid base64 image data.") from exc


def build_image_file(image_bytes: bytes):
    return {"file": ("image.jpg", io.BytesIO(image_bytes), "image/jpeg")}


def extract_response_detail(response):
    try:
        payload = response.json()
        if isinstance(payload, dict):
            return payload.get("detail") or payload.get("message") or str(payload)
        return str(payload)
    except ValueError:
        return response.text.strip()


def call_face_find_api(image_data: str):
    image_bytes = decode_base64_image(image_data)
    files = build_image_file(image_bytes)
    try:
        response = requests.post(FACE_FIND_API, files=files, timeout=10)
    except requests.Timeout as exc:
        raise requests.Timeout("Face recognition API timed out after 10 seconds.") from exc

    print(f"[FACE_FIND_API] status_code={response.status_code}")
    print(f"[FACE_FIND_API] response_text={response.text}")

    if not response.ok:
        detail = extract_response_detail(response)
        raise requests.HTTPError(
            f"{response.status_code} {response.reason}: {detail}",
            response=response,
        )

    return response.json()


def call_face_register_api(name: str, image_data: str):
    image_bytes = decode_base64_image(image_data)
    files = build_image_file(image_bytes)
    data = {"name": name}
    try:
        response = requests.post(FACE_REGISTER_API, files=files, data=data, timeout=10)
    except requests.Timeout as exc:
        raise requests.Timeout("Face registration API timed out after 10 seconds.") from exc

    print(f"[FACE_REGISTER_API] status_code={response.status_code}")
    print(f"[FACE_REGISTER_API] response_text={response.text}")

    if not response.ok:
        detail = extract_response_detail(response)
        raise requests.HTTPError(
            f"{response.status_code} {response.reason}: {detail}",
            response=response,
        )

    return response.json()


def build_attendance_payload(name: str, confidence: float):
    date_str, time_str = get_today_strings()
    return {
        "name": name,
        "date": date_str,
        "time": time_str,
        "confidence": round(float(confidence), 4),
        "status": "Present",
    }


def mark_attendance(name: str, confidence: float):
    date_str, _ = get_today_strings()
    existing = attendance_collection.find_one({"name": name, "date": date_str})
    if existing:
        return False, existing

    payload = build_attendance_payload(name, confidence)
    attendance_collection.insert_one(payload)
    return True, payload


def serialize_document(document):
    if not document:
        return None
    serialized = dict(document)
    if "_id" in serialized:
        serialized["id"] = str(serialized.pop("_id"))
    if isinstance(serialized.get("createdAt"), datetime):
        serialized["createdAt"] = serialized["createdAt"].isoformat()
    return serialized


def get_request_user_id():
    return (request.headers.get("X-User-Id") or "").strip()


def require_request_user():
    user_id = get_request_user_id()
    if not user_id:
        return None, (jsonify({"message": "Unauthorized request."}), 401)

    if user_id == "admin-local":
        return {"_id": "admin-local", "email": "admin@facetrack.local", "role": "admin"}, None

    try:
        account = accounts_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        account = None

    if not account:
        return None, (jsonify({"message": "Invalid user session."}), 401)

    return account, None


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/auth/register")
def register_account():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name or not email or not password:
        return jsonify({"message": "All fields are required."}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long."}), 400

    existing = accounts_collection.find_one({"email": email})
    if existing:
        return jsonify({"message": "An account with this email already exists."}), 409

    account = {
        "fullName": full_name,
        "email": email,
        "password": password,
        "role": "member",
        "createdAt": datetime.utcnow(),
    }
    result = accounts_collection.insert_one(account)

    return jsonify(
        {
            "message": "Registration successful. You can sign in now.",
            "user": {
                "id": str(result.inserted_id),
                "fullName": full_name,
                "email": email,
                "role": "member",
            },
        }
    )


@app.post("/api/auth/login")
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or data.get("username") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    if email in {"admin", "admin@facetrack.local"} and password == ADMIN_PASSWORD:
        return jsonify(
            {
                "success": True,
                "user": {
                    "id": "admin-local",
                    "username": ADMIN_USERNAME,
                    "fullName": "Admin",
                    "email": "admin@facetrack.local",
                    "role": "admin",
                },
            }
        )

    account = accounts_collection.find_one({"email": email, "password": password})
    if not account:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    return jsonify(
        {
            "success": True,
            "user": {
                "id": str(account["_id"]),
                "fullName": account.get("fullName", ""),
                "email": account["email"],
                "role": account.get("role", "member"),
            },
        }
    )


@app.get("/api/dashboard/stats")
def dashboard_stats():
    account, error_response = require_request_user()
    if error_response:
        return error_response

    today, _ = get_today_strings()
    owner_id = str(account["_id"])
    total_students = users_collection.count_documents({"ownerId": owner_id})
    present_today = attendance_collection.count_documents({"date": today, "ownerId": owner_id})
    absent_today = max(total_students - present_today, 0)

    return jsonify(
        {
            "totalStudents": total_students,
            "presentToday": present_today,
            "absentToday": absent_today,
            "date": today,
        }
    )


@app.post("/api/students")
def add_student():
    account, error_response = require_request_user()
    if error_response:
        return error_response

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    image = data.get("image")

    if not name or not image:
        return jsonify({"message": "Name and image are required."}), 400

    try:
        base64_image = normalize_base64_image(image)
        register_response = call_face_register_api(name, base64_image)
        owner_id = str(account["_id"])
        users_collection.update_one(
            {"name": name, "ownerId": owner_id},
            {
                "$setOnInsert": {"createdAt": datetime.utcnow()},
                "$set": {"name": name, "ownerId": owner_id, "ownerEmail": account["email"]},
            },
            upsert=True,
        )
        return jsonify({"message": register_response.get("message", "User registered successfully")})
    except requests.Timeout as exc:
        return jsonify({"message": str(exc)}), 504
    except requests.RequestException as exc:
        return jsonify({"message": f"Registration API failed: {exc}"}), 502
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400


@app.get("/api/students")
def get_students():
    account, error_response = require_request_user()
    if error_response:
        return error_response

    students = [
        serialize_document(student)
        for student in users_collection.find({"ownerId": str(account["_id"])}).sort("name", 1)
    ]
    return jsonify(students)


@app.get("/api/attendance")
def get_attendance():
    account, error_response = require_request_user()
    if error_response:
        return error_response

    date = request.args.get("date")
    search = request.args.get("search", "").strip()
    query = {"ownerId": str(account["_id"])}

    if date:
        query["date"] = date
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    records = [
        serialize_document(record)
        for record in attendance_collection.find(query, {"_id": 0}).sort([("date", -1), ("time", -1)])
    ]
    return jsonify(records)


@app.get("/api/attendance/export")
def export_attendance():
    account, error_response = require_request_user()
    if error_response:
        return error_response

    date = request.args.get("date")
    search = request.args.get("search", "").strip()
    query = {"ownerId": str(account["_id"])}

    if date:
        query["date"] = date
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    rows = [
        serialize_document(record)
        for record in attendance_collection.find(query, {"_id": 0}).sort([("date", -1), ("time", -1)])
    ]
    return jsonify({"rows": rows})


@socketio.on("connect")
def handle_connect():
    print("Socket client connected")
    emit("connection_status", {"connected": True, "message": "Socket connected"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


@socketio.on("frame")
def handle_frame(data):
    image = (data or {}).get("image")
    user_id = ((data or {}).get("userId") or "").strip()

    if not image:
        emit("result", {"status": "error", "message": "Frame image is missing."})
        return

    if not user_id:
        emit("result", {"status": "error", "message": "Missing user context for attendance."})
        return

    if user_id == "admin-local":
        account = {"_id": "admin-local", "email": "admin@facetrack.local", "role": "admin"}
    else:
        account = accounts_collection.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None

    if not account:
        emit("result", {"status": "error", "message": "Invalid user context for attendance."})
        return

    if not frame_processing_lock.acquire(blocking=False):
        return

    try:
        base64_image = normalize_base64_image(image)
        result = call_face_find_api(base64_image)
        api_status = (result.get("status") or "").strip().lower()
        name = result.get("name", "")
        similarity = float(result.get("similarity", result.get("confidence", 0)) or 0)
        local_student = users_collection.find_one({"name": name, "ownerId": user_id}) if name else None
        locally_registered = bool(local_student)
        recognized = bool(api_status == "matched" and name and similarity >= ATTENDANCE_THRESHOLD and locally_registered)

        attendance_saved = False
        attendance_record = None

        if recognized:
            date_str, _ = get_today_strings()
            existing = attendance_collection.find_one({"name": name, "date": date_str, "ownerId": user_id})
            if existing:
                attendance_saved, record = False, existing
            else:
                record = build_attendance_payload(name, similarity)
                record["ownerId"] = user_id
                record["ownerEmail"] = account["email"]
                attendance_collection.insert_one(record)
                attendance_saved = True
            attendance_record = serialize_document(record)

        payload = {
            "name": name,
            "confidence": similarity,
            "similarity": similarity,
            "status": "not registered" if api_status == "matched" and not locally_registered else (api_status or "unknown"),
            "message": result.get("message", ""),
            "attendanceSaved": attendance_saved,
            "attendanceRecord": attendance_record,
            "locallyRegistered": locally_registered,
            "timestamp": datetime.utcnow().isoformat(),
            "threshold": ATTENDANCE_THRESHOLD,
        }
        emit("result", payload)
    except requests.Timeout as exc:
        emit(
            "result",
            {
                "status": "timeout",
                "message": str(exc),
            },
        )
    except requests.RequestException as exc:
        emit(
            "result",
            {
                "status": "error",
                "message": f"Face recognition API failed: {exc}",
            },
        )
    except Exception as exc:
        emit(
            "result",
            {
                "status": "error",
                "message": f"Unexpected error: {exc}",
            },
        )
    finally:
        if frame_processing_lock.locked():
            frame_processing_lock.release()


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=PORT, debug=True)
