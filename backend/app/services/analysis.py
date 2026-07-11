import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from fastapi import HTTPException
from app.services.storage import storage_service
from app.schemas.analysis import (
    AnalysisResponse,
    MissingValuesSummary,
    NumericalStats,
    CategoricalStats
)

class AnalysisEngine:
    """
    Core data analysis engine using Pandas.
    Extracts statistical insights from a dataset stored on disk.
    """
    
    @staticmethod
    def _load_dataframe(storage_path: str, filename: str) -> pd.DataFrame:
        """Loads CSV or Excel file into a Pandas DataFrame."""
        abs_path = storage_service.get_absolute_path(storage_path)
        if not os.path.exists(abs_path):
            raise HTTPException(status_code=404, detail="Dataset file not found on disk")
            
        try:
            if filename.lower().endswith('.csv'):
                return pd.read_csv(abs_path)
            elif filename.lower().endswith(('.xls', '.xlsx')):
                return pd.read_excel(abs_path)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {str(e)}")

    @staticmethod
    def _clean_float(value: Any) -> Any:
        """Helper to convert NaN/Inf to None for JSON serialization."""
        if pd.isna(value) or np.isinf(value):
            return None
        return float(value)

    @classmethod
    def analyze_dataset(cls, dataset_id: str, storage_path: str, filename: str) -> AnalysisResponse:
        """
        Runs comprehensive analysis on the dataset.
        """
        df = cls._load_dataframe(storage_path, filename)
        
        row_count = len(df)
        col_count = len(df.columns)
        duplicate_rows = int(df.duplicated().sum())
        
        # 1. Data Types mapping
        data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # 2. Missing Values
        missing_values = {}
        for col in df.columns:
            missing_count = int(df[col].isna().sum())
            missing_values[col] = MissingValuesSummary(
                count=missing_count,
                percentage=round((missing_count / row_count) * 100, 2) if row_count > 0 else 0.0
            )
            
        # Separate columns by type
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        
        # 3. Numerical Stats
        numerical_stats = {}
        if numeric_cols and row_count > 0:
            # describe() might drop columns if they are all NaN, handle carefully
            desc = df[numeric_cols].describe()
            for col in numeric_cols:
                if col in desc.columns:
                    numerical_stats[col] = NumericalStats(
                        count=cls._clean_float(desc.loc['count', col]),
                        mean=cls._clean_float(desc.loc['mean', col]),
                        std=cls._clean_float(desc.loc['std', col]),
                        min=cls._clean_float(desc.loc['min', col]),
                        p25=cls._clean_float(desc.loc['25%', col]),
                        p50=cls._clean_float(desc.loc['50%', col]),
                        p75=cls._clean_float(desc.loc['75%', col]),
                        max=cls._clean_float(desc.loc['max', col])
                    )
        
        # 4. Categorical Stats
        categorical_stats = {}
        for col in categorical_cols:
            val_counts = df[col].value_counts(dropna=True).head(10)
            categorical_stats[col] = CategoricalStats(
                unique_count=df[col].nunique(dropna=True),
                top_values={str(k): int(v) for k, v in val_counts.items()}
            )
            
        # 5. Correlation Matrix
        correlation_matrix = {}
        if len(numeric_cols) > 1 and row_count > 0:
            corr_df = df[numeric_cols].corr()
            for col1 in corr_df.columns:
                correlation_matrix[col1] = {}
                for col2 in corr_df.columns:
                    val = corr_df.loc[col1, col2]
                    correlation_matrix[col1][col2] = cls._clean_float(val)
                    
        return AnalysisResponse(
            dataset_id=str(dataset_id),
            row_count=row_count,
            col_count=col_count,
            data_types=data_types,
            missing_values=missing_values,
            duplicate_rows=duplicate_rows,
            numerical_stats=numerical_stats,
            categorical_stats=categorical_stats,
            correlation_matrix=correlation_matrix
        )
