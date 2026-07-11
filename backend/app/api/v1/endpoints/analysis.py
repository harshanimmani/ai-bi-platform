import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.dataset import Dataset
from app.schemas.analysis import AnalysisResponse
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
