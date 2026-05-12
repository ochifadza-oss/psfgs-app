-- ============================================================
-- PSFGS - Public Sector Financial Governance Suite
-- Buffalo City Metropolitan Municipality
-- Database Initialization Script - MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS psfgs_bcmm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE psfgs_bcmm;

-- ============================================================
-- CORE / SHARED TABLES
-- ============================================================

CREATE TABLE core_entity (
  entity_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_name     VARCHAR(200) NOT NULL,
  logo_path       VARCHAR(255) DEFAULT NULL,
  abbreviation    VARCHAR(20) DEFAULT NULL,
  demarcation_code VARCHAR(10) DEFAULT NULL,
  physical_address TEXT DEFAULT NULL,
  postal_address  TEXT DEFAULT NULL,
  phone           VARCHAR(30) DEFAULT NULL,
  fax             VARCHAR(30) DEFAULT NULL,
  email           VARCHAR(150) DEFAULT NULL,
  website         VARCHAR(200) DEFAULT NULL,
  municipal_manager VARCHAR(100) DEFAULT NULL,
  cfo_name        VARCHAR(100) DEFAULT NULL,
  mayor_name      VARCHAR(100) DEFAULT NULL,
  speaker_name    VARCHAR(100) DEFAULT NULL,
  entity_type     ENUM('Metropolitan','District','Local','Provincial','National') NOT NULL,
  legislation_type ENUM('MFMA','PFMA') NOT NULL DEFAULT 'MFMA',
  province        VARCHAR(50),
  financial_year_end TINYINT UNSIGNED DEFAULT 6,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE core_directorate (
  directorate_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  name            VARCHAR(200) NOT NULL,
  code            VARCHAR(20),
  head_official   VARCHAR(100),
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

CREATE TABLE core_user (
  user_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  role            ENUM('System_Admin','Accounting_Officer','CFO','Director','Manager','Officer','Auditor','Viewer') NOT NULL DEFAULT 'Officer',
  directorate_id  INT UNSIGNED,
  two_fa_enabled  TINYINT(1) NOT NULL DEFAULT 0,
  last_login      DATETIME,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_user_email (email),
  INDEX idx_user_role (role),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (directorate_id) REFERENCES core_directorate(directorate_id)
) ENGINE=InnoDB;

CREATE TABLE core_audit_log (
  log_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED,
  application     VARCHAR(10) NOT NULL,
  table_name      VARCHAR(60) NOT NULL,
  record_id       BIGINT UNSIGNED,
  action          ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  before_json     JSON,
  after_json      JSON,
  ip_address      VARCHAR(45),
  logged_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_time (logged_at)
) ENGINE=InnoDB;

CREATE TABLE core_notification (
  notif_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  recipient_id    INT UNSIGNED NOT NULL,
  application     VARCHAR(10) NOT NULL,
  notif_type      ENUM('INFO','WARNING','ACTION_REQUIRED','ESCALATION','DEADLINE') NOT NULL,
  subject         VARCHAR(200) NOT NULL,
  body            TEXT,
  channel         ENUM('EMAIL','IN_APP','BOTH') NOT NULL DEFAULT 'IN_APP',
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         DATETIME,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (recipient_id) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

CREATE TABLE core_ai_call_log (
  call_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED,
  application     VARCHAR(10) NOT NULL,
  feature         VARCHAR(60),
  model           VARCHAR(50),
  prompt_tokens   INT UNSIGNED,
  completion_tokens INT UNSIGNED,
  latency_ms      INT UNSIGNED,
  success         TINYINT(1) NOT NULL DEFAULT 1,
  called_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_entity (entity_id),
  INDEX idx_ai_time (called_at)
) ENGINE=InnoDB;

-- ============================================================
-- DOMAIN A: AUDIT READINESS
-- ============================================================

-- AFT - Audit Findings Tracker
CREATE TABLE aft_audit_year (
  year_id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id           INT UNSIGNED NOT NULL,
  financial_year      VARCHAR(10) NOT NULL,
  ag_letter_uploaded  TINYINT(1) NOT NULL DEFAULT 0,
  ag_letter_path      VARCHAR(512),
  ai_extraction_status ENUM('Not_Started','Processing','Completed','Failed') DEFAULT 'Not_Started',
  total_findings      SMALLINT UNSIGNED DEFAULT 0,
  closed_findings     SMALLINT UNSIGNED DEFAULT 0,
  audit_opinion       ENUM('Clean','Unqualified_With_Findings','Qualified','Adverse','Disclaimer') DEFAULT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

CREATE TABLE aft_finding (
  finding_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  audit_year_id   INT UNSIGNED NOT NULL,
  ag_ref_number   VARCHAR(30),
  description     TEXT NOT NULL,
  finding_type    ENUM('Material_Irregularity','Significant','Other','Compliance','Performance') NOT NULL,
  severity        ENUM('Critical','High','Medium','Low') NOT NULL,
  root_cause      TEXT,
  financial_impact DECIMAL(18,2) DEFAULT 0.00,
  directorate_id  INT UNSIGNED,
  status          ENUM('New','Assigned','In_Progress','Evidence_Submitted','Under_Review','Closed','Overdue') NOT NULL DEFAULT 'New',
  is_repeat       TINYINT(1) NOT NULL DEFAULT 0,
  repeat_years_count TINYINT UNSIGNED DEFAULT 0,
  ai_classification JSON,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_finding_ref (ag_ref_number),
  INDEX idx_finding_status (status),
  INDEX idx_finding_repeat (is_repeat),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (audit_year_id) REFERENCES aft_audit_year(year_id),
  FOREIGN KEY (directorate_id) REFERENCES core_directorate(directorate_id)
) ENGINE=InnoDB;

CREATE TABLE aft_assignment (
  assignment_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  finding_id      BIGINT UNSIGNED NOT NULL,
  assignee_id     INT UNSIGNED NOT NULL,
  assigned_by     INT UNSIGNED NOT NULL,
  due_date        DATE NOT NULL,
  escalation_level TINYINT UNSIGNED DEFAULT 0,
  escalated_to    INT UNSIGNED,
  status          ENUM('Active','Completed','Escalated','Reassigned') NOT NULL DEFAULT 'Active',
  notes           TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assign_status (status),
  FOREIGN KEY (finding_id) REFERENCES aft_finding(finding_id),
  FOREIGN KEY (assignee_id) REFERENCES core_user(user_id),
  FOREIGN KEY (assigned_by) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

CREATE TABLE aft_evidence (
  evidence_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  finding_id      BIGINT UNSIGNED NOT NULL,
  filename        VARCHAR(255) NOT NULL,
  file_path       VARCHAR(512),
  file_size_kb    INT UNSIGNED,
  uploaded_by     INT UNSIGNED NOT NULL,
  upload_date     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status          ENUM('Uploaded','Accepted','Rejected') NOT NULL DEFAULT 'Uploaded',
  reviewed_by     INT UNSIGNED,
  reviewer_notes  TEXT,
  FOREIGN KEY (finding_id) REFERENCES aft_finding(finding_id),
  FOREIGN KEY (uploaded_by) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

CREATE TABLE aft_response (
  response_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  finding_id      BIGINT UNSIGNED NOT NULL,
  response_text   TEXT NOT NULL,
  drafted_by      INT UNSIGNED NOT NULL,
  is_ai_generated TINYINT(1) NOT NULL DEFAULT 0,
  approved_by     INT UNSIGNED,
  approved_at     DATETIME,
  version         TINYINT UNSIGNED DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finding_id) REFERENCES aft_finding(finding_id),
  FOREIGN KEY (drafted_by) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- PYT - Prior Year Closure Tracker
CREATE TABLE pyt_prior_finding (
  pf_id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  original_finding_id BIGINT UNSIGNED,
  financial_year  VARCHAR(10) NOT NULL,
  description     TEXT NOT NULL,
  closure_status  ENUM('Open','In_Progress','Closed','Carried_Forward') NOT NULL DEFAULT 'Open',
  closure_evidence_path VARCHAR(512),
  responsible_id  INT UNSIGNED,
  target_date     DATE,
  closed_date     DATE,
  ai_risk_score   TINYINT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (original_finding_id) REFERENCES aft_finding(finding_id),
  FOREIGN KEY (responsible_id) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- ARR - AG Response Manager
CREATE TABLE arr_response_pack (
  pack_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  audit_year_id   INT UNSIGNED NOT NULL,
  title           VARCHAR(200) NOT NULL,
  due_date        DATE NOT NULL,
  status          ENUM('Draft','In_Review','Submitted','Accepted') NOT NULL DEFAULT 'Draft',
  submitted_date  DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (audit_year_id) REFERENCES aft_audit_year(year_id)
) ENGINE=InnoDB;

-- AVS - Asset Verification System
CREATE TABLE avs_asset_category (
  category_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  category_name   VARCHAR(100) NOT NULL,
  grap_class      VARCHAR(50),
  useful_life_default SMALLINT UNSIGNED,
  depreciation_method ENUM('Straight_Line','Diminishing_Balance','Units_of_Production') DEFAULT 'Straight_Line',
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

CREATE TABLE avs_location (
  location_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  location_name   VARCHAR(200) NOT NULL,
  building        VARCHAR(100),
  floor_room      VARCHAR(50),
  gps_lat         DECIMAL(10,7),
  gps_lng         DECIMAL(10,7),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

CREATE TABLE avs_asset (
  asset_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  asset_number    VARCHAR(30),
  barcode         VARCHAR(60),
  description     VARCHAR(255) NOT NULL,
  category_id     INT UNSIGNED,
  acquisition_date DATE,
  cost            DECIMAL(18,2) DEFAULT 0.00,
  useful_life_months SMALLINT UNSIGNED,
  residual_value  DECIMAL(18,2) DEFAULT 0.00,
  location_id     INT UNSIGNED,
  `condition`     ENUM('New','Good','Fair','Poor','Unserviceable','Disposed') DEFAULT 'Good',
  responsible_official INT UNSIGNED,
  status          ENUM('Active','Disposed','Transferred','Missing','Ghost') NOT NULL DEFAULT 'Active',
  ai_condition_score TINYINT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_asset_number (asset_number),
  INDEX idx_asset_barcode (barcode),
  INDEX idx_asset_status (status),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (category_id) REFERENCES avs_asset_category(category_id),
  FOREIGN KEY (location_id) REFERENCES avs_location(location_id),
  FOREIGN KEY (responsible_official) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

CREATE TABLE avs_depreciation (
  record_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asset_id        BIGINT UNSIGNED NOT NULL,
  period          DATE NOT NULL,
  opening_carrying_value DECIMAL(18,2),
  depreciation_charge DECIMAL(18,2),
  impairment      DECIMAL(18,2) DEFAULT 0.00,
  closing_carrying_value DECIMAL(18,2),
  journal_reference VARCHAR(50),
  INDEX idx_dep_period (period),
  FOREIGN KEY (asset_id) REFERENCES avs_asset(asset_id)
) ENGINE=InnoDB;

CREATE TABLE avs_verification_session (
  session_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  session_name    VARCHAR(100) NOT NULL,
  conducted_by    INT UNSIGNED,
  start_date      DATE,
  end_date        DATE,
  status          ENUM('Planned','In_Progress','Completed','Cancelled') NOT NULL DEFAULT 'Planned',
  assets_verified INT UNSIGNED DEFAULT 0,
  assets_not_found INT UNSIGNED DEFAULT 0,
  ghost_assets_found INT UNSIGNED DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (conducted_by) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- ============================================================
-- DOMAIN B: FINANCIAL CONTROL
-- ============================================================

-- BVM - Budget vs Actual Monitor
CREATE TABLE bvm_budget (
  budget_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  financial_year  VARCHAR(10) NOT NULL,
  vote_code       VARCHAR(20) NOT NULL,
  vote_description VARCHAR(200),
  directorate_id  INT UNSIGNED,
  original_budget DECIMAL(18,2) DEFAULT 0.00,
  adjusted_budget DECIMAL(18,2) DEFAULT 0.00,
  virement_total  DECIMAL(18,2) DEFAULT 0.00,
  budget_type     ENUM('Operating','Capital') NOT NULL DEFAULT 'Operating',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_budget_year (financial_year),
  INDEX idx_budget_vote (vote_code),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (directorate_id) REFERENCES core_directorate(directorate_id)
) ENGINE=InnoDB;

CREATE TABLE bvm_expenditure (
  exp_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  budget_id       BIGINT UNSIGNED NOT NULL,
  period          DATE NOT NULL,
  actual_spend    DECIMAL(18,2) DEFAULT 0.00,
  commitment      DECIMAL(18,2) DEFAULT 0.00,
  projected_yearend DECIMAL(18,2) DEFAULT 0.00,
  ytd_variance_pct DECIMAL(8,4) DEFAULT 0.0000,
  import_batch_id INT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_exp_period (period),
  FOREIGN KEY (budget_id) REFERENCES bvm_budget(budget_id)
) ENGINE=InnoDB;

-- IFW - Irregular, Fruitless, Wasteful Expenditure Register
CREATE TABLE ifw_item (
  item_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  reference_number VARCHAR(30),
  ifwe_type       ENUM('Irregular','Fruitless_Wasteful','Unauthorised') NOT NULL,
  amount          DECIMAL(18,2) NOT NULL,
  financial_year  VARCHAR(10),
  description     TEXT,
  root_cause      TEXT,
  responsible_official_id INT UNSIGNED,
  ai_root_cause_code VARCHAR(30),
  status          ENUM('Identified','Under_Investigation','Condonation_Applied','Condoned','Not_Condoned','Recovery_In_Progress','Recovered','Written_Off') NOT NULL DEFAULT 'Identified',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ifw_ref (reference_number),
  INDEX idx_ifw_type (ifwe_type),
  INDEX idx_ifw_status (status),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (responsible_official_id) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

CREATE TABLE ifw_condonation (
  cond_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id         BIGINT UNSIGNED NOT NULL,
  application_date DATE,
  council_resolution_no VARCHAR(50),
  nt_submission_date DATE,
  nt_reference    VARCHAR(50),
  outcome         ENUM('Pending','Condoned','Not_Condoned','Withdrawn') DEFAULT 'Pending',
  outcome_date    DATE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES ifw_item(item_id)
) ENGINE=InnoDB;

-- CFF - Cash Flow Forecasting
CREATE TABLE cff_projection (
  projection_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  projection_date DATE NOT NULL,
  scenario        ENUM('Base','Optimistic','Pessimistic') NOT NULL DEFAULT 'Base',
  period          DATE NOT NULL,
  opening_balance DECIMAL(18,2) DEFAULT 0.00,
  total_inflows   DECIMAL(18,2) DEFAULT 0.00,
  total_outflows  DECIMAL(18,2) DEFAULT 0.00,
  closing_balance DECIMAL(18,2) DEFAULT 0.00,
  shortfall_alert_flag TINYINT(1) DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cff_date (projection_date),
  INDEX idx_cff_alert (shortfall_alert_flag),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

-- PSA - Procurement Spend Analytics
CREATE TABLE psa_transaction (
  trans_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  transaction_date DATE,
  supplier_id     INT UNSIGNED,
  amount          DECIMAL(18,2) DEFAULT 0.00,
  category_code   VARCHAR(20),
  procurement_type ENUM('Quotation','Competitive_Bid','Single_Source','Emergency','Deviation') DEFAULT 'Quotation',
  vote_code       VARCHAR(20),
  order_reference VARCHAR(50),
  split_order_flag TINYINT(1) DEFAULT 0,
  anomaly_score   DECIMAL(5,4) DEFAULT 0.0000,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_psa_date (transaction_date),
  INDEX idx_psa_supplier (supplier_id),
  INDEX idx_psa_category (category_code),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

-- ============================================================
-- DOMAIN C: REPORTING & BI
-- ============================================================

-- S71 - Section 71 Auto-Generator
CREATE TABLE s71_report (
  report_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  period          DATE NOT NULL,
  status          ENUM('Draft','CFO_Review','AO_Approval','Submitted','Late') NOT NULL DEFAULT 'Draft',
  initiated_by    INT UNSIGNED,
  approved_by     INT UNSIGNED,
  submitted_date  DATETIME,
  days_after_month_end TINYINT UNSIGNED,
  nt_reference    VARCHAR(50),
  ai_narrative_json LONGTEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_s71_period (period),
  INDEX idx_s71_status (status),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (initiated_by) REFERENCES core_user(user_id),
  FOREIGN KEY (approved_by) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- PKD - Performance KPI Dashboard
CREATE TABLE pkd_kpi (
  kpi_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  financial_year  VARCHAR(10) NOT NULL,
  kpi_code        VARCHAR(30),
  description     TEXT,
  unit_of_measure VARCHAR(50),
  annual_target   DECIMAL(18,4),
  directorate_id  INT UNSIGNED,
  idp_objective_id INT UNSIGNED,
  status          ENUM('Active','Suspended','Achieved','Not_Achieved') NOT NULL DEFAULT 'Active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kpi_year (financial_year),
  INDEX idx_kpi_code (kpi_code),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (directorate_id) REFERENCES core_directorate(directorate_id)
) ENGINE=InnoDB;

CREATE TABLE pkd_quarterly_record (
  record_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kpi_id          BIGINT UNSIGNED NOT NULL,
  quarter         TINYINT UNSIGNED NOT NULL,
  milestone_target DECIMAL(18,4),
  actual_achievement DECIMAL(18,4),
  variance_pct    DECIMAL(8,4),
  traffic_light   ENUM('Green','Amber','Red') DEFAULT 'Green',
  evidence_path   VARCHAR(512),
  narrative       TEXT,
  ai_commentary   TEXT,
  submitted_by    INT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_id) REFERENCES pkd_kpi(kpi_id),
  FOREIGN KEY (submitted_by) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- ARD - Annual Report Auto-Drafter
CREATE TABLE ard_report_section (
  section_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  financial_year  VARCHAR(10) NOT NULL,
  chapter         VARCHAR(100) NOT NULL,
  section_title   VARCHAR(200) NOT NULL,
  content         LONGTEXT,
  is_ai_drafted   TINYINT(1) DEFAULT 0,
  status          ENUM('Not_Started','Draft','Review','Approved') DEFAULT 'Not_Started',
  assigned_to     INT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (assigned_to) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- ERP - Executive Reporting Portal
CREATE TABLE erp_metric_snapshot (
  snapshot_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  metric_source   VARCHAR(10),
  metric_key      VARCHAR(60),
  metric_value    DECIMAL(18,4),
  metric_text     VARCHAR(200),
  alert_level     ENUM('Normal','Watch','Warning','Critical') DEFAULT 'Normal',
  period          DATE,
  captured_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_erp_source (metric_source),
  INDEX idx_erp_key (metric_key),
  INDEX idx_erp_time (captured_at),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

-- ============================================================
-- DOMAIN D: COMPLIANCE & RISK
-- ============================================================

-- SCC - SCM Compliance Checker
CREATE TABLE scc_compliance_rule (
  rule_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  rule_name       VARCHAR(200) NOT NULL,
  rule_description TEXT,
  category        ENUM('Value_Threshold','Documentation','Supplier_Verification','Budget_Availability','Delegation','BEE_Compliance') NOT NULL,
  threshold_min   DECIMAL(18,2),
  threshold_max   DECIMAL(18,2),
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id)
) ENGINE=InnoDB;

CREATE TABLE scc_requisition (
  req_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  request_date    DATE NOT NULL,
  requester_id    INT UNSIGNED NOT NULL,
  description     TEXT,
  estimated_value DECIMAL(18,2) DEFAULT 0.00,
  supplier_name   VARCHAR(200),
  procurement_method ENUM('Petty_Cash','Written_Quotation','Competitive_Bid','Single_Source','Emergency','Deviation') DEFAULT 'Written_Quotation',
  compliance_score TINYINT UNSIGNED DEFAULT 0,
  status          ENUM('Draft','Checking','Passed','Failed','Deviation_Requested','Approved','Rejected') NOT NULL DEFAULT 'Draft',
  ai_risk_notes   TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scc_status (status),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (requester_id) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

CREATE TABLE scc_compliance_check (
  check_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  req_id          BIGINT UNSIGNED NOT NULL,
  check_type      ENUM('Value_Threshold','Documentation','Supplier_Verification','Budget_Availability','Delegation','BEE_Compliance') NOT NULL,
  result          ENUM('Pass','Fail','Warning','Not_Applicable') NOT NULL,
  failure_reason  VARCHAR(500),
  rule_id         INT UNSIGNED,
  checked_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (req_id) REFERENCES scc_requisition(req_id),
  FOREIGN KEY (rule_id) REFERENCES scc_compliance_rule(rule_id)
) ENGINE=InnoDB;

-- CMT - Consequence Management Tracker
CREATE TABLE cmt_misconduct_case (
  case_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  case_reference  VARCHAR(30),
  misconduct_type ENUM('Irregular_Expenditure','Fruitless_Wasteful','Fraud','Theft','Negligence','Policy_Violation','Other') NOT NULL,
  accused_official_id INT UNSIGNED,
  financial_impact DECIMAL(18,2) DEFAULT 0.00,
  referral_source ENUM('AGSA','Internal_Audit','Whistleblower','Management','MPAC','Treasury') NOT NULL,
  stage           ENUM('Registered','Investigation','Disciplinary_Hearing','Appeal','Recovery','Closed') NOT NULL DEFAULT 'Registered',
  outcome         ENUM('Pending','Guilty','Not_Guilty','Settled','Resigned','Dismissed') DEFAULT 'Pending',
  registered_by   INT UNSIGNED,
  registered_date DATE,
  closed_date     DATE,
  ifw_item_id     BIGINT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cmt_ref (case_reference),
  INDEX idx_cmt_stage (stage),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (accused_official_id) REFERENCES core_user(user_id),
  FOREIGN KEY (registered_by) REFERENCES core_user(user_id),
  FOREIGN KEY (ifw_item_id) REFERENCES ifw_item(item_id)
) ENGINE=InnoDB;

-- DAR - Delegation of Authority Register
CREATE TABLE dar_delegation (
  delegation_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  delegator_id    INT UNSIGNED NOT NULL,
  delegate_id     INT UNSIGNED NOT NULL,
  power_description TEXT NOT NULL,
  financial_limit DECIMAL(18,2),
  effective_date  DATE NOT NULL,
  expiry_date     DATE,
  legislative_reference VARCHAR(100),
  parent_delegation_id BIGINT UNSIGNED,
  status          ENUM('Active','Expired','Revoked','Suspended') NOT NULL DEFAULT 'Active',
  council_resolution VARCHAR(80),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dar_effective (effective_date),
  INDEX idx_dar_expiry (expiry_date),
  INDEX idx_dar_status (status),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (delegator_id) REFERENCES core_user(user_id),
  FOREIGN KEY (delegate_id) REFERENCES core_user(user_id),
  FOREIGN KEY (parent_delegation_id) REFERENCES dar_delegation(delegation_id)
) ENGINE=InnoDB;

-- PCR - Policy Compliance Manager
CREATE TABLE pcr_policy (
  policy_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_id       INT UNSIGNED NOT NULL,
  policy_name     VARCHAR(200) NOT NULL,
  category        ENUM('Financial','SCM','HR','IT','Governance','Risk','Performance','Other') NOT NULL,
  current_version VARCHAR(10),
  effective_date  DATE,
  review_date     DATE,
  owner_id        INT UNSIGNED,
  council_minute_ref VARCHAR(80),
  status          ENUM('Draft','Active','Under_Review','Expired','Superseded') NOT NULL DEFAULT 'Draft',
  document_path   VARCHAR(512),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pcr_category (category),
  INDEX idx_pcr_review (review_date),
  INDEX idx_pcr_status (status),
  FOREIGN KEY (entity_id) REFERENCES core_entity(entity_id),
  FOREIGN KEY (owner_id) REFERENCES core_user(user_id)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA - Buffalo City Metropolitan Municipality
-- ============================================================

INSERT INTO core_entity (entity_name, abbreviation, demarcation_code, physical_address, postal_address, phone, fax, email, website, municipal_manager, cfo_name, mayor_name, speaker_name, entity_type, legislation_type, province, financial_year_end)
VALUES ('Buffalo City Metropolitan Municipality', 'BCMM', 'BUF', 'Trust Bank Centre, Oxford Street, East London, 5201', 'P.O. Box 134, East London, 5200', '043 705 2000', '043 743 8568', 'info@buffalocity.gov.za', 'www.buffalocity.gov.za', 'TBD', 'TBD', 'TBD', 'TBD', 'Metropolitan', 'MFMA', 'Eastern Cape', 6);

SET @eid = LAST_INSERT_ID();

-- Directorates
INSERT INTO core_directorate (entity_id, name, code) VALUES
(@eid, 'Office of the City Manager', 'CM'),
(@eid, 'Chief Financial Officer', 'CFO'),
(@eid, 'Corporate Services', 'CS'),
(@eid, 'Public Health', 'PH'),
(@eid, 'Development Planning', 'DP'),
(@eid, 'Engineering and Infrastructure Services', 'EIS'),
(@eid, 'Internal Audit', 'IA'),
(@eid, 'Supply Chain Management', 'SCM'),
(@eid, 'Human Settlements', 'HS'),
(@eid, 'Public Safety', 'PS');

-- Default admin user (password: Admin@2026!)
INSERT INTO core_user (entity_id, email, password_hash, full_name, role, directorate_id)
VALUES (@eid, 'admin@buffalocity.gov.za',
  '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky',
  'System Administrator', 'System_Admin', 1);

-- Sample users
INSERT INTO core_user (entity_id, email, password_hash, full_name, role, directorate_id) VALUES
(@eid, 'cfo@buffalocity.gov.za', '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky', 'L. Ngcobondwana', 'CFO', 2),
(@eid, 'cm@buffalocity.gov.za', '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky', 'A. Sihlahla', 'Accounting_Officer', 1),
(@eid, 'scm@buffalocity.gov.za', '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky', 'S. Maqubela', 'Manager', 8),
(@eid, 'finance@buffalocity.gov.za', '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky', 'T. Madikizela', 'Manager', 2),
(@eid, 'audit@buffalocity.gov.za', '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky', 'N. Jikeka', 'Auditor', 7),
(@eid, 'director.eis@buffalocity.gov.za', '$2b$12$LJ3dPxVOqGJrFOyVzBfyXeGz6yCxvQa5pFdL6E4vC7mZ8kN2wR4Ky', 'M. Cekiso', 'Director', 6);

-- Audit Years (BCMM has historically received Qualified/Disclaimer opinions)
INSERT INTO aft_audit_year (entity_id, financial_year, audit_opinion, total_findings, closed_findings) VALUES
(@eid, '2018/19', 'Disclaimer', 68, 19),
(@eid, '2019/20', 'Disclaimer', 72, 22),
(@eid, '2020/21', 'Qualified', 61, 25),
(@eid, '2021/22', 'Qualified', 58, 30),
(@eid, '2022/23', 'Qualified', 55, 32),
(@eid, '2023/24', NULL, 49, 8);

-- Findings for 2023/24
INSERT INTO aft_finding (entity_id, audit_year_id, ag_ref_number, description, finding_type, severity, financial_impact, directorate_id, status, is_repeat, repeat_years_count) VALUES
(@eid, 6, 'AG-24-001', 'Irregular expenditure of R1.8 billion not investigated for consequence management as required by Section 32 of the MFMA', 'Material_Irregularity', 'Critical', 1800000000.00, 1, 'Overdue', 1, 5),
(@eid, 6, 'AG-24-002', 'Water and sanitation infrastructure assets not componentised per GRAP 17 requirements - carrying value R8.2 billion at risk', 'Significant', 'Critical', 8200000000.00, 6, 'In_Progress', 1, 4),
(@eid, 6, 'AG-24-003', 'Revenue from water and electricity not billed accurately - R312M estimated loss from non-revenue water', 'Significant', 'High', 312000000.00, 2, 'In_Progress', 1, 5),
(@eid, 6, 'AG-24-004', 'Creditors payment period exceeds 30 days as prescribed by MFMA Section 65(2)(e) - average 87 days', 'Compliance', 'High', 0.00, 2, 'Evidence_Submitted', 1, 4),
(@eid, 6, 'AG-24-005', 'Contracts awarded to employees and councillors not disclosed as related parties', 'Compliance', 'High', 45000000.00, 8, 'Under_Review', 1, 3),
(@eid, 6, 'AG-24-006', 'Housing projects not completed within agreed timelines - R620M in incomplete projects', 'Performance', 'High', 620000000.00, 9, 'In_Progress', 1, 3),
(@eid, 6, 'AG-24-007', 'Fleet management - 42 vehicles not accounted for, fuel card irregularities of R8.5M detected', 'Material_Irregularity', 'High', 8500000.00, 3, 'Assigned', 1, 3),
(@eid, 6, 'AG-24-008', 'Indigent register not updated - R156M free basic services provided without proper verification', 'Significant', 'Medium', 156000000.00, 2, 'In_Progress', 1, 4),
(@eid, 6, 'AG-24-009', 'Competitive bidding not followed for 23 procurements exceeding R200,000 threshold', 'Compliance', 'Medium', 18500000.00, 8, 'Overdue', 1, 5),
(@eid, 6, 'AG-24-010', 'Performance agreements not signed by senior managers within prescribed timeframes', 'Compliance', 'Medium', 0.00, 3, 'Evidence_Submitted', 0, 0),
(@eid, 6, 'AG-24-011', 'Disaster management centre not operational - R35M capital investment underutilised', 'Performance', 'Medium', 35000000.00, 10, 'Assigned', 0, 0),
(@eid, 6, 'AG-24-012', 'Electricity losses of 18.5% exceed national benchmark of 10% - R245M revenue loss', 'Significant', 'High', 245000000.00, 6, 'New', 1, 3),
(@eid, 6, 'AG-24-013', 'Salary overpayments to 47 terminated employees not recovered - R3.2M outstanding', 'Other', 'Medium', 3200000.00, 3, 'In_Progress', 0, 0),
(@eid, 6, 'AG-24-014', 'IT general controls - inadequate access controls over financial systems', 'Compliance', 'Medium', 0.00, 2, 'Assigned', 1, 2),
(@eid, 6, 'AG-24-015', 'Deviation from SCM policy for legal services - R28M spent without competitive bidding', 'Compliance', 'High', 28000000.00, 1, 'New', 1, 2);

-- IFWE Items (BCMM has one of the highest irregular expenditure balances in EC)
INSERT INTO ifw_item (entity_id, reference_number, ifwe_type, amount, financial_year, description, status, responsible_official_id) VALUES
(@eid, 'IFWE-2019-001', 'Irregular', 520000000.00, '2018/19', 'Infrastructure contracts awarded without competitive bidding - water and sanitation projects', 'Under_Investigation', 4),
(@eid, 'IFWE-2019-002', 'Irregular', 380000000.00, '2018/19', 'Extension of professional services contracts beyond original scope and value', 'Condonation_Applied', 4),
(@eid, 'IFWE-2020-001', 'Irregular', 290000000.00, '2019/20', 'Fleet management and vehicle procurement irregularities', 'Under_Investigation', 4),
(@eid, 'IFWE-2020-002', 'Fruitless_Wasteful', 45000000.00, '2019/20', 'Interest and penalties on late payments to Eskom and Water Board', 'Recovery_In_Progress', 5),
(@eid, 'IFWE-2021-001', 'Irregular', 210000000.00, '2020/21', 'COVID-19 emergency procurement not meeting emergency criteria under Regulation 36', 'Identified', 4),
(@eid, 'IFWE-2021-002', 'Fruitless_Wasteful', 18000000.00, '2020/21', 'Idle plant and equipment - capital projects abandoned before completion', 'Identified', 5),
(@eid, 'IFWE-2022-001', 'Irregular', 185000000.00, '2021/22', 'Deviation approvals for IT and consulting contracts without proper justification', 'Identified', 4),
(@eid, 'IFWE-2022-002', 'Irregular', 95000000.00, '2021/22', 'Human settlements contracts - variations exceeding 20% of original contract value', 'Under_Investigation', 4),
(@eid, 'IFWE-2023-001', 'Irregular', 420000000.00, '2022/23', 'Multiple SCM non-compliance instances across all directorates', 'Identified', 4),
(@eid, 'IFWE-2023-002', 'Fruitless_Wasteful', 12000000.00, '2022/23', 'SARS penalties and interest on late VAT and PAYE submissions', 'Recovery_In_Progress', 5);

-- Budget Data (BCMM is a metro with ~R14B budget)
INSERT INTO bvm_budget (entity_id, financial_year, vote_code, vote_description, directorate_id, original_budget, adjusted_budget, budget_type) VALUES
(@eid, '2024/25', 'VOTE-01', 'Office of the City Manager', 1, 280000000.00, 295000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-02', 'Chief Financial Officer', 2, 1850000000.00, 1920000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-03', 'Corporate Services', 3, 620000000.00, 645000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-04', 'Public Health', 4, 380000000.00, 395000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-05', 'Development Planning', 5, 125000000.00, 130000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-06', 'Engineering and Infrastructure', 6, 4200000000.00, 4350000000.00, 'Capital'),
(@eid, '2024/25', 'VOTE-07', 'Internal Audit', 7, 35000000.00, 36000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-08', 'Supply Chain Management', 8, 48000000.00, 50000000.00, 'Operating'),
(@eid, '2024/25', 'VOTE-09', 'Human Settlements', 9, 1800000000.00, 1850000000.00, 'Capital'),
(@eid, '2024/25', 'VOTE-10', 'Public Safety', 10, 420000000.00, 440000000.00, 'Operating');

-- Expenditure (Q1 data - July to September 2024)
INSERT INTO bvm_expenditure (budget_id, period, actual_spend, commitment, projected_yearend, ytd_variance_pct) VALUES
(1, '2024-07-31', 22000000.00, 5000000.00, 290000000.00, -1.69),
(1, '2024-08-31', 48000000.00, 8000000.00, 298000000.00, 1.02),
(1, '2024-09-30', 75000000.00, 6000000.00, 300000000.00, 1.69),
(2, '2024-07-31', 145000000.00, 35000000.00, 1880000000.00, -2.08),
(2, '2024-08-31', 310000000.00, 42000000.00, 1950000000.00, 1.56),
(2, '2024-09-30', 485000000.00, 38000000.00, 1960000000.00, 2.08),
(3, '2024-07-31', 48000000.00, 12000000.00, 630000000.00, -2.33),
(3, '2024-08-31', 102000000.00, 15000000.00, 650000000.00, 0.78),
(4, '2024-07-31', 28000000.00, 8000000.00, 388000000.00, -1.77),
(4, '2024-08-31', 62000000.00, 10000000.00, 400000000.00, 1.27),
(6, '2024-07-31', 320000000.00, 580000000.00, 4200000000.00, -3.45),
(6, '2024-08-31', 680000000.00, 620000000.00, 4400000000.00, 1.15),
(9, '2024-07-31', 125000000.00, 280000000.00, 1780000000.00, -3.78),
(9, '2024-08-31', 275000000.00, 310000000.00, 1870000000.00, 1.08);

-- SCM Compliance Rules
INSERT INTO scc_compliance_rule (entity_id, rule_name, rule_description, category, threshold_min, threshold_max) VALUES
(@eid, 'Petty Cash Limit', 'Transactions under R2,000 may use petty cash', 'Value_Threshold', 0.00, 2000.00),
(@eid, 'Written Quotation Range', 'Transactions R2,000 to R30,000 require minimum 3 written quotations', 'Value_Threshold', 2000.00, 30000.00),
(@eid, 'Formal Written Quotation', 'Transactions R30,000 to R200,000 require formal written quotations', 'Value_Threshold', 30000.00, 200000.00),
(@eid, 'Competitive Bidding', 'Transactions above R200,000 require competitive bidding', 'Value_Threshold', 200000.00, 999999999.00),
(@eid, 'CSD Registration Check', 'Supplier must be registered on Central Supplier Database', 'Supplier_Verification', NULL, NULL),
(@eid, 'Tax Clearance Verification', 'Valid SARS tax clearance certificate required', 'Supplier_Verification', NULL, NULL),
(@eid, 'Budget Availability', 'Sufficient budget must be available in relevant vote', 'Budget_Availability', NULL, NULL),
(@eid, 'Delegation Authority Check', 'Approving official must have sufficient delegated authority', 'Delegation', NULL, NULL),
(@eid, 'BEE Compliance', 'BEE compliance must meet minimum requirements for category', 'BEE_Compliance', NULL, NULL);

-- SCM Requisitions
INSERT INTO scc_requisition (entity_id, request_date, requester_id, description, estimated_value, supplier_name, procurement_method, compliance_score, status) VALUES
(@eid, '2024-09-10', 4, 'Office equipment for new Mdantsane satellite office', 285000.00, 'EC Office Solutions (Pty) Ltd', 'Competitive_Bid', 100, 'Passed'),
(@eid, '2024-09-14', 5, 'Financial system upgrade and licensing', 1250000.00, 'SAP Africa (Pty) Ltd', 'Single_Source', 60, 'Failed'),
(@eid, '2024-09-18', 4, 'Emergency sewer pump station repair - Gonubie', 2100000.00, 'WaterTech Engineering', 'Emergency', 75, 'Deviation_Requested'),
(@eid, '2024-09-22', 5, 'Stationery and printing supplies Q3', 42000.00, 'Waltons East London', 'Written_Quotation', 100, 'Approved'),
(@eid, '2024-09-25', 4, 'Legal services panel appointment', 5800000.00, 'Various Legal Firms', 'Competitive_Bid', 40, 'Failed'),
(@eid, '2024-09-28', 4, 'Road rehabilitation materials - Amalinda Main Road', 3500000.00, 'Roadmac Surfacing', 'Competitive_Bid', 95, 'Passed');

-- Consequence Management Cases
INSERT INTO cmt_misconduct_case (entity_id, case_reference, misconduct_type, accused_official_id, financial_impact, referral_source, stage, registered_by, registered_date, ifw_item_id) VALUES
(@eid, 'CMT-2024-001', 'Irregular_Expenditure', 4, 520000000.00, 'AGSA', 'Investigation', 6, '2024-02-15', 1),
(@eid, 'CMT-2024-002', 'Irregular_Expenditure', 4, 290000000.00, 'AGSA', 'Registered', 6, '2024-05-10', 3),
(@eid, 'CMT-2024-003', 'Fruitless_Wasteful', 5, 45000000.00, 'Internal_Audit', 'Recovery', 6, '2024-01-08', 4),
(@eid, 'CMT-2024-004', 'Irregular_Expenditure', 4, 95000000.00, 'MPAC', 'Investigation', 6, '2024-07-20', 8);

-- Delegations
INSERT INTO dar_delegation (entity_id, delegator_id, delegate_id, power_description, financial_limit, effective_date, expiry_date, legislative_reference, status) VALUES
(@eid, 3, 2, 'Approve operational expenditure within CFO directorate', 2000000.00, '2024-07-01', '2025-06-30', 'MFMA Section 79', 'Active'),
(@eid, 3, 4, 'Approve SCM procurement up to competitive bidding threshold', 200000.00, '2024-07-01', '2025-06-30', 'MFMA Section 79; SCM Regulation 36', 'Active'),
(@eid, 3, 5, 'Approve financial system journal entries and budget transfers', 500000.00, '2024-07-01', '2025-06-30', 'MFMA Section 79', 'Active'),
(@eid, 3, 7, 'Approve engineering infrastructure expenditure within approved budget', 5000000.00, '2024-07-01', '2025-06-30', 'MFMA Section 79', 'Active');

-- Policies
INSERT INTO pcr_policy (entity_id, policy_name, category, current_version, effective_date, review_date, owner_id, status) VALUES
(@eid, 'Supply Chain Management Policy', 'SCM', '4.0', '2023-07-01', '2024-06-30', 4, 'Under_Review'),
(@eid, 'Budget and Expenditure Management Policy', 'Financial', '3.0', '2023-07-01', '2025-06-30', 2, 'Active'),
(@eid, 'Asset Management Policy', 'Financial', '2.1', '2022-07-01', '2023-06-30', 2, 'Expired'),
(@eid, 'Information Technology Governance Policy', 'IT', '2.0', '2024-01-01', '2025-12-31', 7, 'Active'),
(@eid, 'Risk Management Policy', 'Risk', '3.0', '2023-07-01', '2025-06-30', 3, 'Active'),
(@eid, 'Human Resources Management Policy', 'HR', '5.0', '2024-07-01', '2026-06-30', 7, 'Active'),
(@eid, 'Credit Control and Debt Collection Policy', 'Financial', '3.2', '2023-07-01', '2025-06-30', 2, 'Active'),
(@eid, 'Indigent Support Policy', 'Governance', '2.5', '2023-07-01', '2025-06-30', 2, 'Active');
