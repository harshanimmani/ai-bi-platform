import os
import uuid
from pathlib import Path
from typing import Union

# Base upload directory inside the backend workspace
# Exclude storage/ in gitignore to prevent uploading datasets to the repo
UPLOAD_DIR = Path("storage/uploads")

class LocalStorageService:
    """
    Service responsible for storing and deleting files on local disk.
    Abstracts filesystem interactions so it can be easily subclassed/replaced
    with Supabase Storage or AWS S3 in production.
    """
    def __init__(self, base_dir: Path = UPLOAD_DIR):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, filename: str, content: bytes) -> str:
        """
        Saves file to a unique folder on the local disk.
        Returns the relative storage path to be saved in the database.
        """
        # Create unique folder for each upload to prevent filename collisions
        unique_folder = str(uuid.uuid4())
        target_dir = self.base_dir / unique_folder
        target_dir.mkdir(parents=True, exist_ok=True)

        file_path = target_dir / filename
        with open(file_path, "wb") as f:
            f.write(content)

        # Return relative path from backend root (e.g. storage/uploads/<uuid>/filename.csv)
        return str(file_path.relative_to(Path(".")))

    def delete_file(self, storage_path: Union[str, Path]) -> None:
        """
        Removes file and its parent UUID sub-directory from disk if it exists.
        """
        path = Path(storage_path)
        if path.exists() and path.is_file():
            path.unlink()
            
            # Clean up parent directory if it is empty and inside UPLOAD_DIR
            parent_dir = path.parent
            if parent_dir.exists() and parent_dir.is_dir() and parent_dir != self.base_dir:
                try:
                    parent_dir.rmdir()
                except OSError:
                    # Ignore if folder is not empty or cannot be removed
                    pass

    def get_absolute_path(self, storage_path: Union[str, Path]) -> str:
        """
        Returns the absolute filepath on system for reading/processing.
        """
        return str(Path(storage_path).resolve())

storage_service = LocalStorageService()
