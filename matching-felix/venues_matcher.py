#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stadium Name Matching - Hybrid Approach
Matches stadium names with variations using multiple algorithmic approaches
"""

import re
import logging
from typing import List, Dict, Tuple, Optional
from difflib import SequenceMatcher

# For better fuzzy matching (optional - if not available, we use difflib)
try:
    from fuzzywuzzy import fuzz
    FUZZYWUZZY_AVAILABLE = True
except ImportError:
    FUZZYWUZZY_AVAILABLE = False
    print("FuzzyWuzzy not available, using difflib as fallback")

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class StadiumMatcher:
    """
    Multi-stage stadium name matcher using hybrid approach
    """

    def __init__(self, debug: bool = False):
        self.debug = debug

        # Stadium-specific terms and their synonyms
        self.stadium_terms = {
            'stadium': ['stadion', 'arena', 'ground'],
            'park': ['idrettspark', 'idrettsplass'],
            'field': ['felt', 'campo', 'terrain'],
            'center': ['centre', 'centrum', 'senter'],
        }

        # Flat list of all stadium terms
        self.all_stadium_terms = set()
        for key, synonyms in self.stadium_terms.items():
            self.all_stadium_terms.add(key)
            self.all_stadium_terms.update(synonyms)

        # Common location indicators that can be ignored during matching
        self.location_indicators = {
            'villa', 'borgo', 'di', 'del', 'della', 'des', 'du', 'de', 'van', 'von'
        }

    def normalize_stadium_terms(self, name: str) -> str:
        """Normalizes stadium terms to standard form"""
        name_lower = name.lower()

        for standard, synonyms in self.stadium_terms.items():
            for synonym in synonyms:
                # Word boundary regex for exact matches
                pattern = rf'\b{re.escape(synonym)}\b'
                name_lower = re.sub(pattern, standard, name_lower)

        return name_lower

    def preprocess_name(self, name: str, aggressive: bool = False) -> str:
        """
        Cleans stadium names for matching

        Args:
            name: Original stadium name
            aggressive: If True, removes more information
        """
        if not name:
            return ""

        processed = name.strip()

        # Normalize stadium terms
        processed = self.normalize_stadium_terms(processed)

        if aggressive:
            # Remove parenthetical content
            processed = re.sub(r'\([^)]*\)', '', processed)
            # Remove everything after comma
            processed = processed.split(',')[0]

        # Remove extra whitespace and special characters
        processed = re.sub(r'[,\-\.]+', ' ', processed)
        processed = ' '.join(processed.split())

        return processed.strip()

    def extract_core_name(self, name: str) -> str:
        """Extracts core name without stadium terms and additions"""
        processed = self.preprocess_name(name, aggressive=True)

        # Remove stadium terms
        words = processed.lower().split()
        core_words = [word for word in words
                      if word not in self.all_stadium_terms
                      and word not in self.location_indicators
                      and len(word) > 1]

        return ' '.join(core_words).strip()

    def substring_match(self, name1: str, name2: str) -> Tuple[bool, float]:
        """
        Stage 1: Substring-based matching
        Perfect for names like 'Piazza di Siena' vs 'Piazza di Siena, Villa Borghese'
        """
        core1 = self.extract_core_name(name1)
        core2 = self.extract_core_name(name2)

        if not core1 or not core2:
            return False, 0.0

        # Bidirectional substring check
        if core1 in core2:
            score = len(core1) / len(core2)
            return True, min(score * 1.2, 0.95)  # Bonus for substring match

        if core2 in core1:
            score = len(core2) / len(core1)
            return True, min(score * 1.2, 0.95)

        return False, 0.0

    def token_based_match(self, name1: str, name2: str) -> Tuple[bool, float]:
        """
        Stage 2: Token-based matching with intelligent synonym handling
        Good for 'Bislett Stadium' vs 'Bislett Stadion'
        """
        def tokenize_smart(name: str) -> set:
            # First normalize stadium terms
            normalized = self.normalize_stadium_terms(name)
            processed = self.preprocess_name(normalized, aggressive=False)

            # Tokenize
            tokens = set(re.findall(r'\b\w+\b', processed.lower()))

            # Remove very short tokens and stadium terms
            meaningful_tokens = {
                token for token in tokens
                if len(token) > 2 and token not in self.all_stadium_terms
            }

            return meaningful_tokens

        tokens1 = tokenize_smart(name1)
        tokens2 = tokenize_smart(name2)

        if not tokens1 or not tokens2:
            return False, 0.0

        # Calculate Jaccard similarity
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)

        if not union:
            return False, 0.0

        jaccard = len(intersection) / len(union)

        # At least one common token and good Jaccard similarity
        if len(intersection) >= 1 and jaccard > 0.4:
            return True, min(jaccard * 1.1, 0.85)  # Max 0.85 for token match

        return False, 0.0

    def fuzzy_similarity(self, name1: str, name2: str) -> float:
        """Calculates fuzzy similarity between two names"""
        processed1 = self.preprocess_name(name1, aggressive=True)
        processed2 = self.preprocess_name(name2, aggressive=True)

        if not processed1 or not processed2:
            return 0.0

        if FUZZYWUZZY_AVAILABLE:
            # Use fuzzywuzzy if available
            ratio = fuzz.ratio(processed1, processed2) / 100
            partial_ratio = fuzz.partial_ratio(processed1, processed2) / 100
            token_sort = fuzz.token_sort_ratio(processed1, processed2) / 100

            # Weighted score
            return ratio * 0.4 + partial_ratio * 0.3 + token_sort * 0.3
        else:
            # Fallback to difflib
            return SequenceMatcher(None, processed1, processed2).ratio()

    def fuzzy_match(self, name1: str, name2: str, threshold: float = 0.75) -> Tuple[bool, float]:
        """
        Stage 3: Fuzzy matching as fallback
        For difficult cases with typos etc.
        """
        score = self.fuzzy_similarity(name1, name2)

        if score >= threshold:
            return True, score

        return False, score

    def match(self, name1: str, name2: str) -> Tuple[bool, float, str]:
        """
        Main method: Multi-stage matching

        Returns:
            Tuple[bool, float, str]: (is_match, confidence_score, match_method)
        """
        if not name1 or not name2:
            return False, 0.0, "empty_input"

        # Exact match (Stage 0)
        if name1.lower().strip() == name2.lower().strip():
            self.log(f"Exact match found: '{name1}' == '{name2}'", level='info')
            return True, 1.0, "exact_match"

        # Stage 1: Substring match
        is_match, score = self.substring_match(name1, name2)
        if is_match:
            self.log(f"Substring match found: '{name1}' vs '{name2}' (score: {score:.2f})", level='info')
            return True, score, "substring_match"

        # Stage 2: Token-based match
        is_match, score = self.token_based_match(name1, name2)
        if is_match:
            self.log(f"Token match found: '{name1}' vs '{name2}' (score: {score:.2f})", level='info')
            return True, score, "token_match"

        # Stage 3: Fuzzy match as fallback
        is_match, score = self.fuzzy_match(name1, name2)
        if is_match:
            self.log(f"Fuzzy match found: '{name1}' vs '{name2}' (score: {score:.2f})", level='info')
            return True, score, "fuzzy_match"

        # No match found
        self.log(f"No match found: '{name1}' vs '{name2}' (score: {score:.2f})", level='warning')
        return False, score, "no_match"


    def log(self, message: str, level: str = 'info'):
        """
        Simple logging function to handle debug messages
        """
        if not self.debug:
            return

        if level == 'debug' and not logger.isEnabledFor(logging.DEBUG):
            return
        if level == 'info':
            logger.info(message)
        elif level == 'warning':
            logger.warning(message)
        elif level == 'error':
            logger.error(message)
        elif level == 'critical':
            logger.critical(message)

def find_stadium_matches(stadiums_list1: List[Dict], stadiums_list2: List[Dict],
                         name_key1: str = 'name', name_key2: str = 'name', debug: bool = False) -> List[Dict]:
    """
    Finds matches between two stadium lists

    Args:
        stadiums_list1: First list with stadium data (GeoJSON venues)
        stadiums_list2: Second list with stadium data (JSON venues)
        name_key1: Key for stadium names in the first list
        name_key2: Key for stadium names in the second list
        debug: Activate debug mode

    Returns:
        List[Dict]: All matches sorted by highest score
    """
    matcher = StadiumMatcher(debug=debug)

    all_matches = []  # All matches with scores

    for stadium1 in stadiums_list1:
        best_match = None
        best_score = 0.0
        best_method = ""

        # Handle both single names and lists of names for stadium1
        names1 = stadium1.get(name_key1, [])
        if isinstance(names1, str):
            names1 = [names1]
        elif not isinstance(names1, list):
            names1 = []

        for name1 in names1:
            if not name1:
                continue

            for stadium2 in stadiums_list2:
                name2 = stadium2.get(name_key2, "")
                if not name2:
                    continue

                is_match, score, method = matcher.match(name1, name2)

                if is_match and score > best_score:
                    best_match = stadium2
                    best_score = score
                    best_method = method

        if best_match:
            match_info = {
                'stadium1': stadium1,
                'stadium2': best_match,
                'confidence': best_score,
                'method': best_method,
                'name1': names1,
                'name2': best_match.get(name_key2, "")
            }
            all_matches.append(match_info)

    # Sort by confidence score in descending order (highest score first)
    all_matches.sort(key=lambda x: x['confidence'], reverse=True)

    return all_matches


def merge_stadium_metadata(match_info: Dict) -> Dict:
    """
    Merges metadata from matched stadiums

    Args:
        match_info: Match information with stadium1 and stadium2

    Returns:
        Dict: Merged stadium data
    """
    stadium1 = match_info['stadium1']
    stadium2 = match_info['stadium2']

    # Base: Stadium1, supplemented by Stadium2
    merged = stadium1.copy()

    # Merge logic (adjustable based on data structure)
    for key, value in stadium2.items():
        if key not in merged or not merged[key]:
            merged[key] = value
        elif key == 'name' and match_info['confidence'] < 0.95:
            # For uncertain matches, keep both names
            merged['alternative_name'] = value

    # Additional metadata
    merged['match_confidence'] = match_info['confidence']
    merged['match_method'] = match_info['method']
    merged['merged_from'] = [stadium1.get('name', ''), stadium2.get('name', '')]

    return merged
