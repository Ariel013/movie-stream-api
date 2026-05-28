"""
Script à lancer UNE SEULE FOIS en local pour générer le dataset.
Produit jusqu'à 5000 commentaires par film, stockés en gzip (~30 Mo au lieu de ~300 Mo).

Usage :
    pip install pandas
    python generate_dataset.py --csv /chemin/vers/imdb_reviews.csv
    python generate_dataset.py --csv /chemin/vers/imdb_reviews.csv --per-movie 5000
"""

import pandas as pd
import json
import gzip
import random
import re
import argparse
import os

MOVIES = [
    "The Crown",             "Stranger Things",       "Squid Game",
    "Ozark",                 "Dark",                  "Money Heist",
    "Breaking Bad",          "The Witcher",            "Bridgerton",
    "Narcos",                "Black Mirror",           "House of Cards",
    "Mindhunter",            "Lupin",                  "Emily in Paris",
    "The Queen's Gambit",    "Peaky Blinders",         "You",
    "Cobra Kai",             "Manifest",               "Succession",
    "Euphoria",              "The Last of Us",         "Wednesday",
    "1899",                  "The Umbrella Academy",   "Altered Carbon",
    "Sense8",                "Daredevil",              "Jessica Jones",
]

POSITIVE_OPENERS = [
    "Just finished {movie} and",
    "Honestly {movie} is",
    "Can't believe how good {movie} is,",
    "{movie} really surprised me,",
    "Finally watched {movie} and",
    "Been binging {movie} all week,",
    "Ok so {movie} is actually",
    "Not gonna lie {movie} is",
    "Just started {movie} and already",
    "Everyone was right about {movie},",
]

NEGATIVE_OPENERS = [
    "Tried watching {movie} but",
    "Honestly {movie} was",
    "Not sure why everyone loves {movie},",
    "{movie} really let me down,",
    "Gave {movie} a shot and",
    "Couldn't finish {movie},",
    "Don't get the hype around {movie},",
    "{movie} started strong but",
    "Expected more from {movie},",
    "Heard so much about {movie} but",
]


def clean_text(text: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&[a-z]+;', ' ', text)
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_best_sentence(text: str) -> str:
    sentences  = re.split(r'(?<=[.!?])\s+', text)
    candidates = [s.strip() for s in sentences if 20 <= len(s.strip()) <= 120]

    if not candidates:
        words = text[:120].split()
        return ' '.join(words[:-1]) + '.' if len(words) > 1 else text[:100]

    emotional_words = [
        'amazing', 'terrible', 'love', 'hate', 'brilliant', 'boring',
        'perfect', 'awful', 'incredible', 'disappointing', 'best', 'worst',
        'great', 'bad', 'fantastic', 'dull', 'stunning', 'waste',
    ]
    scored = sorted(
        [(sum(1 for w in emotional_words if w in s.lower()), s) for s in candidates],
        reverse=True
    )
    return scored[0][1]


def make_casual_comment(text: str, sentiment: str, movie: str) -> str:
    clean = clean_text(text)
    best  = extract_best_sentence(clean)
    best_casual = best[0].lower() + best[1:] if best else clean[:100]

    if random.random() < 0.5:
        openers = POSITIVE_OPENERS if sentiment == 'positive' else NEGATIVE_OPENERS
        opener  = random.choice(openers).format(movie=movie)
        comment = f"{opener} {best_casual}"
    else:
        comment = best_casual

    if comment and comment[-1] not in '.!?':
        comment += '.'
    if len(comment) > 200:
        words   = comment[:200].split()
        comment = ' '.join(words[:-1]) + '...'

    return comment


def load_imdb(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    text_col  = next((c for c in ['review', 'text', 'comment'] if c in df.columns), None)
    label_col = next((c for c in ['sentiment', 'label']        if c in df.columns), None)

    if not text_col:
        raise ValueError(
            f"Colonnes trouvées : {list(df.columns)}\n"
            "Besoin d'une colonne 'review', 'text' ou 'comment'."
        )

    df = df[[text_col, label_col]].dropna()
    df.columns = ['text', 'sentiment']
    df['text']      = df['text'].str.strip()
    df['sentiment'] = df['sentiment'].str.lower().str.strip()
    return df[df['sentiment'].isin(['positive', 'negative'])].reset_index(drop=True)


def generate(csv_path: str, output_path: str, per_movie: int):
    print(f"📂 Chargement : {csv_path}")
    df = load_imdb(csv_path)
    print(f"   {len(df)} reviews — "
          f"{len(df[df.sentiment=='positive'])} pos / "
          f"{len(df[df.sentiment=='negative'])} neg")

    positives = df[df['sentiment'] == 'positive']['text'].tolist()
    negatives = df[df['sentiment'] == 'negative']['text'].tolist()

    dataset = {}
    total   = 0

    for movie in MOVIES:
        n_pos = int(per_movie * 0.55)
        n_neg = per_movie - n_pos

        comments = (
            [{"comment": make_casual_comment(t, 'positive', movie), "sentiment": "positive"}
             for t in random.choices(positives, k=n_pos)] +
            [{"comment": make_casual_comment(t, 'negative', movie), "sentiment": "negative"}
             for t in random.choices(negatives, k=n_neg)]
        )
        random.shuffle(comments)
        dataset[movie] = comments
        total += len(comments)
        print(f"   ✓ {movie:<30} {len(comments)} commentaires")

    # ── Sauvegarde gzip ────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    gz_path = output_path if output_path.endswith('.gz') else output_path + '.gz'
    raw     = json.dumps(dataset, ensure_ascii=False).encode('utf-8')

    with gzip.open(gz_path, 'wb', compresslevel=6) as f:
        f.write(raw)

    raw_mb = len(raw)         / 1024 / 1024
    gz_mb  = os.path.getsize(gz_path) / 1024 / 1024
    ratio  = raw_mb / gz_mb

    print(f"\n✅ {gz_path}")
    print(f"   {total} commentaires · {len(MOVIES)} films")
    print(f"   JSON brut : {raw_mb:.1f} Mo  →  gzip : {gz_mb:.1f} Mo  (÷{ratio:.1f})")

    hours = (per_movie * 5) / 60
    print(f"   Durée avant cycle 2 : {hours:.0f} heures ({hours/24:.1f} jours)")

    # Aperçu
    print("\n── Aperçu (3 commentaires aléatoires) ──")
    sample_movie = random.choice(MOVIES)
    for c in random.sample(dataset[sample_movie], 3):
        print(f"  [{c['sentiment']:8}] {c['comment']}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv',       required=True,                     help='Chemin vers imdb_reviews.csv')
    parser.add_argument('--output',    default='data/comments.json.gz',   help='Fichier de sortie (.gz)')
    parser.add_argument('--per-movie', type=int, default=5000,            help='Commentaires par film (défaut: 5000)')
    args = parser.parse_args()

    generate(args.csv, args.output, args.per_movie)
