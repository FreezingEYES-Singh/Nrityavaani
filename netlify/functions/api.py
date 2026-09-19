"""
Netlify Serverless Function Handler for FastAPI
Allows deploying NrityaVaani backend directly on Netlify Functions using Mangum.
"""
import sys
from pathlib import Path

root_dir = str(Path(__file__).resolve().parent.parent.parent)
backend_dir = str(Path(__file__).resolve().parent.parent.parent / "backend")
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app

try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None
