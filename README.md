# NrityaVaani (नृत्यवाणी)

> **AI-Powered Indian Classical Dance & Mudra Learning Assistant**  
> On-device computer vision, real-time 3D skeletal rigging, bilingual audio coaching, and interactive pedagogy for Bharatanatyam.

---

## 🏛️ Overview

**NrityaVaani** preserves and digitizes the heritage of Indian classical dance through modern web technologies and computer vision. Built with privacy-first principles, all live webcam video processing runs **100% on-device** directly in the browser—no video frames or camera streams ever leave your computer.

### ✨ Key Features

* 📷 **Live Mudra Detection (`/live`)**: Real-time 21-point 3D hand tracking at 60 FPS identifying Asamyukta (single-hand) and Samyukta (double-hand) mudras.
* 🎙️ **Targeted Practice Coach (`/practice/[slug]`)**: Real-time posture scoring against target gestures with bilingual voice coaching (English & Hindi) powered by the Web Speech API.
* 💃 **Interactive 3D Lessons (`/learn`)**: 3D humanoid avatar demonstrating classical dance steps (e.g., *Namaskaram*, *Thattadavu*) synchronized with bilingual voice narration.
* 📖 **Mudra Encyclopedia (`/library`)**: Comprehensive reference library covering 28 classical mudras with step-by-step instructions, viniyoga (usages), and common mistakes.
* 🦴 **3D Motion Capture Lab (`/mocap`)**: In-browser full-body motion capture, bone jitter filtering, and real-time retargeting to 3D skinned models.
* 🖼️ **Photograph Analysis (`/upload`)**: Single-image gesture analysis running client-side with instant accuracy feedback.
* 🔒 **Private by Design (`/privacy`)**: WebAssembly & WebGL GPU acceleration ensure zero server video transmission.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
* **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
* **Core Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
* **Computer Vision AI**: [Google MediaPipe Tasks-Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) (Client-side WASM & WebGL)
* **3D Graphics & Kinematics**: [Three.js](https://threejs.org/) (GLTF/GLB models, custom hand kinematics, skeletal retargeting)
* **Audio**: HTML5 Audio (synchronized bilingual clips) & Web Speech Synthesis API
* **Icons**: [Lucide React](https://lucide.dev/)

### Backend (`/backend`)
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Server**: [Uvicorn](https://www.uvicorn.org/)
* **Validation**: [Pydantic v2](https://docs.pydantic.dev/)
* **Model Slot**: Configured to host custom deep learning models (`/backend/models`) for offline training and external API consumers.

---

## 📁 Project Architecture

```
NrityaVaani/
├── frontend/                     # Next.js 16 + React 19 + Three.js application
│   ├── public/
│   │   ├── images/               # Dance and mudra reference photography
│   │   ├── lessons/              # Baked .nvclip motion data and voice audio
│   │   └── models/               # 3D GLB models (figures.glb, hand.glb, natraj.glb)
│   ├── scripts/
│   │   └── build-mudra-poses.mjs # Offline kinematic solver generating mudraPoses.json
│   └── src/
│       ├── app/                  # Next.js App Router pages (live, learn, library, mocap, etc.)
│       ├── components/           # UI, layout, Three.js stages, and live HUD overlays
│       └── lib/                  # MediaPipe classification engine, motion codecs, stores
│
├── backend/                      # Python FastAPI inference microservice
│   ├── core/
│   │   └── classification.py     # Baseline mathematical heuristic classifier
│   ├── models/                   # Dedicated directory for trained model weights (*.pt, *.onnx)
│   ├── main.py                   # FastAPI application & /predict endpoint
│   └── requirements.txt          # Python dependencies
│
└── netlify.toml                  # Deployment configuration for the frontend
```

---

## 🚀 Getting Started

### 1. Run the Frontend (Web Application)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

> **Note**: For the best camera tracking and 3D performance, use **Google Chrome** or **Microsoft Edge** and allow camera access when prompted.

---

### 2. Run the Backend API (Optional / Model Service)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

Access the interactive Swagger documentation at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 👥 Team & Credits

Developed with ❤️ by **DivyCoders**:
* **Divyanand Pandey** — Team Lead
* **Mayank** — Team Member
* **Pranav Jithesh** — Team Member

*Presented at Dron Tech Fest 2026 (3rd Place).*
