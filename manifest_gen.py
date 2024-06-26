from os import listdir
from os.path import isfile, join

import sys

import json

from jsonschema import validate, ValidationError

flashcards_files_path = './flashcards/'

schema = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "sources": {
            "type": "array",
            "items": {"type": "string"},
        },
        "cards": {
            "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "answer": {"type": "string"},
                        "category": {"type": "string"},
                        "hint": {"type": "string"},
                        "notes": {"type": "string"},
                        "question_image": {"type": "string"},
                        "answer_image": {"type": "string"},
                        "references": {
                            "type": "array",
                            "items": {"type": "string"},
                        }
                    },
                    # "required": [""],
                },
            "minItems": 1
        }
    },
    "required": ["title", "cards"],
}

manifest_file_dict = {
    "flashcardFiles": [
        
    ]
}

for f in listdir(flashcards_files_path):
    full_file_path = join(flashcards_files_path, f)
    if isfile(full_file_path) and f.split(".")[-1] == "json":
        with open(full_file_path) as flashcard_file:
            file_content = json.loads(flashcard_file.read())
            
            print(f"Checking {full_file_path} ... ")
            try:
                manifest_file_dict["flashcardFiles"].append({
                    "name": file_content["title"],
                    "file": full_file_path
                })
                print(f"{full_file_path} ✅")
                
            except ValidationError as ve:
                print(f"Exception in file {full_file_path} ❌ : {ve}")
                sys.exit(1)
                
            print()
            
with open("./manifest.json", "w") as manifest_file:
    manifest_file.write(json.dumps(manifest_file_dict, indent=2))
    
