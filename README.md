# Real-Time Face Recognition Attendance System

Production-style attendance system with:

- React + Vite frontend
- Plain CSS admin panel
- Flask + Flask-SocketIO backend
- MongoDB persistence
- Live face recognition and registration using your external APIs

## Project Structure

```text
frdex/
  backend/
    app.py
    mongo_schema.js
    requirements.txt
  frontend/
    src/
    package.json
  README.md
```

## Backend Setup

1. Create a Python virtual environment.
2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Copy environment variables:

```bash
copy .env.example .env
```

4. Start MongoDB locally and create the database collections if needed:

```bash
mongosh < mongo_schema.js
```

5. Start the Flask server:

```bash
python app.py
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Start the Vite app:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Hardcoded Admin Login

- Username: `admin`
- Password: `admin123`

These can be changed in [backend/.env.example](/C:/Users/swara/OneDrive/Desktop/frdex/backend/.env.example).

## API Flow

### Live attendance

1. Browser webcam streams through `getUserMedia()`.
2. Frontend captures a JPEG base64 frame every 300ms.
3. Frame is emitted to Flask with Socket.IO using the `frame` event.
4. Flask sends the frame to your recognition API:
   `POST http://72.61.241.101:8000/find`
5. If `confidence >= ATTENDANCE_THRESHOLD` and the name is not `Unknown`, attendance is saved once per student per day.
6. Result is emitted back to the frontend as `recognition_result`.

### Student registration

1. Admin opens Add Student page.
2. Frontend captures the current webcam image.
3. Flask sends:
   `POST http://72.61.241.101:8000/register`
4. Student is upserted in MongoDB after successful registration.

## MongoDB Schema

### `users`

```json
{
  "name": "string",
  "createdAt": "date"
}
```

### `attendance`

```json
{
  "name": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "confidence": 0.92,
  "status": "Present"
}
```

## Main Features

- Real-time face recognition attendance
- Duplicate attendance prevention for the same day
- Admin login
- Dashboard metrics
- Student registration with webcam capture
- Attendance search and date filtering
- CSV export
- Dark mode toggle
- Socket reconnect handling
- API and socket error handling
- Responsive layout

## Notes

- The backend expects the external face APIs to accept JSON with base64 image strings.
- If your API expects multipart form data instead, update `call_face_api()` in [backend/app.py](/C:/Users/swara/OneDrive/Desktop/frdex/backend/app.py).
- For production deployment, replace the hardcoded admin auth with JWT/session-based authentication and move secrets into real environment configs.
