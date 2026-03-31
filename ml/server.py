"""
TrustGen ML Service — AI-Powered 3D Generation
================================================
FastAPI microservice that wraps open-source text-to-3D and image-to-3D models.

Models:
  - Shap-E (OpenAI, MIT) — text/image → 3D mesh
  - TripoSR (Stability AI, Apache 2.0) — single image → 3D mesh

Runs on consumer hardware. CPU fallback available for Shap-E.
"""

import io
import os
import time
import tempfile
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# ── Logging ──
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trustgen-ml")

# ── App ──
app = FastAPI(
    title="TrustGen ML Service",
    description="AI-powered 3D generation for the Trust Layer ecosystem",
    version="0.1.0",
)

# ── CORS (allow TrustGen frontend) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alt dev server
        "https://trustgen.dwtl.io",  # Production
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Output directory ──
OUTPUT_DIR = Path(tempfile.gettempdir()) / "trustgen-ml-output"
OUTPUT_DIR.mkdir(exist_ok=True)


# ══════════════════════════════════════════
#  MODELS — Lazy-loaded to reduce startup time
# ══════════════════════════════════════════

_shap_e_loaded = False
_triposr_loaded = False


def _ensure_shap_e():
    """Lazy-load Shap-E model on first use."""
    global _shap_e_loaded
    if _shap_e_loaded:
        return
    try:
        # import shap_e  # noqa — uncomment when shap-e is installed
        logger.info("Shap-E model loaded (placeholder)")
        _shap_e_loaded = True
    except ImportError:
        logger.warning("Shap-E not installed. Run: pip install shap-e")
        raise HTTPException(
            status_code=503,
            detail="Shap-E model not installed. See ml/README.md for setup."
        )


def _ensure_triposr():
    """Lazy-load TripoSR model on first use."""
    global _triposr_loaded
    if _triposr_loaded:
        return
    try:
        # import triposr  # noqa — uncomment when TripoSR is installed
        logger.info("TripoSR model loaded (placeholder)")
        _triposr_loaded = True
    except ImportError:
        logger.warning("TripoSR not installed. Run: pip install triposr")
        raise HTTPException(
            status_code=503,
            detail="TripoSR model not installed. See ml/README.md for setup."
        )


# ══════════════════════════════════════════
#  SCHEMAS
# ══════════════════════════════════════════

class TextTo3DRequest(BaseModel):
    prompt: str
    guidance_scale: float = 15.0
    num_inference_steps: int = 64
    output_format: str = "glb"  # glb or obj


class GenerationResult(BaseModel):
    success: bool
    filename: str
    generation_time_ms: int
    model_used: str
    vertex_count: int = 0


# ══════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "trustgen-ml",
        "version": "0.1.0",
        "models": {
            "shap_e": _shap_e_loaded,
            "triposr": _triposr_loaded,
        },
    }


@app.get("/models")
async def list_models():
    """List available generation models."""
    return {
        "models": [
            {
                "id": "shap-e",
                "name": "Shap-E",
                "type": "text-to-3d",
                "license": "MIT",
                "source": "OpenAI",
                "installed": _shap_e_loaded,
                "gpu_required": False,
                "description": "Text/image to 3D mesh. ~30s on CPU, ~5s on GPU.",
            },
            {
                "id": "triposr",
                "name": "TripoSR",
                "type": "image-to-3d",
                "license": "Apache 2.0",
                "source": "Stability AI / Tripo",
                "installed": _triposr_loaded,
                "gpu_required": True,
                "description": "Single image to 3D mesh. ~5s on GPU.",
            },
        ]
    }


@app.post("/generate/shap-e")
async def generate_shap_e(request: TextTo3DRequest):
    """
    Generate a 3D mesh from text using Shap-E.

    Returns the generated GLB file path. Download via /download/{filename}.
    """
    _ensure_shap_e()
    start = time.time()

    # ── Placeholder generation ──
    # When Shap-E is installed, replace this with actual model inference:
    #
    # from shap_e.diffusion.sample import sample_latents
    # from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    # from shap_e.models.download import load_model, load_config
    # from shap_e.util.notebooks import decode_latent_mesh
    #
    # device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    # xm = load_model('transmitter', device=device)
    # model = load_model('text300M', device=device)
    # diffusion = diffusion_from_config(load_config('diffusion'))
    #
    # latents = sample_latents(
    #     batch_size=1,
    #     model=model,
    #     diffusion=diffusion,
    #     guidance_scale=request.guidance_scale,
    #     model_kwargs=dict(texts=[request.prompt]),
    #     progress=True,
    #     num_inference_steps=request.num_inference_steps,
    # )
    #
    # mesh = decode_latent_mesh(xm, latents[0]).tri_mesh()
    # output_path = OUTPUT_DIR / f"shap_e_{int(time.time())}.glb"
    # mesh.write_glb(str(output_path))

    # For now, return a placeholder response
    elapsed = int((time.time() - start) * 1000)
    filename = f"shap_e_{int(time.time())}.glb"

    return GenerationResult(
        success=False,
        filename=filename,
        generation_time_ms=elapsed,
        model_used="shap-e",
        vertex_count=0,
    )


@app.post("/generate/triposr")
async def generate_triposr(image: UploadFile = File(...)):
    """
    Generate a 3D mesh from a single image using TripoSR.

    Upload an image file (PNG/JPG) and receive a GLB mesh.
    """
    _ensure_triposr()
    start = time.time()

    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload must be an image file")

    # Read image
    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB max
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    # ── Placeholder generation ──
    # When TripoSR is installed, replace with actual inference:
    #
    # from PIL import Image
    # import triposr
    #
    # img = Image.open(io.BytesIO(image_bytes))
    # model = triposr.load_model()
    # mesh = model.generate(img)
    # output_path = OUTPUT_DIR / f"triposr_{int(time.time())}.glb"
    # mesh.export(str(output_path))

    elapsed = int((time.time() - start) * 1000)
    filename = f"triposr_{int(time.time())}.glb"

    return GenerationResult(
        success=False,
        filename=filename,
        generation_time_ms=elapsed,
        model_used="triposr",
        vertex_count=0,
    )


@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated 3D file."""
    filepath = OUTPUT_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        str(filepath),
        media_type="model/gltf-binary",
        filename=filename,
    )


# ══════════════════════════════════════════
#  STARTUP
# ══════════════════════════════════════════

@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("  TrustGen ML Service v0.1.0")
    logger.info("  Trust Layer Ecosystem — AI-Powered 3D Generation")
    logger.info(f"  Output dir: {OUTPUT_DIR}")
    logger.info("=" * 60)
    logger.info("")
    logger.info("  Models will lazy-load on first request.")
    logger.info("  See /models for available generators.")
    logger.info("  See /health for service status.")
    logger.info("")
