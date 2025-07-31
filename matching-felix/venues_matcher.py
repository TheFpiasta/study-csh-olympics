import re
import logging
import os
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
def setup_logger(log_to_console=True, log_to_file=False, log_file_path=None, level=logging.INFO):
    """
    Configure the logger to log to console, file, or both.
    
    When logging to a file, the file is overwritten at the start of each execution,
    rather than appending to any existing content. This ensures clean log files
    for each run.
    
    Args:
        log_to_console (bool): Whether to log to console
        log_to_file (bool): Whether to log to file
        log_file_path (str): Path to log file (if None, uses 'venues_matcher.log' in current directory)
        level: Logging level (e.g., logging.INFO, logging.DEBUG)
        
    Returns:
        logging.Logger: Configured logger
    """
    logger = logging.getLogger(__name__)
    logger.setLevel(level)

    # Remove any existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create formatters
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # Add console handler if requested
    if log_to_console:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    # Add file handler if requested
    if log_to_file:
        if log_file_path is None:
            # Default log file in current directory
            log_file_path = "venues_matcher.log"

        # Ensure directory exists
        log_dir = os.path.dirname(log_file_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)

        # Use 'w' mode to overwrite the log file instead of appending to it
        file_handler = logging.FileHandler(log_file_path, mode='w', encoding='utf-8')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


# Default logger configuration (for backward compatibility)
logger = setup_logger(log_to_console=True, log_to_file=False)

# Global variable to store all possible matching method variants
MATCHING_METHOD_VARIANTS = {
    # Base matching methods
    "exact_match",
    "substring_match",
    "token_match",
    "fuzzy_match",
    "no_match",
    "empty_input",

    # Variants with outer parentheses content
    "exact_match_outer",
    "substring_match_outer",
    "token_match_outer",
    "fuzzy_match_outer",

    # Variants with inner parentheses content
    "exact_match_inner",
    "substring_match_inner",
    "token_match_inner",
    "fuzzy_match_inner",

    # Variants with combinations (first name outer, second name outer)
    "exact_match_outer_outer",
    "substring_match_outer_outer",
    "token_match_outer_outer",
    "fuzzy_match_outer_outer",

    # Variants with combinations (first name outer, second name inner)
    "exact_match_outer_inner",
    "substring_match_outer_inner",
    "token_match_outer_inner",
    "fuzzy_match_outer_inner",

    # Variants with combinations (first name inner, second name outer)
    "exact_match_inner_outer",
    "substring_match_inner_outer",
    "token_match_inner_outer",
    "fuzzy_match_inner_outer",

    # Variants with combinations (first name inner, second name inner)
    "exact_match_inner_inner",
    "substring_match_inner_inner",
    "token_match_inner_inner",
    "fuzzy_match_inner_inner",
}


def split_by_parentheses(text: str) -> tuple[str, str]:
    """
    Splits a string by outer and inner parentheses content.

    Args:
        text: Input string that may contain parentheses

    Returns:
        tuple: (outer_part, inner_part) where inner_part is empty if no parentheses
    """
    match = re.search(r'^([^(]*)\(([^)]*)\)', text.strip())

    if match:
        outer_part = match.group(1).strip()
        inner_part = match.group(2).strip()
        return outer_part, inner_part
    else:
        return text.strip(), ""


