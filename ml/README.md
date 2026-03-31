# TrustGen ML Service
# Local AI-powered 3D generation microservice
# Uses open-source models: Shap-E, TripoSR, InstantMesh

## Setup

```bash
cd ml
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Run

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

| Endpoint | Method | Input | Output |
|:---|:---|:---|:---|
| `POST /generate/shap-e` | Text → 3D | `{ "prompt": "a wooden table" }` | GLB binary |
| `POST /generate/triposr` | Image → 3D | Multipart form (image file) | GLB binary |
| `GET /health` | Health check | — | `{ "status": "ok" }` |
| `GET /models` | List models | — | `{ "models": [...] }` |

## Architecture

```
[TrustGen Frontend]
       ↓ fetch("http://localhost:8000/generate/shap-e")
[FastAPI Server (this)]
       ↓
[Shap-E / TripoSR / InstantMesh]
       ↓
[Generated .glb file]
       ↓ returned as binary response
[TrustGen Frontend auto-imports into scene]
```

## GPU Requirements

- **Shap-E**: Runs on CPU (~30s) or GPU (~5s). 4GB VRAM minimum.
- **TripoSR**: Requires GPU. 6GB VRAM minimum. ~5s per generation.
- **InstantMesh**: Requires GPU. 8GB VRAM minimum.

## License

All models used are open-source:
- Shap-E: MIT License (OpenAI)
- TripoSR: Apache 2.0 (Stability AI / Tripo)
- InstantMesh: Apache 2.0 (TencentARC)
