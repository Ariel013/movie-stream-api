"""
Movie Stream API v3
-------------------
Simule un flux temps réel de commentaires utilisateurs sur des séries Netflix.
- Dataset compressé gzip (~30 Mo pour 5000 commentaires/film)
- Curseur temporel déterministe (sans état serveur)
- Indicateur de cycle complet
- Endpoint /stats avec compteurs en mémoire
- Swagger enrichi
"""

import gzip
import json
import math
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Optional, Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Configuration ──────────────────────────────────────────────────────────────
INTERVAL_SECONDS = int(os.environ.get("INTERVAL_SECONDS", 300))
API_VERSION      = "3.0.0"

# Cherche d'abord le .gz, fallback sur .json non compressé
_BASE      = os.path.join(os.path.dirname(__file__), '..', 'data')
DATA_GZ    = os.path.join(_BASE, 'comments.json.gz')
DATA_JSON  = os.path.join(_BASE, 'comments.json')
# ──────────────────────────────────────────────────────────────────────────────

# ── Compteurs en mémoire ───────────────────────────────────────────────────────
_stats: dict = {
    "total_requests": 0,
    "total_served":   0,
    "per_movie":      defaultdict(int),
    "started_at":     time.time(),
}
# ──────────────────────────────────────────────────────────────────────────────

DATASET: dict[str, list] = {}
MOVIES:  list[str]        = []