class StadiumMatcher:
    """
    Multi-stage stadium name matcher using hybrid approach
    """

    def __init__(self, debug: bool = False, loglevel: str = "info",
                 log_to_console: bool = True, log_to_file: bool = False,
                 log_file_path: str = None):
        """
        Initialize the StadiumMatcher with logging configuration.
        
        Args:
            debug: Enable debug mode
            loglevel: Logging level (e.g., "info", "debug", "warning")
            log_to_console: Whether to log to console
            log_to_file: Whether to log to file
            log_file_path: Path to log file (if None, uses default)
        """
        self.debug = debug

        # Convert string loglevel to logging level
        level = getattr(logging, loglevel.upper(), logging.INFO)

        # Configure logger with the specified settings
        global logger
        logger = setup_logger(
            log_to_console=log_to_console,
            log_to_file=log_to_file,
            log_file_path=log_file_path,
            level=level
        )

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
            'villa', 'borgo', 'di', 'del', 'della', 'des', 'du', 'de', 'van', 'von',
        }

        # Common filler words that can be ignored during matching
        self.filler_words = {
            "also", "known", "as"
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

        # Remove filler words
        processed = re.sub(r'\b(?:' + '|'.join(map(re.escape, self.filler_words)) + r')\b', '', processed)
        processed = processed.strip()

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
        Main method: Multi-stage matching with parentheses handling

        Returns:
            Tuple[bool, float, str]: (is_match, confidence_score, match_method)
        """
        if not name1 or not name2:
            return False, 0.0, "empty_input"

        # Split names by parentheses to get variations
        name1_outer, name1_inner = split_by_parentheses(name1)
        name2_outer, name2_inner = split_by_parentheses(name2)

        # Create list of name variations to try
        name1_variations = [
            (name1, ""),  # Original name
            (name1_outer, "_outer") if name1_outer != name1 else None,  # Outer part
            (name1_inner, "_inner") if name1_inner else None,  # Inner part
        ]
        name2_variations = [
            (name2, ""),  # Original name
            (name2_outer, "_outer") if name2_outer != name2 else None,  # Outer part
            (name2_inner, "_inner") if name2_inner else None,  # Inner part
        ]

        # Remove None entries
        name1_variations = [v for v in name1_variations if v is not None]
        name2_variations = [v for v in name2_variations if v is not None]

        best_match = False
        best_score = 0.0
        best_method = "no_match"

        # Try all combinations of name variations
        for n1, suffix1 in name1_variations:
            for n2, suffix2 in name2_variations:
                if not n1 or not n2:
                    continue

                logger.debug("")
                logger.debug(f"{n1} vs {n2}")

                # Create method suffix for this combination
                method_suffix = ""
                if suffix1 or suffix2:
                    method_suffix = f"{suffix1}{suffix2}"

                # Exact match (Stage 0)
                if n1.lower().strip() == n2.lower().strip():
                    method = f"exact_match{method_suffix}"
                    logger.info(f"Exact match found: '{n1}' == '{n2}' (method: {method})")
                    return True, 1.0, method

                # Stage 1: Substring match
                is_match, score = self.substring_match(n1, n2)
                logger.debug(f"Substring match: '{n1}' vs '{n2}' (score: {score:.2f})")
                if is_match and score > best_score:
                    best_match = True
                    best_score = score
                    best_method = f"substring_match{method_suffix}"
                    logger.info(f"Substring match found: '{n1}' vs '{n2}' (score: {score:.2f}, method: {best_method})")

                # Stage 2: Token-based match
                is_match, score = self.token_based_match(n1, n2)
                logger.debug(f"Token match: '{n1}' vs '{n2}' (score: {score:.2f})")
                if is_match and score > best_score:
                    best_match = True
                    best_score = score
                    best_method = f"token_match{method_suffix}"
                    logger.info(f"Token match found: '{n1}' vs '{n2}' (score: {score:.2f}, method: {best_method})")

                # Stage 3: Fuzzy match as fallback
                is_match, score = self.fuzzy_match(n1, n2)
                logger.debug(f"Fuzzy match: '{n1}' vs '{n2}' (score: {score:.2f})")
                if is_match and score > best_score:
                    best_match = True
                    best_score = score
                    best_method = f"fuzzy_match{method_suffix}"
                    logger.info(f"Fuzzy match found: '{n1}' vs '{n2}' (score: {score:.2f}, method: {best_method})")

        logger.debug("=" * 40)
        logger.debug(f"{best_method}: {best_score:.2f}")
        logger.debug("=" * 40)
        logger.debug("")
        if best_match:
            return True, best_score, best_method

        # No match found - return the best score from all attempts
        logger.warning(f"No match found: '{name1}' vs '{name2}' (best score: {best_score:.2f})")
        return False, best_score, "no_match"


# def merge_stadium_metadata(match_info: Dict) -> Dict:
#     """
#     Merges metadata from matched stadiums
#
#     Args:
#         match_info: Match information with stadium1 and stadium2
#
#     Returns:
#         Dict: Merged stadium data
#     """
#     stadium1 = match_info['stadium1']
#     stadium2 = match_info['stadium2']
#
#     # Base: Stadium1, supplemented by Stadium2
#     merged = stadium1.copy()
#
#     # Merge logic (adjustable based on data structure)
#     for key, value in stadium2.items():
#         if key not in merged or not merged[key]:
#             merged[key] = value
#         elif key == 'name' and match_info['confidence'] < 0.95:
#             # For uncertain matches, keep both names
#             merged['alternative_name'] = value
#
#     # Additional metadata
#     merged['match_confidence'] = match_info['confidence']
#     merged['match_method'] = match_info['method']
#     merged['merged_from'] = [stadium1.get('name', ''), stadium2.get('name', '')]
#
#     return merged

def find_stadium_matches(stadiums_list1: List[Dict],
                         stadiums_list2: List[Dict],
                         name_key1: str = 'name',
                         name_key2: str = 'name',
                         debug: bool = False,
                         loglevel: str = "info",
                         log_to_console: bool = True,
                         log_to_file: bool = False,
                         log_file_path: str = None) -> List[Dict]:
    """
    Finds matches between two stadium lists

    Args:
        stadiums_list1: First list with stadium data (GeoJSON venues)
        stadiums_list2: Second list with stadium data (JSON venues)
        name_key1: Key for stadium names in the first list
        name_key2: Key for stadium names in the second list
        debug: Activate debug mode
        loglevel: Logging level (e.g., "info", "debug", "warning")
        log_to_console: Whether to log to console
        log_to_file: Whether to log to file
        log_file_path: Path to log file (if None, uses default)

    Returns:
        List[Dict]: All matches sorted by highest score
    """
    matcher = StadiumMatcher(
        debug=debug,
        loglevel=loglevel,
        log_to_console=log_to_console,
        log_to_file=log_to_file,
        log_file_path=log_file_path
    )

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

                logger.debug("#" * 40)
                logger.debug(f"Matching '{name1}' with '{name2}': {is_match}, score: {score:.2f}, method: {method}")
                logger.debug("#" * 40)

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

    logger.debug("-" * 80)
    for match in all_matches:
        logger.debug(f"Confidence: {match['confidence']:.2f}, Method: {match['method']}, "
                     f"Match: {match['stadium1'].get(name_key1, '')} <-> {match['stadium2'].get(name_key2, '')}")

    return all_matches
