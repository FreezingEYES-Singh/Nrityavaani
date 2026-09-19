# NrityaVaani (नृत्यवाणी)

> **AI-Powered Indian Classical Dance, Mudra Recognition & 3D Guru Assistant**  
> On-device computer vision, real-time 3D skeletal kinematics, Goonj-powered multilingual voice coaching, and interactive pedagogy for Bharatanatyam.

---

## Overview

**NrityaVaani** preserves, digitizes, and democratizes the heritage of Indian classical dance through modern web technologies, 3D kinematics, and neural voice synthesis. Built with privacy-first principles, all live webcam gesture recognition runs **100% on-device** directly in the browser—no video frames or camera streams ever leave your computer.

### Key Features

* **Goonj 3D Guru Voice Coaching (`/learn`)**: High-fidelity neural voice synthesis featuring 15 distinct Guru personas across 12 Indian languages (English, Hindi, Hinglish, Sanskrit, Tamil, Telugu, Malayalam, Kannada, Bengali, Odia, Marathi, Gujarati) with dynamic tempo synchronization.
* **Specialized Guru Voice Models**: Select from classical master archetypes tailored to pedagogical goals—from Natyacharyas commanding adavu footwork and tala, to lyrical preceptors guiding subtle abhinaya and sacred Sanskrit shlokas.
* **Distraction-Free 3D Natya Shala**: Pure, unobstructed 3D stage canvas with dual-gender rigs (male Natyacharya and female dancer), customizable camera presets (`Full Body`, `Face / Abhinaya`, `Mudras`, `Feet`), and instant frame fitting.
* **Live Mudra Detection (`/live`)**: Real-time 21-point 3D hand tracking at 60 FPS identifying Asamyukta (single-hand) and Samyukta (double-hand) classical mudras.
* **Targeted Practice Coach (`/practice/[slug]`)**: Real-time posture scoring against target gestures with interactive feedback.
* **Mudra Encyclopedia (`/library`)**: Interactive 3D reference library covering 28 classical mudras with step-by-step instructions, viniyoga (usages), and common mistake corrections.
* **3D Motion Capture Lab (`/mocap`)**: In-browser full-body motion capture, bone jitter filtering, and real-time retargeting to 3D skinned models.
* **Photograph Analysis (`/upload`)**: Single-image gesture analysis running client-side with instant accuracy feedback.
* **Private by Design (`/privacy`)**: WebAssembly & WebGL GPU acceleration ensure zero camera feed transmission.

---

## Tech Stack

