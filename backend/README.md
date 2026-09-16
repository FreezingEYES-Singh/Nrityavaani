# NrityaVaani - AI Backend Service

FastAPI prediction service for Bharatanatyam mudra classification and posture evaluation.

---

## 1. Overview
This service provides an inference API for hand gesture analysis.
* **Current State**: Uses a baseline mathematical heuristic engine in `core/classification.py` for 8 primary single-hand mudras (*Pataka, Tripataka, Ardhapataka, Kartarimukha, Mayura, Arala, Shukatunda, Alapadma*).
* **Future State**: Designed to host custom-trained deep learning models (PyTorch / TensorFlow / ONNX) dropped into the `models/` directory.

---

## 2. Getting Started

### Prerequisites
* Python 3.10+ installed

### Setup & Run
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment (recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
python main.py
# Or with hot-reloading:
uvicorn main:app --reload --port 8000
```

---

## 3. Interactive API Docs
Once the server is running, open your browser:
* **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. API Endpoints

### `GET /`
Health check endpoint.
```json
{
  "status": "online",
  "message": "NrityaVaani AI API is running"
}
```

### `POST /predict`
Evaluates 21 3D hand landmarks from MediaPipe.

**Request Body**:
```json
{
  "landmarks": [
    {"x": 0.5, "y": 0.7, "z": 0.0},
    ...
  ],
  "handedness": "Right"
}
```

**Response**:
```json
{
  "name": "Pataka",
  "confidence": 0.95,
  "feedback": "Excellent posture. Keep your palm flat."
}
```

---

## 5. Integrating Your Trained Models

When your custom-trained model is ready:
1. Place the model file (e.g., `model.onnx` or `model.pt`) inside `backend/models/`.
2. Add your framework dependencies (e.g., `torch`, `onnxruntime`, or `tensorflow`) to `requirements.txt`.
3. Load the model weights on startup in `main.py` and call inference inside `predict_mudra()`.