def _load_dataset():
    global DATASET, MOVIES

    # Priorité au fichier gzip
    if os.path.exists(DATA_GZ):
        path     = DATA_GZ
        opener   = lambda: gzip.open(DATA_GZ, 'rb')
        label    = "gzip"
    elif os.path.exists(DATA_JSON):
        path     = DATA_JSON
        opener   = lambda: open(DATA_JSON, 'r', encoding='utf-8')
        label    = "json"
    else:
        print("⚠️  Aucun dataset trouvé — lancez generate_dataset.py")
        return

    with opener() as f:
        raw     = f.read()
        DATASET = json.loads(raw if isinstance(raw, str) else raw.decode('utf-8'))

    MOVIES      = list(DATASET.keys())
    total       = sum(len(v) for v in DATASET.values())
    size_mb     = os.path.getsize(path) / 1024 / 1024
    hours       = (len(DATASET[MOVIES[0]]) * INTERVAL_SECONDS) / 3600 if MOVIES else 0

    print(f"✅ Dataset chargé ({label}) : {len(MOVIES)} films · "
          f"{total} commentaires · {size_mb:.1f} Mo")
    print(f"   Cycle 2 dans : {hours:.0f}h ({hours/24:.1f} jours)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_dataset()
    _stats["started_at"] = time.time()
    yield


# ── Pydantic models ────────────────────────────────────────────────────────────

class CommentOut(BaseModel):
    id:             str   = Field(..., example="STR-289341")
    movie:          str   = Field(..., example="Stranger Things")
    comment:        str   = Field(..., example="Just finished Stranger Things and it totally blew my mind.")
    sentiment:      str   = Field(..., example="positive",
                                  description="⚠️ Pour évaluation uniquement — ne pas utiliser pour classifier")
    timestamp:      float = Field(..., example=1718123456.789)
    index:          int   = Field(..., example=41,
                                  description="Position dans le dataset du film (0 → total-1)")
    total:          int   = Field(..., example=5000,
                                  description="Nombre total de commentaires pour ce film")
    cycle:          int   = Field(..., example=1,
                                  description="Numéro du cycle (1 = premier passage, 2 = répétition...)")
    cycle_progress: float = Field(..., example=0.0082,
                                  description="Progression 0.0 → 1.0 dans le cycle actuel")


class SingleMovieResponse(BaseModel):
    mode:             str        = Field(..., example="single_movie")
    interval_seconds: int        = Field(..., example=300)
    next_comment_in:  int        = Field(..., example=47,
                                         description="Secondes avant le prochain commentaire — utiliser pour time.sleep()")
    comment:          CommentOut


class AllMoviesResponse(BaseModel):
    mode:             str             = Field(..., example="all_movies")
    interval_seconds: int             = Field(..., example=300)
    next_comment_in:  int             = Field(..., example=47)
    count:            int             = Field(..., example=30)
    comments:         list[CommentOut]


class MovieInfo(BaseModel):
    name:           str = Field(..., example="Stranger Things")
    total_comments: int = Field(..., example=5000)


class MoviesResponse(BaseModel):
    count:  int             = Field(..., example=30)
    movies: list[MovieInfo]


class StatsResponse(BaseModel):
    uptime_seconds:   float = Field(..., example=3600.5)
    total_requests:   int   = Field(..., example=142)
    total_served:     int   = Field(..., example=142)
    interval_seconds: int   = Field(..., example=300)
    movies_available: int   = Field(..., example=30)
    top_movies:       list  = Field(..., description="Top 5 des films les plus demandés")


class HealthResponse(BaseModel):
    status: str   = Field(..., example="ok")
    movies: int   = Field(..., example=30)
    uptime: float = Field(..., example=3600.5)


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="🎬 Movie Stream API",
    description="""
## Simulation de flux temps réel de commentaires Netflix

API conçue pour un projet de **Sentiment Analysis avec Apache Kafka**.

### Fonctionnement

Un **curseur temporel déterministe** avance automatiquement :
- Toutes les `INTERVAL_SECONDS` secondes, le curseur avance d'un cran
- Le dataset contient **5000 commentaires par film** → 17 jours avant répétition

### Gestion des cycles

Quand tous les commentaires ont été servis, le curseur repart au début.
Le champ `cycle` indique le numéro du passage (`1` = premier, `2` = répétition...).
Le champ `cycle_progress` indique la progression de `0.0` à `1.0` dans le cycle actuel.

### ⚠️ Règle importante

Le champ `sentiment` est fourni **uniquement pour évaluer votre modèle**.
**Ne l'utilisez pas pour classifier** dans votre consumer Kafka.
    """,
    version=API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _build_comment(movie: str) -> tuple[CommentOut, int]:
    comments = DATASET.get(movie)
    if not comments:
        raise HTTPException(
            status_code=404,
            detail={
                "error":     f"Film '{movie}' introuvable.",
                "available": MOVIES,
                "hint":      "Vérifiez l'orthographe. Utilisez GET /movies pour la liste complète."
            }
        )

    tick           = math.floor(time.time() / INTERVAL_SECONDS)
    total          = len(comments)
    index          = tick % total
    cycle          = (tick // total) + 1
    cycle_progress = round(index / total, 4)
    item           = comments[index]
    seconds_left   = max(0, round(((tick + 1) * INTERVAL_SECONDS) - time.time()))

    comment = CommentOut(
        id             = f"{movie[:3].upper().replace(' ', '')}-{tick}",
        movie          = movie,
        comment        = item["comment"],
        sentiment      = item["sentiment"],
        timestamp      = round(time.time(), 3),
        index          = index,
        total          = total,
        cycle          = cycle,
        cycle_progress = cycle_progress,
    )
    return comment, seconds_left


def _tick_stats(movie: Optional[str], count: int):
    _stats["total_requests"] += 1
    _stats["total_served"]   += count
    if movie:
        _stats["per_movie"][movie] += 1
    else:
        for m in MOVIES:
            _stats["per_movie"][m] += 1


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["ℹ️ Info"], summary="Informations générales")
def root():
    return {
        "name":             "Movie Stream API",
        "version":          API_VERSION,
        "interval_seconds": INTERVAL_SECONDS,
        "movies_available": len(MOVIES),
        "endpoints": {
            "single_movie": "/comments/new?movie=Stranger+Things",
            "all_movies":   "/comments/new",
            "movie_list":   "/movies",
            "stats":        "/stats",
            "health":       "/health",
            "docs":         "/docs",
        }
    }


@app.get(
    "/movies",
    tags=["🎬 Films"],
    summary="Liste tous les films disponibles",
    response_model=MoviesResponse,
)
def list_movies():
    """Retourne la liste des 30 films avec leur nombre de commentaires."""
    return MoviesResponse(
        count=len(MOVIES),
        movies=[MovieInfo(name=m, total_comments=len(DATASET.get(m, []))) for m in MOVIES]
    )


@app.get(
    "/comments/new",
    tags=["📡 Stream"],
    summary="Récupère le commentaire en cours",
    responses={
        200: {
            "description": "Commentaire retourné avec succès",
            "content": {
                "application/json": {
                    "examples": {
                        "single_movie": {
                            "summary": "Un film spécifique",
                            "value": {
                                "mode": "single_movie",
                                "interval_seconds": 300,
                                "next_comment_in": 47,
                                "comment": {
                                    "id": "STR-289341",
                                    "movie": "Stranger Things",
                                    "comment": "Just finished Stranger Things and it totally blew my mind.",
                                    "sentiment": "positive",
                                    "timestamp": 1718123456.789,
                                    "index": 41,
                                    "total": 5000,
                                    "cycle": 1,
                                    "cycle_progress": 0.0082,
                                }
                            }
                        }
                    }
                }
            }
        },
        404: {
            "description": "Film introuvable",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error":     "Film 'Stranger Thing' introuvable.",
                            "available": ["Stranger Things", "Squid Game", "..."],
                            "hint":      "Vérifiez l'orthographe. Utilisez GET /movies pour la liste complète."
                        }
                    }
                }
            }
        },
        503: {
            "description": "Dataset non chargé",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error": "Dataset non chargé.",
                            "hint":  "Lancez generate_dataset.py puis redémarrez le serveur."
                        }
                    }
                }
            }
        }
    }
)
def get_comment(
    movie: Annotated[
        Optional[str],
        Query(
            description=(
                "Nom exact du film. Si omis, retourne un commentaire pour chaque film. "
                "Exemples : `Stranger Things`, `Squid Game`, `The Crown`"
            ),
            example="Stranger Things",
        )
    ] = None
):
    """
    ## Endpoint principal du stream

    Retourne le commentaire **actuellement en cours** selon l'horloge serveur.
    Le commentaire change toutes les `INTERVAL_SECONDS` secondes.

    Utilisez `next_comment_in` pour synchroniser votre `time.sleep()` dans le producer Kafka.
    """
    if not DATASET:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Dataset non chargé.",
                "hint":  "Lancez generate_dataset.py puis redémarrez le serveur."
            }
        )

    if movie:
        comment, seconds_left = _build_comment(movie)
        _tick_stats(movie, 1)
        return SingleMovieResponse(
            mode             = "single_movie",
            interval_seconds = INTERVAL_SECONDS,
            next_comment_in  = seconds_left,
            comment          = comment,
        )

    results, seconds_left = [], 0
    for m in MOVIES:
        try:
            c, secs = _build_comment(m)
            seconds_left = secs
            results.append(c)
        except HTTPException:
            pass

    _tick_stats(None, len(results))
    return AllMoviesResponse(
        mode             = "all_movies",
        interval_seconds = INTERVAL_SECONDS,
        next_comment_in  = seconds_left,
        count            = len(results),
        comments         = results,
    )


@app.get(
    "/stats",
    tags=["📊 Stats"],
    summary="Statistiques d'usage depuis le démarrage",
    response_model=StatsResponse,
)
def get_stats():
    """
    Compteurs en mémoire remis à zéro à chaque redémarrage.
    Utile pour voir quels films sont les plus demandés par les étudiants.
    """
    uptime = round(time.time() - _stats["started_at"], 1)
    top5   = sorted(_stats["per_movie"].items(), key=lambda x: x[1], reverse=True)[:5]
    return StatsResponse(
        uptime_seconds   = uptime,
        total_requests   = _stats["total_requests"],
        total_served     = _stats["total_served"],
        interval_seconds = INTERVAL_SECONDS,
        movies_available = len(MOVIES),
        top_movies       = [{"movie": m, "requests": c} for m, c in top5],
    )


@app.get(
    "/health",
    tags=["ℹ️ Info"],
    summary="Healthcheck",
    response_model=HealthResponse,
)
def health():
    """Utilisé par Render, Docker et les load balancers."""
    return HealthResponse(
        status = "ok",
        movies = len(MOVIES),
        uptime = round(time.time() - _stats["started_at"], 1),
    )
