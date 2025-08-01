#!/usr/bin/env python3
"""
Visualize the folder structure of the matching-felix project.
This script generates an ASCII tree diagram of the project structure.
"""

import os
import json
from typing import Dict, List, Optional

class FolderVisualizer:
    """Class to visualize folder structures in ASCII format."""
    
    def __init__(self, root_dir: str):
        """Initialize with the root directory to visualize."""
        self.root_dir = root_dir
        self.indent = "    "
        self.branch = "│   "
        self.tee = "├── "
        self.last = "└── "
        
    def _get_tree_representation(self, directory: str, prefix: str = "") -> List[str]:
        """Generate a tree representation of the given directory."""
        entries = os.listdir(directory)
        entries = sorted(entries)
        
        # Filter out certain directories/files if needed
        filtered_entries = [e for e in entries if not e.startswith('.') and e != '__pycache__']
        
        result = []
        count = len(filtered_entries)
        
        for i, entry in enumerate(filtered_entries):
            is_last = i == count - 1
            path = os.path.join(directory, entry)
            
            # Choose the appropriate connector
            connector = self.last if is_last else self.tee
            
            # Add the current entry to the result
            result.append(f"{prefix}{connector}{entry}")
            
            # If it's a directory, recursively process it
            if os.path.isdir(path):
                # Choose the appropriate prefix for the next level
                extension = self.indent if is_last else self.branch
                result.extend(self._get_tree_representation(path, prefix + extension))
                
        return result
    
    def visualize(self) -> str:
        """Generate and return the ASCII tree visualization."""
        tree_lines = [self.root_dir]
        tree_lines.extend(self._get_tree_representation(self.root_dir))
        return "\n".join(tree_lines)
    
    def visualize_to_file(self, output_file: str) -> None:
        """Generate the ASCII tree visualization and write it to a file."""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(self.visualize())
            
    def visualize_predefined_structure(self) -> str:
        """Generate a predefined structure based on README.md information."""
        structure = {
            "matching-felix": {
                ".venv": {},
                "combined_geojson": {
                    "1896_Athens.geojson": {},
                    "1900_Paris.geojson": {},
                    "...": {},
                    "2020_Tokyo.geojson": {},
                    "matching.log": {},
                    "venue_matching_statistics.json": {}
                },
                "combined_geojson_less_stages_less_array": {
                    "1896_Athens.geojson": {},
                    "1900_Paris.geojson": {},
                    "...": {},
                    "2020_Tokyo.geojson": {},
                    "matching.log": {},
                    "venue_matching_statistics.json": {}
                },
                "combined_geojson_less_stages_less_array_no_sport_match": {
                    "1896_Athens.geojson": {},
                    "1900_Paris.geojson": {},
                    "...": {},
                    "2020_Tokyo.geojson": {},
                    "matching.log": {},
                    "venue_matching_statistics.json": {}
                },
                "__pycache__": {},
                "main.py": {},
                "venues_matcher.py": {},
                "getAllVenusNames.py": {},
                "test_venue_matching.py": {},
                "test_logging.py": {},
                "venues.txt": {},
                "requirements.txt": {},
                "README.md": {},
                "test_matcher-3-less-stages_less_array.log": {},
                "test_matcher-less-stages.log": {},
                "test_matcher-new-arrays.log": {},
                "test_matcher.log": {},
                "both_test.log": {},
                "console_only_test.log": {}
            }
        }
        
        return self._visualize_dict_structure(structure)
    
    def _visualize_dict_structure(self, structure: Dict, prefix: str = "", is_last: bool = True) -> str:
        """Generate an ASCII tree visualization from a dictionary structure."""
        result = []
        
        if not prefix:  # Root level
            root_name = next(iter(structure))
            result.append(root_name)
            prefix = ""
            structure = structure[root_name]
        
        items = list(structure.items())
        count = len(items)
        
        for i, (name, children) in enumerate(items):
            is_last_item = i == count - 1
            connector = self.last if is_last_item else self.tee
            
            result.append(f"{prefix}{connector}{name}")
            
            if children:  # If it has children
                extension = self.indent if is_last_item else self.branch
                child_result = self._visualize_dict_structure(children, prefix + extension, is_last_item)
                if child_result:
                    result.append(child_result)
        
        return "\n".join(result)

def main():
    """Main function to run the visualization."""
    # Get the current directory (should be matching-felix)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    visualizer = FolderVisualizer(current_dir)
    
    # Option 1: Visualize the actual directory structure
    print("Actual Directory Structure:")
    print(visualizer.visualize())
    print("\n" + "="*50 + "\n")
    
    # Option 2: Visualize the predefined structure from README.md
    print("Predefined Structure (based on README.md):")
    print(visualizer.visualize_predefined_structure())
    
    # Save the visualization to a file
    visualizer.visualize_to_file(os.path.join(current_dir, "folder_structure.txt"))
    print("\nVisualization saved to folder_structure.txt")

if __name__ == "__main__":
    main()