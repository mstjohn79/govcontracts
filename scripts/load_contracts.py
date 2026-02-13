#!/usr/bin/env python3
"""
Load government contracts from USASpending API into Snowflake.
Run this script to populate the contracts database.
"""

import json
import requests
from datetime import datetime, timedelta
import snowflake.connector
from snowflake.connector.pandas_tools import write_pandas
import pandas as pd
import os

# USASpending API endpoint
USA_SPENDING_API = "https://api.usaspending.gov/api/v2/search/spending_by_award/"

# Keywords for Data/AI contracts
SEARCH_KEYWORDS = [
    "data analytics",
    "artificial intelligence", 
    "machine learning",
    "data warehouse",
    "data lake",
    "cloud computing",
    "big data",
    "data platform",
    "data engineering",
    "business intelligence",
    "Palantir",
    "database",
    "ETL",
    "data integration",
]

def fetch_contracts(keyword: str, limit: int = 500) -> list:
    """Fetch contracts from USASpending API for a given keyword."""
    params = {
        "filters": {
            "keywords": [keyword],
            "award_type_codes": ["A", "B", "C", "D"],
            "time_period": [{
                "start_date": "2020-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
            }],
        },
        "fields": [
            "Award ID",
            "Recipient Name",
            "Award Amount", 
            "Description",
            "Awarding Agency",
            "Awarding Sub Agency",
            "Start Date",
            "End Date",
            "NAICS Code",
            "NAICS Description",
            "Product or Service Code",
        ],
        "limit": limit,
        "sort": "Award Amount",
        "order": "desc",
    }
    
    try:
        response = requests.post(USA_SPENDING_API, json=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"Error fetching '{keyword}': {e}")
        return []

def transform_contracts(results: list) -> pd.DataFrame:
    """Transform API results to DataFrame matching Snowflake schema."""
    records = []
    for r in results:
        records.append({
            "INTERNAL_ID": r.get("internal_id"),
            "AWARD_ID": r.get("Award ID"),
            "GENERATED_INTERNAL_ID": r.get("generated_internal_id"),
            "RECIPIENT_NAME": r.get("Recipient Name"),
            "AWARD_AMOUNT": r.get("Award Amount") or 0,
            "DESCRIPTION": r.get("Description"),
            "AWARDING_AGENCY": r.get("Awarding Agency"),
            "AWARDING_SUB_AGENCY": r.get("Awarding Sub Agency"),
            "START_DATE": r.get("Start Date"),
            "END_DATE": r.get("End Date"),
            "NAICS_CODE": r.get("NAICS Code"),
            "NAICS_DESCRIPTION": r.get("NAICS Description"),
            "PSC_CODE": r.get("Product or Service Code"),
        })
    
    df = pd.DataFrame(records)
    
    # Convert dates
    df["START_DATE"] = pd.to_datetime(df["START_DATE"], errors="coerce")
    df["END_DATE"] = pd.to_datetime(df["END_DATE"], errors="coerce")
    
    # Remove duplicates based on generated_internal_id
    df = df.drop_duplicates(subset=["GENERATED_INTERNAL_ID"])
    
    return df

def connect_snowflake():
    """Connect to Snowflake using default connection."""
    return snowflake.connector.connect(
        connection_name="martydemo",  # Uses ~/.snowflake/connections.toml
        database="EPLAYGROUND",
        schema="GOVCONTRACTS",
        warehouse="EPLAYGROUND_WH",
    )

def load_to_snowflake(df: pd.DataFrame, conn):
    """Load DataFrame to Snowflake RAW_CONTRACTS table."""
    # Write to a temp table first
    success, nchunks, nrows, _ = write_pandas(
        conn,
        df,
        "RAW_CONTRACTS",
        database="EPLAYGROUND",
        schema="GOVCONTRACTS",
        auto_create_table=False,
        overwrite=False,
        quote_identifiers=False,
    )
    return nrows

def main():
    print("=" * 60)
    print("GovContracts Data Loader")
    print("=" * 60)
    
    all_contracts = []
    seen_ids = set()
    
    for keyword in SEARCH_KEYWORDS:
        print(f"\nFetching contracts for: '{keyword}'...")
        results = fetch_contracts(keyword, limit=200)
        
        # Deduplicate across keywords
        new_results = []
        for r in results:
            gen_id = r.get("generated_internal_id")
            if gen_id and gen_id not in seen_ids:
                seen_ids.add(gen_id)
                new_results.append(r)
        
        all_contracts.extend(new_results)
        print(f"  Found {len(results)} contracts, {len(new_results)} new")
    
    print(f"\n{'=' * 60}")
    print(f"Total unique contracts: {len(all_contracts)}")
    
    if not all_contracts:
        print("No contracts found!")
        return
    
    # Transform to DataFrame
    df = transform_contracts(all_contracts)
    print(f"DataFrame shape: {df.shape}")
    
    # Save to CSV for manual upload if needed
    csv_path = "/tmp/govcontracts_data.csv"
    df.to_csv(csv_path, index=False)
    print(f"Saved to: {csv_path}")
    
    # Try to load to Snowflake
    try:
        print("\nConnecting to Snowflake...")
        conn = connect_snowflake()
        print("Loading data to RAW_CONTRACTS...")
        nrows = load_to_snowflake(df, conn)
        print(f"Successfully loaded {nrows} rows!")
        conn.close()
    except Exception as e:
        print(f"Error loading to Snowflake: {e}")
        print(f"Data saved to CSV: {csv_path}")
        print("You can manually upload using: PUT file://{csv_path} @CONTRACT_DATA_STAGE")

if __name__ == "__main__":
    main()
