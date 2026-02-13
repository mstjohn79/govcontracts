-- =============================================================================
-- GovContracts Intel - Snowflake Backend Setup
-- =============================================================================
-- Run this script to create all Snowflake objects for the GovContracts app
-- Requires: Database with CREATE SCHEMA permissions, Cortex AI access
-- =============================================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS GOVCONTRACTS;
USE SCHEMA GOVCONTRACTS;

-- =============================================================================
-- RAW_CONTRACTS: Stores ingested contract data from USASpending.gov
-- =============================================================================
CREATE OR REPLACE TABLE RAW_CONTRACTS (
    internal_id NUMBER,
    award_id VARCHAR(100),
    generated_internal_id VARCHAR(500) PRIMARY KEY,
    recipient_name VARCHAR(500),
    recipient_uei VARCHAR(50),
    award_amount NUMBER(18,2),
    description TEXT,
    awarding_agency VARCHAR(500),
    awarding_sub_agency VARCHAR(500),
    funding_agency VARCHAR(500),
    start_date DATE,
    end_date DATE,
    last_modified_date TIMESTAMP_NTZ,
    naics_code VARCHAR(20),
    naics_description VARCHAR(500),
    psc_code VARCHAR(20),
    psc_description VARCHAR(500),
    ingested_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    source VARCHAR(50) DEFAULT 'USASPENDING'
);

-- =============================================================================
-- CONTRACTORS: Lookup table for tracked competitors
-- =============================================================================
CREATE OR REPLACE TABLE CONTRACTORS (
    contractor_id NUMBER AUTOINCREMENT PRIMARY KEY,
    original_name VARCHAR(500),
    normalized_name VARCHAR(200),
    is_tracked_competitor BOOLEAN DEFAULT FALSE,
    competitor_category VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Insert tracked competitors
INSERT INTO CONTRACTORS (original_name, normalized_name, is_tracked_competitor, competitor_category)
VALUES
    ('PALANTIR TECHNOLOGIES INC.', 'Palantir', TRUE, 'Data Platform'),
    ('PALANTIR USG INC', 'Palantir', TRUE, 'Data Platform'),
    ('AMAZON WEB SERVICES, INC.', 'AWS', TRUE, 'Cloud'),
    ('MICROSOFT CORPORATION', 'Microsoft', TRUE, 'Cloud'),
    ('GOOGLE LLC', 'Google', TRUE, 'Cloud'),
    ('BOOZ ALLEN HAMILTON INC.', 'Booz Allen', TRUE, 'Consulting'),
    ('CACI, INC. - FEDERAL', 'CACI', TRUE, 'Consulting'),
    ('LEIDOS, INC.', 'Leidos', TRUE, 'Consulting'),
    ('GENERAL DYNAMICS INFORMATION TECHNOLOGY, INC.', 'GDIT', TRUE, 'Consulting'),
    ('DELOITTE CONSULTING LLP', 'Deloitte', TRUE, 'Consulting'),
    ('ACCENTURE FEDERAL SERVICES LLC', 'Accenture', TRUE, 'Consulting'),
    ('DATABRICKS, INC.', 'Databricks', TRUE, 'Data Platform'),
    ('SNOWFLAKE INC.', 'Snowflake', TRUE, 'Data Platform'),
    ('IBM CORPORATION', 'IBM', TRUE, 'Technology'),
    ('ORACLE AMERICA, INC.', 'Oracle', TRUE, 'Database');

-- =============================================================================
-- CONTRACTS_CLASSIFIED: View with Cortex AI classification
-- =============================================================================
CREATE OR REPLACE VIEW CONTRACTS_CLASSIFIED AS
WITH classified AS (
    SELECT 
        r.*,
        -- Use Cortex to classify the contract
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'Classify this government contract into one category. Return ONLY the category name, nothing else.
                Categories: Data Analytics, Artificial Intelligence, Machine Learning, Cloud Services, Cybersecurity, Data Management, Software Development, IT Services, Other
                
                Contract Description: ', LEFT(r.DESCRIPTION, 1000)
            )
        ) AS ai_category,
        -- Calculate Snowflake relevance
        CASE 
            WHEN LOWER(r.DESCRIPTION) LIKE '%data warehouse%' OR LOWER(r.DESCRIPTION) LIKE '%data lake%' 
                 OR LOWER(r.DESCRIPTION) LIKE '%data platform%' OR LOWER(r.DESCRIPTION) LIKE '%etl%' THEN 'high'
            WHEN LOWER(r.DESCRIPTION) LIKE '%data analytics%' OR LOWER(r.DESCRIPTION) LIKE '%analytics%'
                 OR LOWER(r.DESCRIPTION) LIKE '%cloud%' THEN 'medium'
            ELSE 'low'
        END AS snowflake_relevance,
        -- Normalize competitor name
        CASE 
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%PALANTIR%' THEN 'Palantir'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%AMAZON%' OR UPPER(r.RECIPIENT_NAME) LIKE '%AWS%' THEN 'AWS'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%MICROSOFT%' THEN 'Microsoft'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%GOOGLE%' THEN 'Google'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%BOOZ ALLEN%' THEN 'Booz Allen'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%DELOITTE%' THEN 'Deloitte'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%GENERAL DYNAMICS%' THEN 'GDIT'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%LOCKHEED%' THEN 'Lockheed Martin'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%DATABRICKS%' THEN 'Databricks'
            WHEN UPPER(r.RECIPIENT_NAME) LIKE '%ORACLE%' THEN 'Oracle'
            ELSE NULL
        END AS normalized_competitor
    FROM RAW_CONTRACTS r
)
SELECT 
    GENERATED_INTERNAL_ID AS contract_id,
    AWARD_ID,
    RECIPIENT_NAME,
    normalized_competitor,
    AWARD_AMOUNT,
    DESCRIPTION,
    AWARDING_AGENCY,
    AWARDING_SUB_AGENCY,
    START_DATE,
    END_DATE,
    TRIM(ai_category) AS category,
    snowflake_relevance,
    INGESTED_AT
