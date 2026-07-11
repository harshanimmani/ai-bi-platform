from typing import Dict, Any, Optional
from pydantic import BaseModel

class MissingValuesSummary(BaseModel):
    count: int
    percentage: float

class NumericalStats(BaseModel):
    count: float
    mean: Optional[float]
    std: Optional[float]
    min: Optional[float]
    p25: Optional[float]
    p50: Optional[float]
    p75: Optional[float]
    max: Optional[float]

class CategoricalStats(BaseModel):
    unique_count: int
    top_values: Dict[str, int]

class AnalysisResponse(BaseModel):
    dataset_id: str
    row_count: int
    col_count: int
    data_types: Dict[str, str]
    missing_values: Dict[str, MissingValuesSummary]
    duplicate_rows: int
    numerical_stats: Dict[str, NumericalStats]
    categorical_stats: Dict[str, CategoricalStats]
    correlation_matrix: Dict[str, Dict[str, Optional[float]]]
