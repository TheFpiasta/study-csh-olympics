import re
from difflib import SequenceMatcher
import re

def normalize(text):
    # Lowercase
    text = text.lower()
    # Remove parentheses and their content
    text = re.sub(r'[()]', '', text)
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Split words and sort to ignore order
    words = text.split()
    words.sort()
    # Join back normalized string
    return ' '.join(words)

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def split_combined(text):
    # Split on commas or 'and' to handle combined events
    parts = re.split(r',| and ', text.lower())
    return [part.strip() for part in parts if part.strip()]

def score_match(use_list, sports_list):
    if not use_list or not sports_list:
        return 0, 0, 0

    # Split combined phrases in use_list into smaller parts
    expanded_use = []
    for item in use_list:
        expanded_use.extend(split_combined(item))
    expanded_use = sorted(set([normalize(u) for u in expanded_use]))

    sports_items = sorted(set([normalize(s) for s in sports_list]))

    total_score = 0
    max_score = len(expanded_use) * 3  # max 3 points per use item

    matched_sports = set()

    for use_item in expanded_use:
        best_score = -1  # baseline penalty for missing
        best_match = None
        for sport_item in sports_items:
            if sport_item in matched_sports:
                continue
            sim = similar(use_item, sport_item)
            if sim > 0.9:
                best_score = 3
                best_match = sport_item
                break
            elif sim > 0.6 and sim > best_score:
                best_score = 1
                best_match = sport_item
        if best_match:
            matched_sports.add(best_match)
        total_score += best_score

    # Penalize unmatched sports less harshly (penalty 1 per unmatched)
    unmatched_sports = [s for s in sports_items if s not in matched_sports]
    total_score -= len(unmatched_sports)

    similarity_ratio = total_score / max_score if max_score > 0 else 0
    return similarity_ratio, total_score, max_score

# Example call with your input:
uses = [
    ["Figure skating", "Speed skating", "Ice hockey", "Opening and Closing Ceremonies"],
    ["Bobsleigh", "Luge"]
]

sports = [
    ["Figure Skating", "(Iced) hockey", "Speed Skating", "Opening ceremony", "Closing ceremony"],
    ["Ice hockey"],
    ["Bobsled", "Luge"]
]

results = []
for i, use_list in enumerate(uses):
    for j, sports_list in enumerate(sports):
        sim, score, max_s = score_match(use_list, sports_list)
        print(f"[Use {i}] vs [Sports {j}] -> Similarity: {sim:.2f} | Score: {score}/{max_s} | Match: {sim >= 0.6}")
        results.append((i,j,sim))
