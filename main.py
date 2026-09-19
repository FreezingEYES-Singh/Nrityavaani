"""
NrityaVaani - Main ASGI Entrypoint
Allows running 'uvicorn main:app --reload --port 8000' directly from the repository root.
"""
import sys
from pathlib import Path

# Ensure root and backend directories are in sys.path
root_dir = str(Path(__file__).resolve().parent)
backend_dir = str(Path(__file__).resolve().parent / "backend")
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
