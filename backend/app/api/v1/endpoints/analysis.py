import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.dataset import Dataset
from app.schemas.analysis import AnalysisResponse, DatasetPreviewResponse
from app.services.analysis import AnalysisEngine
import io

router = APIRouter()

def _parse_filters(filters_str: str) -> dict:
    if not filters_str:
        return None
    try:
        return json.loads(filters_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid filters JSON")

@router.get("/{dataset_id}/summary", response_model=AnalysisResponse)
def get_dataset_analysis_summary(
    dataset_id: uuid.UUID,
    filters: str = None,
    db: Session = Depends(get_db)
):
    """
    Run and retrieve comprehensive statistical analysis for a specific dataset.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    parsed_filters = _parse_filters(filters)
        
    # Analyze the dataset using the pandas engine
    analysis_result = AnalysisEngine.analyze_dataset(
        dataset_id=str(dataset.id),
        storage_path=dataset.storage_path,
        filename=dataset.filename,
        filters=parsed_filters
    )
    
    return analysis_result

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    dataset_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    search: str = None,
    filters: str = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve a paginated preview of the dataset rows.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    parsed_filters = _parse_filters(filters)
        
    preview_data = AnalysisEngine.get_dataset_preview(
        storage_path=dataset.storage_path,
        filename=dataset.filename,
        page=page,
        limit=limit,
        search=search,
        filters=parsed_filters
    )
    return preview_data

@router.get("/{dataset_id}/download")
def download_filtered_dataset(
    dataset_id: uuid.UUID,
    filters: str = None,
    db: Session = Depends(get_db)
):
    """
    Download the dataset as CSV, applying any active filters.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    parsed_filters = _parse_filters(filters)
    
    df = AnalysisEngine._load_dataframe(dataset.storage_path, dataset.filename)
    if parsed_filters:
        df = AnalysisEngine._apply_filters(df, parsed_filters)
        
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=filtered_{dataset.filename}"
    return response

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
