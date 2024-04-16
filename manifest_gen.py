from os import listdir
from os.path import isfile, join

import json

from jsonschema import validate, ValidationError

import logging
logger = logging.getLogger(__name__)

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
    "required": ["title", "sources", "cards"],
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
            
            logging.info(f"Checking {full_file_path} ... ")
            try:
                manifest_file_dict["flashcardFiles"].append({
                    "name": file_content["title"],
                    "file": full_file_path
                })
                logging.info(f"{full_file_path} ✅")
                
            except ValidationError as ve:
                logging.exception(f"Exception in file {full_file_path} ❌ : {ve}")
                
with open("./manifest.json", "w") as manifest_file:
    manifest_file.write(json.dumps(manifest_file_dict, indent=2))
    
