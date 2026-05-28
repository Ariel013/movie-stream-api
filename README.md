# 🎬 Movie Stream API v2

API REST simulant un flux temps réel de commentaires utilisateurs sur des séries Netflix.  
Stack : **FastAPI · Uvicorn · Docker · Render / VPS**

---

## Architecture

```
IMDB CSV ──► generate_dataset.py ──► data/comments.json.gz
                                            │
                                     FastAPI (Render/VPS)
                                            │
                              GET /comments/new?movie=X
                                            │
                                    Producer Kafka
                                            │
                               topic: movie-comments
                                            │
                                  Consumer + Modèle ML
                                            │
                                       PostgreSQL
```

---

## 1. Générer le dataset (une seule fois, en local)

```bash
pip install pandas
python generate_dataset.py --csv /chemin/vers/imdb_reviews.csv
# ou 1000 commentaires par film :
python generate_dataset.py --csv /chemin/vers/imdb_reviews.csv --per-movie 5000
```

Le script transforme les reviews IMDB longues et formelles en commentaires courts
et réalistes style réseau social (1-3 phrases, ton casual).

**Aperçu du résultat :**
```
[positive] Just finished Stranger Things and it totally blew my mind.
[negative] Tried watching Ozark but the pacing is just way too slow for me.
[positive] Can't believe how good The Crown is, absolutely stunning performances.
```

---

## 2. Déploiement sur Render

1. Pousser le repo sur GitHub (`data/comments.json.gz` inclus)
2. **New Web Service** → Runtime : **Docker** → connecter le repo
3. Variables d'environnement :
   ```
   INTERVAL_SECONDS = 300
   ```
4. **Deploy** → URL publique fournie par Render

> ⚠️ Tier gratuit : mise en veille après 15 min sans trafic.  
> Appeler `/health` avant le cours pour réveiller le service.

---

## 3. Déploiement sur VPS

```bash
git clone <repo> && cd movie-stream-v2
cp .env.example .env
docker compose up -d --build
curl http://localhost:8000/health
```

**Mise à jour du dataset sans downtime :**
```bash
cp nouveau_comments.json.gz data/comments.json.gz
docker compose restart movie-api
```

---

## 4. Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/` | Infos générales |
| GET | `/movies` | Liste des 30 films disponibles |
| GET | `/comments/new?movie=<film>` | Commentaire en cours pour ce film |
| GET | `/comments/new` | Commentaire en cours pour tous les films |
| GET | `/stats` | Statistiques d'usage depuis le démarrage |
| GET | `/health` | Healthcheck |
| GET | `/docs` | **Swagger UI** — documentation interactive |
| GET | `/redoc` | ReDoc — documentation alternative |

---

## 5. Exemple de réponse — `/comments/new?movie=Stranger Things`

```json
{
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
    "total": 500,
    "cycle": 1,
    "cycle_progress": 0.082
  }
}
```

### Champs importants

| Champ | Description |
|-------|-------------|
| `next_comment_in` | Secondes avant le prochain commentaire — synchroniser `time.sleep()` |
| `cycle` | Numéro du passage (1 = premier tour, 2 = répétition...) |
| `cycle_progress` | Progression 0.0 → 1.0 dans le cycle actuel |
| `sentiment` | ⚠️ Pour évaluation uniquement — **ne pas utiliser pour classifier** |

---

## 6. Exemple de réponse — `/stats`

```json
{
  "uptime_seconds": 3600.5,
  "total_requests": 142,
  "total_served": 142,
  "interval_seconds": 300,
  "movies_available": 30,
  "top_movies": [
    {"movie": "Stranger Things", "requests": 38},
    {"movie": "Squid Game",      "requests": 31}
  ]
}
```

---

## 7. Producer Kafka — Code étudiant

```python
import requests, time, json
from kafka import KafkaProducer

API_URL = "https://<url-fournie-par-le-prof>"

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

MOVIES    = ["Stranger Things", "Squid Game", "The Crown", "Dark", "Ozark"]
last_seen = {}

print("Producer démarré...")

while True:
    for movie in MOVIES:
        try:
            res     = requests.get(f"{API_URL}/comments/new", params={"movie": movie})
            data    = res.json()
            comment = data["comment"]

            # Envoyer uniquement si c'est un nouveau commentaire
            if last_seen.get(movie) != comment["id"]:
                last_seen[movie] = comment["id"]
                producer.send("movie-comments", comment)
                print(f"[{comment['movie']}] {comment['comment'][:80]}...")

                # Optionnel : afficher le cycle pour debug
                if comment["cycle"] > 1:
                    print(f"  ⚠️  Cycle {comment['cycle']} — commentaires en répétition")
            else:
                print(f"[{movie}] Prochain dans {data['next_comment_in']}s")

        except Exception as e:
            print(f"Erreur sur {movie}: {e}")

    # Attendre le prochain cycle (récupéré depuis la dernière réponse)
    time.sleep(data.get("next_comment_in", 60) + 5)
```

---

## Films disponibles (30 séries)

The Crown · Stranger Things · Squid Game · Ozark · Dark · Money Heist ·
Breaking Bad · The Witcher · Bridgerton · Narcos · Black Mirror · House of Cards ·
Mindhunter · Lupin · Emily in Paris · The Queen's Gambit · Peaky Blinders · You ·
Cobra Kai · Manifest · Succession · Euphoria · The Last of Us · Wednesday ·
1899 · The Umbrella Academy · Altered Carbon · Sense8 · Daredevil · Jessica Jones

---

## Scalabilité

| Contexte | Capacité estimée |
|----------|-----------------|
| Render gratuit (1 vCPU, 512 Mo) | ~50 étudiants simultanés sans souci |
| VPS 2 vCPU / 2 Go RAM | ~500 req/s (largement suffisant) |
| Dataset 1000/film × 30 films | ~30 Mo RAM — négligeable |
| Durée avant répétition (1000/film, 5 min) | **83 heures** avant cycle 2 |
