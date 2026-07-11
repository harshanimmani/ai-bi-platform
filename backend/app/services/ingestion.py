import io
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd
from fastapi import HTTPException, status
from app.services.storage import storage_service

# Limit file uploads to 50MB to prevent server memory issues
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

class IngestionEngine:
    """
    Pandas-based ingestion engine.
    Parses, validates, and analyzes CSV and Excel datasets.
    """
    def validate_file_metadata(self, filename: str, content_size: int) -> str:
        """
        Validates the extension and size of the file before storage.
        """
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{suffix}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
            )
            
        if content_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the maximum size limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
            )
            
        return suffix

    def parse_and_analyze(self, file_content: bytes, suffix: str) -> Tuple[int, int, Dict[str, str]]:
        """
        Loads the file in-memory using Pandas to extract row count, column count,
        and database-friendly column types.
        """
        try:
            if suffix == ".csv":
                df = pd.read_csv(io.BytesIO(file_content), nrows=100) # read sample first for faster metrics
                # To get exact row count we read it, but let's read whole file if size permits
                # For safety and completeness, load it to read shape
                df_full = pd.read_csv(io.BytesIO(file_content))
            else:
                df_full = pd.read_excel(io.BytesIO(file_content))

            row_count = len(df_full)
            col_count = len(df_full.columns)
            
            # Map pandas datatypes to standard strings
            columns_metadata = {}
            for col_name, dtype in df_full.dtypes.items():
                columns_metadata[str(col_name)] = str(dtype)
                
            return row_count, col_count, columns_metadata

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse data file: {str(e)}"
            )

    def get_dataset_records(self, storage_path: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Loads the dataset from storage and returns records as list of dicts.
        Supports paging via limit/offset.
        """
        abs_path = storage_service.get_absolute_path(storage_path)
        suffix = Path(abs_path).suffix.lower()
        
        try:
            if suffix == ".csv":
                df = pd.read_csv(abs_path)
            else:
                df = pd.read_excel(abs_path)
                
            # Perform pagination
            paginated_df = df.iloc[offset : offset + limit]
            
            # Fill NaN values with None so they translate to valid JSON nulls
            # rather than float("nan") which fails JSON serialization
            cleaned_df = paginated_df.where(pd.notnull(paginated_df), None)
            
            return cleaned_df.to_dict(orient="records")
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_420_METHOD_FAILURE,
                detail=f"Failed to load dataset records from storage: {str(e)}"
            )

ingestion_engine = IngestionEngine()
