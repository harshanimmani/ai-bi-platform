from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse
from app.services.storage import storage_service
from app.services.ingestion import ingestion_engine

router = APIRouter()

@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload CSV/Excel Dataset",
    description="Validates, processes, stores, and registers a CSV or Excel business data file."
)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Receives file, parses metadata, stores locally, and records entry in database.
    """
    # 1. Read file content to validate size and inspect
    content = await file.read()
    content_size = len(content)
    
    # 2. Validate file extension and size
    suffix = ingestion_engine.validate_file_metadata(file.filename, content_size)
    
    # 3. Parse content using Pandas to extract row/col count and schema types
    row_count, col_count, columns_metadata = ingestion_engine.parse_and_analyze(content, suffix)
    
    # 4. Save file content to storage
    storage_path = storage_service.save_file(file.filename, content)
    
    # 5. Create database record
    try:
        db_dataset = Dataset(
            filename=file.filename,
            storage_path=storage_path,
            file_size=content_size,
            row_count=row_count,
            col_count=col_count,
            columns_metadata=columns_metadata
        )
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        return db_dataset
    except Exception as e:
        # Cleanup saved file on database crash
        storage_service.delete_file(storage_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record dataset in database: {str(e)}"
        )

@router.get(
    "/",
    response_model=List[DatasetResponse],
    summary="List Uploaded Datasets",
    description="Retrieves metadata for all uploaded CSV and Excel datasets."
)
async def list_datasets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    datasets = db.query(Dataset).offset(skip).limit(limit).all()
    return datasets

@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
    summary="Get Dataset Details",
    description="Gets detailed schema metadata for a specific dataset."
)
async def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    return dataset

@router.get(
    "/{dataset_id}/data",
    summary="Get Dataset Raw Rows",
    description="Loads file from storage and returns records. Paged using limit and offset."
)
async def get_dataset_data(
    dataset_id: UUID,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Delegate parsing and reading to ingestion engine
    return ingestion_engine.get_dataset_records(
        storage_path=dataset.storage_path,
        limit=limit,
        offset=offset
    )

@router.delete(
    "/{dataset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Dataset",
    description="Deletes dataset file from storage and removes record from database."
)
async def delete_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    # Delete from local file system
    storage_service.delete_file(dataset.storage_path)
    
    # Delete from database
    db.delete(dataset)
    db.commit()
    return None
