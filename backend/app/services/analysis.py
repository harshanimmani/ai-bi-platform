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

    @staticmethod
    def _apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
        """Applies dynamic filters to the dataframe."""
        if not filters:
            return df
        
        for col, val in filters.items():
            if col in df.columns:
                # If val is a list, use isin, else use ==
                if isinstance(val, list):
                    df = df[df[col].isin(val)]
                else:
                    df = df[df[col] == val]
        return df

    @classmethod
    def analyze_dataset(cls, dataset_id: str, storage_path: str, filename: str, filters: dict = None) -> AnalysisResponse:
        """
        Runs comprehensive analysis on the dataset.
        """
        df = cls._load_dataframe(storage_path, filename)
        if filters:
            df = cls._apply_filters(df, filters)
        
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

    @classmethod
    def get_dataset_preview(
        cls, 
        storage_path: str, 
        filename: str, 
        page: int = 1, 
        limit: int = 20, 
        search: str = None,
        filters: dict = None
    ) -> dict:
        """
        Retrieves a paginated preview of the dataset.
        """
        df = cls._load_dataframe(storage_path, filename)
        if filters:
            df = cls._apply_filters(df, filters)
        
        # Apply search if provided (search across all string columns)
        if search:
            str_cols = df.select_dtypes(include=['object', 'string']).columns
            if len(str_cols) > 0:
                mask = df[str_cols].apply(lambda x: x.astype(str).str.contains(search, case=False, na=False))
                df = df[mask.any(axis=1)]
                
        total_rows = len(df)
        
        # Paginate
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        df_page = df.iloc[start_idx:end_idx]
        
        # Replace NaN with None for JSON serialization
        df_page = df_page.replace({np.nan: None})
        
        return {
            "columns": df.columns.tolist(),
            "rows": df_page.to_dict(orient="records"),
            "total_rows": total_rows,
            "page": page,
            "limit": limit
        }

    @classmethod
    def query_chart_data(
        cls, 
        storage_path: str, 
        filename: str, 
        request: Any # ChartQueryRequest
    ) -> dict:
        """
        Executes dynamic grouping and aggregation for chart generation.
        """
        df = cls._load_dataframe(storage_path, filename)
        
        if request.filters:
            df = cls._apply_filters(df, request.filters)
            
        x = request.x_axis
        y = request.y_axis
        agg = request.agg_func
        
        if x not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column {x} not found")
            
        labels = []
        values = []
        
        # Drop completely empty rows for the selected columns
        cols_to_drop = [x]
        if y and y in df.columns:
            cols_to_drop.append(y)
            
        df = df.dropna(subset=cols_to_drop)
        
        # Histogram or Box Plot (only needs X)
        if request.chart_type in ["histogram", "box"]:
            labels = df[x].tolist()
            values = []
            return {
                "labels": labels,
                "values": values,
                "chart_type": request.chart_type,
                "x_axis_label": x,
                "y_axis_label": "Frequency" if request.chart_type == "histogram" else x
            }
            
        # Scatter Plot (needs X and Y, no aggregation)
        if request.chart_type == "scatter":
            if not y or y not in df.columns:
                raise HTTPException(status_code=400, detail="Scatter plot requires a valid Y-axis")
            # For scatter, labels = x values, values = y values
            labels = df[x].tolist()
            values = df[y].tolist()
            return {
                "labels": labels,
                "values": values,
                "chart_type": request.chart_type,
                "x_axis_label": x,
                "y_axis_label": y
            }
            
        # Bar, Line, Pie, Area (Aggregated by X)
        if request.chart_type in ["bar", "line", "pie", "area"]:
            if y and y in df.columns and agg:
                # Group by X and aggregate Y
                grouped = df.groupby(x)[y]
                if agg == "sum":
                    result = grouped.sum()
                elif agg == "mean":
                    result = grouped.mean()
                elif agg == "count":
                    result = grouped.count()
                elif agg == "min":
                    result = grouped.min()
                elif agg == "max":
                    result = grouped.max()
                else:
                    result = grouped.count()
            else:
                # If no Y or Agg provided, default to frequency count of X
                result = df[x].value_counts()
                y = "Count"
                
            # Convert to DataFrame to allow easy sorting and limiting
            result_df = result.reset_index()
            result_df.columns = [x, 'value']
            
            # Apply Sorting
            if request.sort_order == "asc":
                result_df = result_df.sort_values(by='value', ascending=True)
            elif request.sort_order == "desc":
                result_df = result_df.sort_values(by='value', ascending=False)
                
            # Apply Limit (Top N)
            limit_n = request.limit if request.limit and request.limit > 0 else 100
            result_df = result_df.head(limit_n)
            
            labels = result_df[x].astype(str).tolist()
            values = result_df['value'].tolist()
            
            # Clean values for JSON
            values = [cls._clean_float(v) if pd.notna(v) else None for v in values]
            
            return {
                "labels": labels,
                "values": values,
                "chart_type": request.chart_type,
                "x_axis_label": x,
                "y_axis_label": y if y else "Value"
            }
            
        raise HTTPException(status_code=400, detail="Unsupported chart type or query configuration")
