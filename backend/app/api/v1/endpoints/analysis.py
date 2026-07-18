import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.dataset import Dataset
from app.schemas.analysis import AnalysisResponse, DatasetPreviewResponse
from app.services.analysis import AnalysisEngine

router = APIRouter()

@router.get("/{dataset_id}/summary", response_model=AnalysisResponse)
def get_dataset_analysis_summary(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Run and retrieve comprehensive statistical analysis for a specific dataset.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Analyze the dataset using the pandas engine
    analysis_result = AnalysisEngine.analyze_dataset(
        dataset_id=str(dataset.id),
        storage_path=dataset.storage_path,
        filename=dataset.filename
    )
    
    return analysis_result

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    dataset_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    search: str = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve a paginated preview of the dataset rows.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    preview_data = AnalysisEngine.get_dataset_preview(
        storage_path=dataset.storage_path,
        filename=dataset.filename,
        page=page,
        limit=limit,
        search=search
    )
    return preview_data

from app.schemas.analysis import ChartQueryRequest, ChartQueryResponse

@router.post("/{dataset_id}/query", response_model=ChartQueryResponse)
def query_chart_data(
    dataset_id: uuid.UUID,
    request: ChartQueryRequest,
    db: Session = Depends(get_db)
):
    """
    Execute dynamic grouping and aggregation for chart generation.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    chart_data = AnalysisEngine.query_chart_data(
        storage_path=dataset.storage_path,
        filename=dataset.filename,
        request=request
    )
    return chart_data