FROM classified;

-- =============================================================================
-- COMPETITOR_SUMMARY: Aggregated competitor analytics
-- =============================================================================
CREATE OR REPLACE VIEW COMPETITOR_SUMMARY AS
SELECT 
    COALESCE(normalized_competitor, 'Other') AS competitor,
    COUNT(*) AS contract_count,
    SUM(AWARD_AMOUNT) AS total_value,
    AVG(AWARD_AMOUNT) AS avg_contract_value,
    MIN(START_DATE) AS earliest_contract,
    MAX(START_DATE) AS latest_contract,
    COUNT(DISTINCT AWARDING_AGENCY) AS agency_count,
    LISTAGG(DISTINCT category, ', ') WITHIN GROUP (ORDER BY category) AS categories
FROM CONTRACTS_CLASSIFIED
GROUP BY COALESCE(normalized_competitor, 'Other')
ORDER BY total_value DESC;

-- =============================================================================
-- SNOWFLAKE_OPPORTUNITIES: Prioritized opportunities for Snowflake
-- =============================================================================
CREATE OR REPLACE VIEW SNOWFLAKE_OPPORTUNITIES AS
SELECT 
    contract_id,
    RECIPIENT_NAME,
    normalized_competitor,
    AWARD_AMOUNT,
    DESCRIPTION,
    AWARDING_AGENCY,
    category,
    snowflake_relevance,
    START_DATE,
    END_DATE,
    -- Opportunity type classification
    CASE 
        WHEN normalized_competitor IN ('Palantir', 'Databricks', 'Oracle') THEN 'Competitive Takeout'
        WHEN snowflake_relevance = 'high' THEN 'High Fit'
        WHEN category IN ('Data Analytics', 'Data Management', 'Cloud Services') THEN 'Category Fit'
        ELSE 'General Opportunity'
    END AS opportunity_type,
    -- Priority scoring (higher = better opportunity)
    CASE snowflake_relevance
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        ELSE 1
    END + 
    CASE 
        WHEN normalized_competitor IN ('Palantir', 'Databricks', 'Oracle') THEN 2
        ELSE 0
    END AS priority_score
FROM CONTRACTS_CLASSIFIED
WHERE snowflake_relevance IN ('high', 'medium')
   OR normalized_competitor IN ('Palantir', 'Databricks', 'Oracle')
ORDER BY priority_score DESC, AWARD_AMOUNT DESC;

-- =============================================================================
-- Sample queries
-- =============================================================================

-- View all classified contracts
-- SELECT * FROM CONTRACTS_CLASSIFIED ORDER BY AWARD_AMOUNT DESC LIMIT 20;

-- View competitor summary
-- SELECT * FROM COMPETITOR_SUMMARY;

-- View top Snowflake opportunities
-- SELECT * FROM SNOWFLAKE_OPPORTUNITIES LIMIT 20;

-- Palantir contracts detail
-- SELECT * FROM CONTRACTS_CLASSIFIED WHERE normalized_competitor = 'Palantir';