### Frontend (`/frontend`)
* **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server & Client Components)
* **Core Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
* **Computer Vision AI**: [Google MediaPipe Tasks-Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) (Client-side WASM & WebGL)
* **3D Graphics & Kinematics**: [Three.js](https://threejs.org/) (GLTF/GLB models, custom hand kinematics, skeletal retargeting)
* **Audio Engine**: `GuruAudioEngine` with dynamic tempo sync, speech rate calibration, and memory/disk audio caching
* **Icons**: [Lucide React](https://lucide.dev/)

### Backend (`/backend`)
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
* **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI)
* **Speech Synthesis Engine**: Neural TTS & Goonj acoustic modulation (Edge Neural TTS + Goonj-1-82M / Kokoro pipeline)
* **Serverless Bridge**: [Mangum](https://mangum.io/) for Netlify & AWS Lambda serverless execution
* **Validation**: [Pydantic v2](https://docs.pydantic.dev/)

---

## Project Architecture

```
NrityaVaani/
├── main.py                       # Root ASGI entrypoint (uvicorn main:app --reload --port 8000)
├── requirements.txt              # Root Python dependencies
├── render.yaml                   # Render.com Blueprint configuration (Free Web Service)
├── netlify.toml                  # Netlify deployment & proxy configuration
│
├── netlify/
│   └── functions/
│       └── api.py                # Serverless Mangum handler for FastAPI on Netlify
│
├── frontend/                     # Next.js 16 + React 19 + Three.js application
│   ├── next.config.ts            # API rewrites & backend proxy routing
│   ├── public/
│   │   ├── images/               # Dance photography & Legends gallery
│   │   ├── lessons/              # Baked .nvclip motion data and voice audio
│   │   └── models/               # 3D GLB models (figures.glb, hand.glb, natraj.glb)
│   ├── scripts/
│   │   └── build-mudra-poses.mjs # Offline kinematic solver generating mudraPoses.json
│   └── src/
│       ├── app/                  # Next.js App Router pages (live, learn, library, mocap, etc.)
│       ├── components/           # UI, layout, Three.js stages, and 3D Lesson Player
│       └── lib/
│           ├── lesson/           # Lesson manifests & multilingual translation dictionaries
│           ├── motion/           # MediaPipe classification engine & motion codecs
│           └── voice/            # Goonj Audio Engine & 15 Guru Personas
│
└── backend/                      # Python FastAPI inference & Goonj TTS microservice
    ├── core/
    │   ├── goonj_tts.py          # Goonj Neural TTS synthesis engine & audio caching
    │   └── classification.py     # Mathematical heuristic gesture classifier
    ├── models/                   # Directory for trained model weights (*.pt, *.onnx)
    ├── main.py                   # FastAPI application routes & endpoints
    └── requirements.txt          # Backend Python dependencies
```

---

## Getting Started

### 1. Run the Backend API

You can start the FastAPI backend server directly from the repository root:

```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server with uvicorn
uvicorn main:app --reload --port 8000
```

> **Tip**: You can also run from inside the `backend/` folder using `uvicorn backend.main:app --reload --port 8000`.

* **Backend Healthcheck**: [http://localhost:8000/](http://localhost:8000/)
* **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Goonj TTS Personas Endpoint**: [http://localhost:8000/api/tts/personas](http://localhost:8000/api/tts/personas)

---

### 2. Run the Frontend

In a separate terminal:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

> **Note**: For optimal 3D rendering and camera landmark tracking, use **Google Chrome** or **Microsoft Edge** with hardware acceleration enabled.

---

### 3. Deploying the Backend to Render.com (Free Web Service)

NrityaVaani is fully configured for automated deployment on **Render.com** via the included [`render.yaml`](render.yaml) blueprint:

#### Option A: One-Click Blueprint Deployment
1. Log in to [render.com](https://render.com) with your GitHub account.
2. Click **New +** → **Blueprint**.
3. Select the **`divycoders/NrityaVaani`** repository.
4. Render automatically detects [`render.yaml`](render.yaml) and configures:
   - **Name**: `nrityavaani-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check**: `/`
   - **Plan**: **Free** ($0/month)
5. Click **Apply**. Once built, your backend is live with an HTTPS URL (e.g. `https://nrityavaani-backend.onrender.com`).

#### Option B: Manual Web Service Setup
1. On Render, click **New +** → **Web Service**.
2. Connect your repository `divycoders/NrityaVaani`.
3. Set:
   - **Name**: `nrityavaani-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
4. Click **Create Web Service**.

#### Connecting Render Backend with Netlify Frontend
In your **Netlify Site Configuration** → **Environment variables**, set:
- **`BACKEND_URL`**: `https://nrityavaani-backend.onrender.com`
- **`NEXT_PUBLIC_BACKEND_URL`**: `https://nrityavaani-backend.onrender.com`

Netlify and Next.js will automatically proxy all `/api/tts/*` and `/predict` requests to your hosted FastAPI backend, enabling real-time Goonj voice synthesis and gesture predictions!

---

### 4. Running with Netlify

NrityaVaani includes full configuration for Netlify deployment and local development via `netlify.toml`:

#### Local Development with Netlify CLI
If you have the Netlify CLI installed (`npm install -g netlify-cli`):

```bash
# Runs frontend on port 3000 and proxies API calls to backend
netlify dev
```

#### Deploying on Netlify
* **Frontend**: Netlify automatically builds `frontend/` using `@netlify/plugin-nextjs`.
* **Backend API Options**:
  1. **Netlify Functions**: Pre-configured in `netlify/functions/api.py` with Mangum. Requests to `/api/tts/*` and `/predict` automatically route to the serverless function.
  2. **Standalone Backend (Render / Railway / Fly.io / VPS)**: Set the `BACKEND_URL` environment variable in your Netlify site settings (e.g. `https://your-api.onrender.com`). Next.js and Netlify will seamlessly proxy all `/api/tts/*` requests to your hosted FastAPI instance.

---

## 🎙️ Goonj Guru Voice Personas

NrityaVaani incorporates 15 distinct Guru voices with tailored pedagogy and acoustics:

| Persona | Gender | Language / Dialect | Tone & Signature | Best Suited For |
| :--- | :--- | :--- | :--- | :--- |
| **Guru Priya** | Female | Indian English (`en`) | Articulate & Encouraging | Clear diction, contemporary pedagogy & anatomical precision |
| **Guru Arjun** | Male | Indian English (`en`) | Commanding & Rhythmic | Adavu footwork, energetic rhythm & driving tala |
| **Guru Ananya** | Female | Indian English (`en`) | Gentle & Melodic | Delicate mudras, abhinaya nuances & beginners |
| **Guru Kabir** | Male | Indian English (`en`) | Firm & Authoritative | Strict tala, rhythm drills & stamina |
| **Guru Divya** | Female | Indian English (`en`) | Meticulous & Poised | Body alignment, knee turnout & balance |
| **Guru Dev** | Male | Indian English (`en`) | Calm & Measured | Meditative flow, breath awareness & slow practice |
| **Guru Nisha** | Female | Modern English (`en`) | Crisp & Contemporary | International learners & global clarity |
| **Guru Sameer** | Male | Indian English (`en`) | Warm & Approachable | Easing beginner tension & building immediate confidence |
| **Guru Tara** | Female | Indian English (`en`) | Joyful & Radiant | Vitality, uplifting energy & soloist presentation |
| **Guru Aman** | Male | Indian English (`en`) | Methodical & Patient | Hand-foot coordination drills & breaking complex bols |
| **Guru Meera** | Female | Classical Hindi (`hi`) | Warm & Emotive | Traditional abhinaya, mudra nuance & devotional rasa |
| **Guru Atul** | Male | Shastri Baritone (`hi`) | Deep & Resonant | Natyashastra shlokas, sacred chants & dignified recitation |
| **Guru Shivani** | Female | Vibrant Hindi (`hi`) | Bright & Inspiring | Navarasa, facial abhinaya & eye glances |
| **Guru Ravi** | Male | Dynamic Hindi (`hi`) | Bold & Motivating | Tandava drills, stamina & vigorous form |
| **Guru Parampara** | Female | Vedic Sanskrit (`sa`) | Sacred Vedic Intonation | Pure Natyashastra shlokas, invocations & mantras |

---

## Team & Credits

Developed with ❤️ by **DivyCoders**:
* **Mayank** — Team Lead
* **Divyanand Pandey** — Team Lead
* **Manthan** — Team Member
* **Pranav Jithesh** — Team Member