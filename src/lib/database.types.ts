export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Object map compatible with Supabase Json / TanStack Start serialization. */
export type JsonObject = { [key: string]: Json | undefined };

export type UserRole =
  | "super_admin"
  | "tenant_admin"
  | "coordinator"
  | "professional"
  | "financial";

export type UnitType = "hospital" | "clinic" | "upa" | "operational";

export type ScheduleStatus = "draft" | "active" | "archived";

export type ShiftStatus = "open" | "assigned" | "completed" | "cancelled";

export type AssignmentStatus = "pending" | "confirmed" | "rejected";

export type SwapRequestStatus = "pending" | "approved" | "denied" | "cancelled";

export type OperationalEventSeverity = "info" | "warning" | "critical";

export type OperationalAgentGovernanceSessionState =
  | "idle"
  | "reasoning"
  | "awaiting_human_review"
  | "approved"
  | "blocked";

export type OperationalAgentType =
  | "coverage_agent"
  | "coordination_agent"
  | "risk_agent"
  | "recommendation_agent";

export type OperationalEntityType =
  | "shift"
  | "assignment"
  | "swap"
  | "availability"
  | "schedule"
  | "alert"
  | "coordinator_action"
  | "orchestration"
  | "operational_agent"
  | "agent_coordination"
  | "operational_memory"
  | "policy_intelligence"
  | "strategic_operational_planning"
  | "tiss_guide"
  | "tiss_batch"
  | "tiss_batch_export"
  | "tiss_return"
  | "tiss_denial"
  | "tiss_denial_appeal"
  | "medical_production"
  | "medical_payout"
  | "payout_rule"
  | "financial_closing"
  | "operational_reconciliation";

export type OperationalEventType =
  | "shift_created"
  | "shift_updated"
  | "shift_cancelled"
  | "assignment_created"
  | "assignment_confirmed"
  | "assignment_rejected"
  | "swap_requested"
  | "swap_approved"
  | "swap_denied"
  | "availability_updated"
  | "critical_alert_generated"
  | "operational_action_triggered"
  | "orchestration_created"
  | "orchestration_submitted_for_approval"
  | "orchestration_approved"
  | "orchestration_step_advanced"
  | "orchestration_blocked"
  | "orchestration_completed"
  | "orchestration_rollback_previewed"
  | "orchestration_rollback_step"
  | "orchestration_rolled_back"
  | "operational_agent_reasoning_cycle"
  | "operational_agent_human_approved"
  | "operational_agent_human_blocked"
  | "operational_agent_unblocked"
  | "operational_agent_coordination_cycle"
  | "operational_memory_recorded"
  | "operational_memory_state_updated"
  | "operational_learning_signal_captured"
  | "policy_intelligence_analysis_recorded"
  | "policy_intelligence_cycle_state_updated"
  | "policy_governance_recommendation_recorded"
  | "policy_governance_recommendation_state_updated"
  | "strategic_planning_cycle_recorded"
  | "strategic_planning_cycle_state_updated"
  | "strategic_planning_audit_appended"
  | "tiss_guide_created"
  | "tiss_guide_updated"
  | "tiss_batch_closed"
  | "tiss_batch_exported"
  | "tiss_return_received"
  | "tiss_return_processed"
  | "tiss_denial_created"
  | "tiss_denial_updated"
  | "tiss_denial_reversed"
  | "tiss_denial_appeal_created"
  | "tiss_denial_appeal_updated"
  | "medical_production_synced"
  | "medical_payout_calculated"
  | "medical_payout_reviewed"
  | "medical_payout_approved"
  | "medical_payout_paid"
  | "medical_payout_status_changed"
  | "payout_rule_created"
  | "payout_rule_updated"
  | "financial_closing_created"
  | "financial_closing_consolidated"
  | "financial_closing_status_changed"
  | "financial_closing_locked"
  | "financial_closing_unlocked"
  | "financial_closing_snapshot_created"
  | "financial_closing_finalized"
  | "financial_closing_reopened"
  | "operational_reconciliation_created"
  | "operational_reconciliation_status_changed"
  | "operational_reconciliation_matching_run"
  | "operational_reconciliation_divergence_detected";

export type OperationalRecommendationFeedbackType =
  | "accepted"
  | "dismissed"
  | "ignored"
  | "executed"
  | "execution_failed";

export type OperationalActionProposalState =
  | "draft"
  | "suggested"
  | "awaiting_confirmation"
  | "approved"
  | "rejected"
  | "expired";

export type OperationalActionKind =
  | "staffing_adjustment"
  | "escalation"
  | "mitigation"
  | "coordination"
  | "operational_review"
  | "assignment_suggestion";

export type OperationalActionProposalAuditEvent =
  | "created"
  | "submitted_for_confirmation"
  | "approved"
  | "rejected"
  | "expired"
  | "updated_metadata";

export type OperationalSimulationState = "simulated" | "safe" | "risky" | "blocked";

export type OperationalMutationExecutionState =
  | "queued"
  | "executing"
  | "executed"
  | "rolled_back"
  | "failed"
  | "blocked";

export type OperationalOrchestrationState =
  | "planned"
  | "awaiting_approval"
  | "orchestrating"
  | "partially_executed"
  | "completed"
  | "rolled_back"
  | "blocked";

export type OperationalOrchestrationStepKind =
  | "proposal_gate"
  | "sandbox_simulation"
  | "supervised_execution";

export type OperationalOrchestrationStepState =
  | "pending"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "rolled_back";

export type OperationalMemoryKind =
  | "recommendation_outcome"
  | "mitigation_effectiveness"
  | "execution_outcome"
  | "rollback_signal"
  | "deterioration_pattern"
  | "coordination_effectiveness"
  | "orchestration_effectiveness"
  | "proposal_outcome"
  | "forecast_accuracy_snapshot";

export type OperationalMemoryState = "observed" | "tracked" | "validated" | "archived";

export type OperationalMemorySubjectKind =
  | "recommendation"
  | "proposal"
  | "mutation_execution"
  | "orchestration"
  | "coordination_cycle"
  | "forecast_window"
  | "operational_bundle";

export type SupervisedPolicyLifecycleState =
  | "observed"
  | "analyzed"
  | "recommended"
  | "supervised_review"
  | "validated";

export type OperationalStrategicPlanningLifecycleState =
  | "projected"
  | "analyzed"
  | "planned"
  | "supervised_review"
  | "validated";

export type TissGuideType = "consulta" | "sadt" | "honorario_individual";

export type TissGuideStatus = "draft" | "pending_review" | "approved" | "billed" | "denied";

export type TissBatchStatus = "open" | "closed" | "exported" | "processed";

export type TissReturnStatus = "received" | "processing" | "processed" | "failed";

export type TissDenialType = "partial" | "total" | "administrative" | "technical";

export type TissDenialStatus = "identified" | "under_review" | "appealed" | "reversed" | "accepted";

export type TissAppealStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type MedicalPayoutStatus = "draft" | "calculated" | "reviewed" | "approved" | "paid";

export type PayoutRuleType =
  | "percentage"
  | "fixed"
  | "operational_discount"
  | "retention_percentage"
  | "retention_fixed";

export type FinancialClosingStatus =
  | "draft"
  | "under_review"
  | "validated"
  | "locked"
  | "finalized";

export type FinancialClosingSnapshotType =
  | "consolidation_summary"
  | "payout_crosscheck"
  | "pre_reconciliation_marker"
  | "lock_checkpoint";

export type OperationalReconciliationStatus =
  | "draft"
  | "processing"
  | "reconciled"
  | "divergent"
  | "finalized";

export type OperationalReconciliationItemStatus =
  | "matched"
  | "partially_matched"
  | "divergent"
  | "pending";

export type OperationalReconciliationItemReferenceType =
  | "competence_aggregate"
  | "tiss_batch"
  | "tiss_guide"
  | "insurance_provider"
  | "medical_payout"
  | "manual_entry"
  | "csv_import_row";

export type OperationalReconciliationIssueSeverity = "info" | "warning" | "critical";

export type OperationalReconciliationAuditAction =
  | "reconciliation_created"
  | "reconciliation_status_changed"
  | "matching_run"
  | "divergence_detected"
  | "issue_resolved"
  | "manual_adjustment"
  | "import_applied"
  | "item_updated";

export type OperationalPolicyGovernanceRecommendationKind =
  | "threshold_tuning"
  | "orchestration_policy"
  | "escalation_tuning"
  | "adaptive_boundary"
  | "coordination_governance";

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tenant_settings: {
        Row: {
          tenant_id: string;
          institution_name: string;
          primary_color: string;
          secondary_color: string;
          logo_url: string | null;
          favicon_url: string | null;
          banner_url: string | null;
          contact_email: string;
          support_phone: string;
          operational_timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          institution_name?: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          banner_url?: string | null;
          contact_email?: string;
          support_phone?: string;
          operational_timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          institution_name?: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          banner_url?: string | null;
          contact_email?: string;
          support_phone?: string;
          operational_timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      capture_documents: {
        Row: {
          id: string;
          tenant_id: string;
          session_id: string;
          original_filename: string;
          mime_type: string;
          byte_length: number;
          checksum_sha256: string;
          storage_path_original: string;
          storage_path_processed: string | null;
          storage_path_thumbnail: string | null;
          storage_path_audit: string | null;
          page_count: number;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          session_id: string;
          original_filename: string;
          mime_type: string;
          byte_length: number;
          checksum_sha256: string;
          storage_path_original: string;
          storage_path_processed?: string | null;
          storage_path_thumbnail?: string | null;
          storage_path_audit?: string | null;
          page_count?: number;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          session_id?: string;
          original_filename?: string;
          mime_type?: string;
          byte_length?: number;
          checksum_sha256?: string;
          storage_path_original?: string;
          storage_path_processed?: string | null;
          storage_path_thumbnail?: string | null;
          storage_path_audit?: string | null;
          page_count?: number;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "capture_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "capture_documents_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "capture_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      capture_pages: {
        Row: {
          id: string;
          tenant_id: string;
          session_id: string;
          document_id: string;
          page_number: number;
          storage_path_original: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          session_id: string;
          document_id: string;
          page_number: number;
          storage_path_original?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          session_id?: string;
          document_id?: string;
          page_number?: number;
          storage_path_original?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capture_pages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "capture_pages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "capture_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "capture_pages_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "capture_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      capture_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          status: string;
          channel: string;
          correlation_id: string | null;
          target_entity_type: string | null;
          target_entity_id: string | null;
          metadata: Json;
          status_history: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          status?: string;
          channel: string;
          correlation_id?: string | null;
          target_entity_type?: string | null;
          target_entity_id?: string | null;
          metadata?: Json;
          status_history?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          status?: string;
          channel?: string;
          correlation_id?: string | null;
          target_entity_type?: string | null;
          target_entity_id?: string | null;
          metadata?: Json;
          status_history?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "capture_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_errors: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          severity: "operational" | "critical";
          source:
            | "export"
            | "reconciliation"
            | "closing"
            | "session"
            | "upload"
            | "client"
            | "server"
            | "supabase"
            | "unknown";
          error_code: string | null;
          message: string;
          detail: string | null;
          stack_snippet: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          severity: "operational" | "critical";
          source:
            | "export"
            | "reconciliation"
            | "closing"
            | "session"
            | "upload"
            | "client"
            | "server"
            | "supabase"
            | "unknown";
          error_code?: string | null;
          message: string;
          detail?: string | null;
          stack_snippet?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          severity?: "operational" | "critical";
          source?:
            | "export"
            | "reconciliation"
            | "closing"
            | "session"
            | "upload"
            | "client"
            | "server"
            | "supabase"
            | "unknown";
          error_code?: string | null;
          message?: string;
          detail?: string | null;
          stack_snippet?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_errors_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_errors_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_health_metrics: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          metric_name: string;
          metric_value: number | null;
          details: Json;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          metric_name: string;
          metric_value?: number | null;
          details?: Json;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          metric_name?: string;
          metric_value?: number | null;
          details?: Json;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_health_metrics_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_health_metrics_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_logs: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          level: "info" | "warning" | "error";
          category: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          level: "info" | "warning" | "error";
          category: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          level?: "info" | "warning" | "error";
          category?: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_logs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      security_audit_logs: {
        Row: {
          id: string;
          event_category: "auth" | "login_attempt" | "session" | "ssr" | "tenant_access";
          event_type: string;
          outcome: "success" | "failure" | "blocked" | "error";
          tenant_id: string | null;
          profile_id: string | null;
          email_hash: string | null;
          ip_hash: string | null;
          message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_category: "auth" | "login_attempt" | "session" | "ssr" | "tenant_access";
          event_type: string;
          outcome: "success" | "failure" | "blocked" | "error";
          tenant_id?: string | null;
          profile_id?: string | null;
          email_hash?: string | null;
          ip_hash?: string | null;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_category?: "auth" | "login_attempt" | "session" | "ssr" | "tenant_access";
          event_type?: string;
          outcome?: "success" | "failure" | "blocked" | "error";
          tenant_id?: string | null;
          profile_id?: string | null;
          email_hash?: string | null;
          ip_hash?: string | null;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_audit_logs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      hospitals: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospitals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      professionals: {
        Row: {
          id: string;
          tenant_id: string;
          profile_id: string;
          specialty: string;
          crm: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          profile_id: string;
          specialty?: string;
          crm?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          profile_id?: string;
          specialty?: string;
          crm?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "professionals_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      units: {
        Row: {
          id: string;
          tenant_id: string;
          hospital_id: string;
          name: string;
          type: UnitType;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          hospital_id: string;
          name: string;
          type?: UnitType;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          hospital_id?: string;
          name?: string;
          type?: UnitType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "units_tenant_hospital_fk";
            columns: ["tenant_id", "hospital_id"];
            isOneToOne: false;
            referencedRelation: "hospitals";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      departments: {
        Row: {
          id: string;
          tenant_id: string;
          unit_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          unit_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          unit_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "departments_tenant_unit_fk";
            columns: ["tenant_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      financial_closing_audit: {
        Row: {
          id: string;
          tenant_id: string;
          closing_id: string;
          action: string;
          actor_profile_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          closing_id: string;
          action: string;
          actor_profile_id: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          closing_id?: string;
          action?: string;
          actor_profile_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_closing_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_closing_audit_closing_id_fkey";
            columns: ["closing_id"];
            isOneToOne: false;
            referencedRelation: "financial_closings";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_closing_snapshots: {
        Row: {
          id: string;
          closing_id: string;
          snapshot_type: FinancialClosingSnapshotType;
          payload_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          closing_id: string;
          snapshot_type: FinancialClosingSnapshotType;
          payload_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          closing_id?: string;
          snapshot_type?: FinancialClosingSnapshotType;
          payload_json?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_closing_snapshots_closing_id_fkey";
            columns: ["closing_id"];
            isOneToOne: false;
            referencedRelation: "financial_closings";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_closings: {
        Row: {
          id: string;
          tenant_id: string;
          competence_month: string;
          total_guides: number;
          total_billed: number;
          total_denied: number;
          total_approved: number;
          total_payouts: number;
          operational_difference: number;
          status: FinancialClosingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          competence_month: string;
          total_guides?: number;
          total_billed?: number;
          total_denied?: number;
          total_approved?: number;
          total_payouts?: number;
          operational_difference?: number;
          status?: FinancialClosingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          competence_month?: string;
          total_guides?: number;
          total_billed?: number;
          total_denied?: number;
          total_approved?: number;
          total_payouts?: number;
          operational_difference?: number;
          status?: FinancialClosingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_closings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_reconciliation_audit: {
        Row: {
          id: string;
          tenant_id: string;
          reconciliation_id: string;
          action: OperationalReconciliationAuditAction;
          actor_profile_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          reconciliation_id: string;
          action: OperationalReconciliationAuditAction;
          actor_profile_id: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          reconciliation_id?: string;
          action?: OperationalReconciliationAuditAction;
          actor_profile_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_reconciliation_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_reconciliation_audit_reconciliation_fk";
            columns: ["reconciliation_id"];
            isOneToOne: false;
            referencedRelation: "operational_reconciliations";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_reconciliation_issues: {
        Row: {
          id: string;
          tenant_id: string;
          reconciliation_id: string;
          issue_type: string;
          description: string;
          severity: OperationalReconciliationIssueSeverity;
          resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          reconciliation_id: string;
          issue_type: string;
          description?: string;
          severity?: OperationalReconciliationIssueSeverity;
          resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          reconciliation_id?: string;
          issue_type?: string;
          description?: string;
          severity?: OperationalReconciliationIssueSeverity;
          resolved?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_reconciliation_issues_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_reconciliation_issues_reconciliation_fk";
            columns: ["reconciliation_id"];
            isOneToOne: false;
            referencedRelation: "operational_reconciliations";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_reconciliation_items: {
        Row: {
          id: string;
          tenant_id: string;
          reconciliation_id: string;
          reference_type: OperationalReconciliationItemReferenceType;
          reference_id: string | null;
          expected_value: number;
          received_value: number;
          difference_value: number;
          status: OperationalReconciliationItemStatus;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          reconciliation_id: string;
          reference_type: OperationalReconciliationItemReferenceType;
          reference_id?: string | null;
          expected_value?: number;
          received_value?: number;
          difference_value?: number;
          status?: OperationalReconciliationItemStatus;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          reconciliation_id?: string;
          reference_type?: OperationalReconciliationItemReferenceType;
          reference_id?: string | null;
          expected_value?: number;
          received_value?: number;
          difference_value?: number;
          status?: OperationalReconciliationItemStatus;
        };
        Relationships: [
          {
            foreignKeyName: "operational_reconciliation_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_reconciliation_items_reconciliation_fk";
            columns: ["reconciliation_id"];
            isOneToOne: false;
            referencedRelation: "operational_reconciliations";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_reconciliations: {
        Row: {
          id: string;
          tenant_id: string;
          competence_month: string;
          expected_value: number;
          received_value: number;
          difference_value: number;
          status: OperationalReconciliationStatus;
          financial_closing_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          competence_month: string;
          expected_value?: number;
          received_value?: number;
          difference_value?: number;
          status?: OperationalReconciliationStatus;
          financial_closing_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          competence_month?: string;
          expected_value?: number;
          received_value?: number;
          difference_value?: number;
          status?: OperationalReconciliationStatus;
          financial_closing_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_reconciliations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: {
          id: string;
          tenant_id: string;
          department_id: string;
          name: string;
          start_date: string;
          end_date: string;
          status: ScheduleStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          department_id: string;
          name: string;
          start_date: string;
          end_date: string;
          status?: ScheduleStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          department_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          status?: ScheduleStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedules_tenant_department_fk";
            columns: ["tenant_id", "department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      shifts: {
        Row: {
          id: string;
          tenant_id: string;
          schedule_id: string;
          department_id: string;
          starts_at: string;
          ends_at: string;
          role_required: string;
          status: ShiftStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          schedule_id: string;
          department_id: string;
          starts_at: string;
          ends_at: string;
          role_required?: string;
          status?: ShiftStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          schedule_id?: string;
          department_id?: string;
          starts_at?: string;
          ends_at?: string;
          role_required?: string;
          status?: ShiftStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_tenant_schedule_fk";
            columns: ["tenant_id", "schedule_id"];
            isOneToOne: false;
            referencedRelation: "schedules";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "shifts_tenant_department_fk";
            columns: ["tenant_id", "department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      shift_assignments: {
        Row: {
          id: string;
          tenant_id: string;
          shift_id: string;
          professional_id: string;
          assignment_status: AssignmentStatus;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          shift_id: string;
          professional_id: string;
          assignment_status?: AssignmentStatus;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          shift_id?: string;
          professional_id?: string;
          assignment_status?: AssignmentStatus;
          assigned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_assignments_tenant_shift_fk";
            columns: ["tenant_id", "shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "shift_assignments_tenant_professional_fk";
            columns: ["tenant_id", "professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      shift_swap_requests: {
        Row: {
          id: string;
          tenant_id: string;
          shift_id: string;
          requester_professional_id: string;
          target_professional_id: string;
          status: SwapRequestStatus;
          requested_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          shift_id: string;
          requester_professional_id: string;
          target_professional_id: string;
          status?: SwapRequestStatus;
          requested_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          shift_id?: string;
          requester_professional_id?: string;
          target_professional_id?: string;
          status?: SwapRequestStatus;
          requested_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_swap_requests_tenant_shift_fk";
            columns: ["tenant_id", "shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "shift_swap_requests_tenant_requester_fk";
            columns: ["tenant_id", "requester_professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "shift_swap_requests_tenant_target_fk";
            columns: ["tenant_id", "target_professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      availability: {
        Row: {
          id: string;
          tenant_id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          available: boolean;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          available?: boolean;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          professional_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          available?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "availability_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "availability_tenant_professional_fk";
            columns: ["tenant_id", "professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      operational_events: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          entity_type: OperationalEntityType;
          entity_id: string;
          event_type: OperationalEventType;
          severity: OperationalEventSeverity;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          entity_type: OperationalEntityType;
          entity_id: string;
          event_type: OperationalEventType;
          severity?: OperationalEventSeverity;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          entity_type?: OperationalEntityType;
          entity_id?: string;
          event_type?: OperationalEventType;
          severity?: OperationalEventSeverity;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_events_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_agent_governance_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          agent_type: OperationalAgentType;
          state: OperationalAgentGovernanceSessionState;
          correlation_id: string;
          surface_fingerprint: string;
          rationale_summary: string;
          reasoning_headlines_json: Json;
          explainability_refs_json: Json;
          updated_by_profile_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          agent_type: OperationalAgentType;
          state?: OperationalAgentGovernanceSessionState;
          correlation_id?: string;
          surface_fingerprint?: string;
          rationale_summary?: string;
          reasoning_headlines_json?: Json;
          explainability_refs_json?: Json;
          updated_by_profile_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          agent_type?: OperationalAgentType;
          state?: OperationalAgentGovernanceSessionState;
          correlation_id?: string;
          surface_fingerprint?: string;
          rationale_summary?: string;
          reasoning_headlines_json?: Json;
          explainability_refs_json?: Json;
          updated_by_profile_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_agent_governance_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_agent_governance_sessions_updated_by_profile_id_fkey";
            columns: ["updated_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_agent_coordination_cycles: {
        Row: {
          id: string;
          tenant_id: string;
          correlation_id: string;
          surface_fingerprint: string;
          semantic_fingerprint: string;
          shared_context_json: Json;
          participants_json: Json;
          collaboration_narrative: string;
          conflicts_json: Json;
          provenance_refs_json: Json;
          orchestration_summary_json: Json;
          created_by_profile_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          correlation_id?: string;
          surface_fingerprint?: string;
          semantic_fingerprint?: string;
          shared_context_json?: Json;
          participants_json?: Json;
          collaboration_narrative?: string;
          conflicts_json?: Json;
          provenance_refs_json?: Json;
          orchestration_summary_json?: Json;
          created_by_profile_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          correlation_id?: string;
          surface_fingerprint?: string;
          semantic_fingerprint?: string;
          shared_context_json?: Json;
          participants_json?: Json;
          collaboration_narrative?: string;
          conflicts_json?: Json;
          provenance_refs_json?: Json;
          orchestration_summary_json?: Json;
          created_by_profile_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_agent_coordination_cycles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_agent_coordination_cycles_created_by_profile_id_fkey";
            columns: ["created_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_memory_entries: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          memory_kind: OperationalMemoryKind;
          memory_state: OperationalMemoryState;
          subject_kind: OperationalMemorySubjectKind;
          subject_id: string;
          correlation_id: string | null;
          effectiveness_score: string | null;
          learning_signals_json: Json;
          explainability_json: Json;
          references_json: Json;
          outcome_narrative: string;
          metadata: Json;
          observed_at: string;
          validated_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          memory_kind: OperationalMemoryKind;
          memory_state?: OperationalMemoryState;
          subject_kind: OperationalMemorySubjectKind;
          subject_id: string;
          correlation_id?: string | null;
          effectiveness_score?: string | null;
          learning_signals_json?: Json;
          explainability_json?: Json;
          references_json?: Json;
          outcome_narrative?: string;
          metadata?: Json;
          observed_at?: string;
          validated_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          memory_kind?: OperationalMemoryKind;
          memory_state?: OperationalMemoryState;
          subject_kind?: OperationalMemorySubjectKind;
          subject_id?: string;
          correlation_id?: string | null;
          effectiveness_score?: string | null;
          learning_signals_json?: Json;
          explainability_json?: Json;
          references_json?: Json;
          outcome_narrative?: string;
          metadata?: Json;
          observed_at?: string;
          validated_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_memory_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_memory_entries_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_recommendation_feedback: {
        Row: {
          id: string;
          tenant_id: string;
          recommendation_id: string;
          actor_profile_id: string;
          feedback_type: OperationalRecommendationFeedbackType;
          effectiveness_score: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          recommendation_id: string;
          actor_profile_id: string;
          feedback_type: OperationalRecommendationFeedbackType;
          effectiveness_score?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          recommendation_id?: string;
          actor_profile_id?: string;
          feedback_type?: OperationalRecommendationFeedbackType;
          effectiveness_score?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_recommendation_feedback_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_recommendation_feedback_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_action_proposals: {
        Row: {
          id: string;
          tenant_id: string;
          created_by_profile_id: string;
          state: OperationalActionProposalState;
          action_kind: OperationalActionKind;
          title: string;
          summary: string;
          operational_rationale: string;
          references_json: unknown[];
          payload_json: Record<string, unknown>;
          source: string;
          gpt_correlation_id: string | null;
          context_fingerprint: string | null;
          dedupe_key: string | null;
          expires_at: string;
          approved_by_profile_id: string | null;
          rejected_by_profile_id: string | null;
          approval_note: string | null;
          rejection_justification: string | null;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          created_by_profile_id: string;
          state?: OperationalActionProposalState;
          action_kind: OperationalActionKind;
          title: string;
          summary?: string;
          operational_rationale?: string;
          references_json?: unknown[];
          payload_json?: Record<string, unknown>;
          source?: string;
          gpt_correlation_id?: string | null;
          context_fingerprint?: string | null;
          dedupe_key?: string | null;
          expires_at?: string;
          approved_by_profile_id?: string | null;
          rejected_by_profile_id?: string | null;
          approval_note?: string | null;
          rejection_justification?: string | null;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          created_by_profile_id?: string;
          state?: OperationalActionProposalState;
          action_kind?: OperationalActionKind;
          title?: string;
          summary?: string;
          operational_rationale?: string;
          references_json?: unknown[];
          payload_json?: Record<string, unknown>;
          source?: string;
          gpt_correlation_id?: string | null;
          context_fingerprint?: string | null;
          dedupe_key?: string | null;
          expires_at?: string;
          approved_by_profile_id?: string | null;
          rejected_by_profile_id?: string | null;
          approval_note?: string | null;
          rejection_justification?: string | null;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_action_proposals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_action_proposals_created_by_profile_id_fkey";
            columns: ["created_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_action_proposals_approved_by_profile_id_fkey";
            columns: ["approved_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_action_proposals_rejected_by_profile_id_fkey";
            columns: ["rejected_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_action_proposal_audit: {
        Row: {
          id: string;
          tenant_id: string;
          proposal_id: string;
          actor_profile_id: string;
          event: OperationalActionProposalAuditEvent;
          note: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          proposal_id: string;
          actor_profile_id: string;
          event: OperationalActionProposalAuditEvent;
          note?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          proposal_id?: string;
          actor_profile_id?: string;
          event?: OperationalActionProposalAuditEvent;
          note?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_action_proposal_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_action_proposal_audit_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "operational_action_proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_action_proposal_audit_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_execution_sandbox_runs: {
        Row: {
          id: string;
          tenant_id: string;
          proposal_id: string;
          actor_profile_id: string;
          state: OperationalSimulationState;
          block_reason: string | null;
          overall_severity: string;
          affected_entity_count: number;
          mutations_count: number;
          context_fingerprint: string | null;
          schema_version: string;
          result_snapshot: Record<string, unknown>;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          proposal_id: string;
          actor_profile_id: string;
          state: OperationalSimulationState;
          block_reason?: string | null;
          overall_severity?: string;
          affected_entity_count?: number;
          mutations_count?: number;
          context_fingerprint?: string | null;
          schema_version?: string;
          result_snapshot?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          proposal_id?: string;
          actor_profile_id?: string;
          state?: OperationalSimulationState;
          block_reason?: string | null;
          overall_severity?: string;
          affected_entity_count?: number;
          mutations_count?: number;
          context_fingerprint?: string | null;
          schema_version?: string;
          result_snapshot?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_execution_sandbox_runs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_execution_sandbox_runs_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "operational_action_proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_execution_sandbox_runs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_mutation_executions: {
        Row: {
          id: string;
          tenant_id: string;
          proposal_id: string;
          sandbox_run_id: string;
          actor_profile_id: string;
          state: OperationalMutationExecutionState;
          approval_confirmed: boolean;
          idempotency_key: string | null;
          block_reason: string | null;
          policy_checks_snapshot: unknown[];
          explainability_json: Record<string, unknown>;
          applied_steps_json: unknown[];
          result_payload: Record<string, unknown>;
          rollback_payload: Record<string, unknown>;
          affected_entities_json: unknown[];
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          proposal_id: string;
          sandbox_run_id: string;
          actor_profile_id: string;
          state?: OperationalMutationExecutionState;
          approval_confirmed?: boolean;
          idempotency_key?: string | null;
          block_reason?: string | null;
          policy_checks_snapshot?: unknown[];
          explainability_json?: Record<string, unknown>;
          applied_steps_json?: unknown[];
          result_payload?: Record<string, unknown>;
          rollback_payload?: Record<string, unknown>;
          affected_entities_json?: unknown[];
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          proposal_id?: string;
          sandbox_run_id?: string;
          actor_profile_id?: string;
          state?: OperationalMutationExecutionState;
          approval_confirmed?: boolean;
          idempotency_key?: string | null;
          block_reason?: string | null;
          policy_checks_snapshot?: unknown[];
          explainability_json?: Record<string, unknown>;
          applied_steps_json?: unknown[];
          result_payload?: Record<string, unknown>;
          rollback_payload?: Record<string, unknown>;
          affected_entities_json?: unknown[];
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_mutation_executions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_mutation_executions_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "operational_action_proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_mutation_executions_sandbox_run_id_fkey";
            columns: ["sandbox_run_id"];
            isOneToOne: false;
            referencedRelation: "operational_execution_sandbox_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_mutation_executions_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_orchestrations: {
        Row: {
          id: string;
          tenant_id: string;
          created_by_profile_id: string;
          state: OperationalOrchestrationState;
          title: string;
          summary: string;
          narrative_json: unknown[];
          policy_bundle_json: Record<string, unknown>;
          rollback_preview_json: Record<string, unknown>;
          execution_order_json: unknown[];
          approved_by_profile_id: string | null;
          approval_note: string | null;
          approved_at: string | null;
          blocked_reason: string | null;
          schema_version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          created_by_profile_id: string;
          state?: OperationalOrchestrationState;
          title: string;
          summary?: string;
          narrative_json?: unknown[];
          policy_bundle_json?: Record<string, unknown>;
          rollback_preview_json?: Record<string, unknown>;
          execution_order_json?: unknown[];
          approved_by_profile_id?: string | null;
          approval_note?: string | null;
          approved_at?: string | null;
          blocked_reason?: string | null;
          schema_version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          created_by_profile_id?: string;
          state?: OperationalOrchestrationState;
          title?: string;
          summary?: string;
          narrative_json?: unknown[];
          policy_bundle_json?: Record<string, unknown>;
          rollback_preview_json?: Record<string, unknown>;
          execution_order_json?: unknown[];
          approved_by_profile_id?: string | null;
          approval_note?: string | null;
          approved_at?: string | null;
          blocked_reason?: string | null;
          schema_version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_orchestrations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_orchestrations_created_by_profile_id_fkey";
            columns: ["created_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_orchestrations_approved_by_profile_id_fkey";
            columns: ["approved_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_orchestration_steps: {
        Row: {
          id: string;
          orchestration_id: string;
          ordinal: number;
          step_kind: OperationalOrchestrationStepKind;
          depends_on_ordinals: unknown[];
          proposal_id: string | null;
          step_state: OperationalOrchestrationStepState;
          sandbox_run_id: string | null;
          mutation_execution_id: string | null;
          rationale: string;
          explainability_json: Record<string, unknown>;
          policy_refs_json: unknown[];
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          orchestration_id: string;
          ordinal: number;
          step_kind: OperationalOrchestrationStepKind;
          depends_on_ordinals?: unknown[];
          proposal_id?: string | null;
          step_state?: OperationalOrchestrationStepState;
          sandbox_run_id?: string | null;
          mutation_execution_id?: string | null;
          rationale?: string;
          explainability_json?: Record<string, unknown>;
          policy_refs_json?: unknown[];
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          orchestration_id?: string;
          ordinal?: number;
          step_kind?: OperationalOrchestrationStepKind;
          depends_on_ordinals?: unknown[];
          proposal_id?: string | null;
          step_state?: OperationalOrchestrationStepState;
          sandbox_run_id?: string | null;
          mutation_execution_id?: string | null;
          rationale?: string;
          explainability_json?: Record<string, unknown>;
          policy_refs_json?: unknown[];
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_orchestration_steps_orchestration_id_fkey";
            columns: ["orchestration_id"];
            isOneToOne: false;
            referencedRelation: "operational_orchestrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_orchestration_steps_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "operational_action_proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_orchestration_steps_sandbox_run_id_fkey";
            columns: ["sandbox_run_id"];
            isOneToOne: false;
            referencedRelation: "operational_execution_sandbox_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_orchestration_steps_mutation_execution_id_fkey";
            columns: ["mutation_execution_id"];
            isOneToOne: false;
            referencedRelation: "operational_mutation_executions";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_policy_governance_recommendations: {
        Row: {
          id: string;
          tenant_id: string;
          cycle_id: string;
          recommendation_kind: OperationalPolicyGovernanceRecommendationKind;
          title: string;
          detail: string;
          explainability_json: Json;
          suggestion_fingerprint: string;
          lifecycle_state: SupervisedPolicyLifecycleState;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          cycle_id: string;
          recommendation_kind: OperationalPolicyGovernanceRecommendationKind;
          title: string;
          detail?: string;
          explainability_json?: Json;
          suggestion_fingerprint?: string;
          lifecycle_state?: SupervisedPolicyLifecycleState;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          cycle_id?: string;
          recommendation_kind?: OperationalPolicyGovernanceRecommendationKind;
          title?: string;
          detail?: string;
          explainability_json?: Json;
          suggestion_fingerprint?: string;
          lifecycle_state?: SupervisedPolicyLifecycleState;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_policy_governance_recommendations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_policy_governance_recommendations_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "operational_policy_intelligence_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_policy_intelligence_audit: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          cycle_id: string | null;
          recommendation_id: string | null;
          action: string;
          payload_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          cycle_id?: string | null;
          recommendation_id?: string | null;
          action: string;
          payload_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          cycle_id?: string | null;
          recommendation_id?: string | null;
          action?: string;
          payload_json?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_policy_intelligence_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_policy_intelligence_audit_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_policy_intelligence_audit_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "operational_policy_intelligence_cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_policy_intelligence_audit_recommendation_id_fkey";
            columns: ["recommendation_id"];
            isOneToOne: false;
            referencedRelation: "operational_policy_governance_recommendations";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_strategic_planning_audit: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          cycle_id: string | null;
          action: string;
          payload_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          cycle_id?: string | null;
          action: string;
          payload_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          cycle_id?: string | null;
          action?: string;
          payload_json?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_strategic_planning_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_strategic_planning_audit_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_strategic_planning_audit_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "operational_strategic_planning_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_strategic_planning_cycles: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          fingerprint: string;
          stress_digest_json: Json;
          planning_bundle_json: Json;
          strategic_narrative: string;
          lifecycle_state: OperationalStrategicPlanningLifecycleState;
          computed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          fingerprint: string;
          stress_digest_json?: Json;
          planning_bundle_json?: Json;
          strategic_narrative?: string;
          lifecycle_state?: OperationalStrategicPlanningLifecycleState;
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          fingerprint?: string;
          stress_digest_json?: Json;
          planning_bundle_json?: Json;
          strategic_narrative?: string;
          lifecycle_state?: OperationalStrategicPlanningLifecycleState;
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_strategic_planning_cycles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_strategic_planning_cycles_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_policy_intelligence_cycles: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          fingerprint: string;
          signal_digest_json: Json;
          findings_json: Json;
          governance_narrative: string;
          lifecycle_state: SupervisedPolicyLifecycleState;
          computed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          fingerprint: string;
          signal_digest_json?: Json;
          findings_json?: Json;
          governance_narrative?: string;
          lifecycle_state?: SupervisedPolicyLifecycleState;
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          fingerprint?: string;
          signal_digest_json?: Json;
          findings_json?: Json;
          governance_narrative?: string;
          lifecycle_state?: SupervisedPolicyLifecycleState;
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_policy_intelligence_cycles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_policy_intelligence_cycles_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      insurance_providers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          ans_code: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          ans_code?: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          ans_code?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "insurance_providers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      insurance_contracts: {
        Row: {
          id: string;
          tenant_id: string;
          insurance_provider_id: string;
          name: string;
          contract_number: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          insurance_provider_id: string;
          name?: string;
          contract_number: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          insurance_provider_id?: string;
          name?: string;
          contract_number?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "insurance_contracts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "insurance_contracts_tenant_provider_fk";
            columns: ["tenant_id", "insurance_provider_id"];
            isOneToOne: false;
            referencedRelation: "insurance_providers";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      insurance_rules: {
        Row: {
          id: string;
          tenant_id: string;
          insurance_contract_id: string;
          name: string;
          parameters: Json;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          insurance_contract_id: string;
          name: string;
          parameters?: Json;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          insurance_contract_id?: string;
          name?: string;
          parameters?: Json;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "insurance_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "insurance_rules_tenant_contract_fk";
            columns: ["tenant_id", "insurance_contract_id"];
            isOneToOne: false;
            referencedRelation: "insurance_contracts";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tuss_procedures: {
        Row: {
          id: string;
          code: string;
          description: string;
          specialty: string;
          operational_group: string;
          default_value: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description: string;
          specialty?: string;
          operational_group?: string;
          default_value?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string;
          specialty?: string;
          operational_group?: string;
          default_value?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tiss_batches: {
        Row: {
          id: string;
          tenant_id: string;
          batch_number: string;
          competence: string;
          total_guides: number;
          total_value: number;
          status: TissBatchStatus;
          generated_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          batch_number: string;
          competence: string;
          total_guides?: number;
          total_value?: number;
          status?: TissBatchStatus;
          generated_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          batch_number?: string;
          competence?: string;
          total_guides?: number;
          total_value?: number;
          status?: TissBatchStatus;
          generated_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_batches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tiss_guides: {
        Row: {
          id: string;
          tenant_id: string;
          guide_type: TissGuideType;
          patient_name: string;
          insurance_provider_id: string;
          insurance_contract_id: string | null;
          professional_id: string;
          attendance_date: string;
          status: TissGuideStatus;
          batch_id: string | null;
          total_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          guide_type: TissGuideType;
          patient_name: string;
          insurance_provider_id: string;
          insurance_contract_id?: string | null;
          professional_id: string;
          attendance_date: string;
          status?: TissGuideStatus;
          batch_id?: string | null;
          total_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          guide_type?: TissGuideType;
          patient_name?: string;
          insurance_provider_id?: string;
          insurance_contract_id?: string | null;
          professional_id?: string;
          attendance_date?: string;
          status?: TissGuideStatus;
          batch_id?: string | null;
          total_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_guides_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_guides_tenant_provider_fk";
            columns: ["tenant_id", "insurance_provider_id"];
            isOneToOne: false;
            referencedRelation: "insurance_providers";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_guides_tenant_contract_fk";
            columns: ["tenant_id", "insurance_contract_id"];
            isOneToOne: false;
            referencedRelation: "insurance_contracts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_guides_tenant_professional_fk";
            columns: ["tenant_id", "professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_guides_tenant_batch_fk";
            columns: ["tenant_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "tiss_batches";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tiss_guide_items: {
        Row: {
          id: string;
          tenant_id: string;
          guide_id: string;
          procedure_id: string;
          quantity: number;
          unit_value: number;
          total_value: number;
          execution_date: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          guide_id: string;
          procedure_id: string;
          quantity?: number;
          unit_value: number;
          total_value: number;
          execution_date: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          guide_id?: string;
          procedure_id?: string;
          quantity?: number;
          unit_value?: number;
          total_value?: number;
          execution_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_guide_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_guide_items_tenant_guide_fk";
            columns: ["tenant_id", "guide_id"];
            isOneToOne: false;
            referencedRelation: "tiss_guides";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_guide_items_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "tuss_procedures";
            referencedColumns: ["id"];
          },
        ];
      };
      tiss_batch_exports: {
        Row: {
          id: string;
          tenant_id: string;
          batch_id: string;
          exported_by_profile_id: string;
          checksum_sha256: string;
          byte_length: number;
          preview: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          batch_id: string;
          exported_by_profile_id: string;
          checksum_sha256: string;
          byte_length: number;
          preview?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          batch_id?: string;
          exported_by_profile_id?: string;
          checksum_sha256?: string;
          byte_length?: number;
          preview?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_batch_exports_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_batch_exports_tenant_batch_fk";
            columns: ["tenant_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "tiss_batches";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_batch_exports_exported_by_profile_id_fkey";
            columns: ["exported_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tiss_returns: {
        Row: {
          id: string;
          tenant_id: string;
          batch_id: string;
          return_reference: string;
          processed_at: string | null;
          status: TissReturnStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          batch_id: string;
          return_reference: string;
          processed_at?: string | null;
          status?: TissReturnStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          batch_id?: string;
          return_reference?: string;
          processed_at?: string | null;
          status?: TissReturnStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_returns_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_returns_tenant_batch_fk";
            columns: ["tenant_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "tiss_batches";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tiss_denials: {
        Row: {
          id: string;
          tenant_id: string;
          return_id: string;
          guide_id: string;
          denial_type: TissDenialType;
          denial_reason_code: string;
          denial_reason_description: string;
          denied_value: number;
          status: TissDenialStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          return_id: string;
          guide_id: string;
          denial_type: TissDenialType;
          denial_reason_code?: string;
          denial_reason_description?: string;
          denied_value?: number;
          status?: TissDenialStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          return_id?: string;
          guide_id?: string;
          denial_type?: TissDenialType;
          denial_reason_code?: string;
          denial_reason_description?: string;
          denied_value?: number;
          status?: TissDenialStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_denials_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_denials_tenant_return_fk";
            columns: ["tenant_id", "return_id"];
            isOneToOne: false;
            referencedRelation: "tiss_returns";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_denials_tenant_guide_fk";
            columns: ["tenant_id", "guide_id"];
            isOneToOne: false;
            referencedRelation: "tiss_guides";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tiss_denial_appeals: {
        Row: {
          id: string;
          tenant_id: string;
          denial_id: string;
          appeal_reason: string;
          appeal_status: TissAppealStatus;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          denial_id: string;
          appeal_reason?: string;
          appeal_status?: TissAppealStatus;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          denial_id?: string;
          appeal_reason?: string;
          appeal_status?: TissAppealStatus;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_denial_appeals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_denial_appeals_tenant_denial_fk";
            columns: ["tenant_id", "denial_id"];
            isOneToOne: false;
            referencedRelation: "tiss_denials";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_denial_appeals_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tiss_denial_audit: {
        Row: {
          id: string;
          tenant_id: string;
          denial_id: string;
          action: string;
          actor_profile_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          denial_id: string;
          action: string;
          actor_profile_id: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          denial_id?: string;
          action?: string;
          actor_profile_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_denial_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tiss_denial_audit_tenant_denial_fk";
            columns: ["tenant_id", "denial_id"];
            isOneToOne: false;
            referencedRelation: "tiss_denials";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tiss_denial_audit_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tiss_denial_financial_rollups: {
        Row: {
          tenant_id: string;
          bucket: string;
          bucket_id: string;
          competence_month: string;
          denied_exposure: number;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          bucket: string;
          bucket_id: string;
          competence_month: string;
          denied_exposure?: number;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          bucket?: string;
          bucket_id?: string;
          competence_month?: string;
          denied_exposure?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_denial_financial_rollups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tiss_denial_reason_rollups: {
        Row: {
          tenant_id: string;
          competence_month: string;
          denial_reason_code: string;
          denied_exposure: number;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          competence_month: string;
          denial_reason_code: string;
          denied_exposure?: number;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          competence_month?: string;
          denial_reason_code?: string;
          denied_exposure?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tiss_denial_reason_rollups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_production: {
        Row: {
          id: string;
          tenant_id: string;
          professional_id: string;
          guide_id: string;
          batch_id: string | null;
          competence_month: string;
          gross_value: number;
          denied_value: number;
          approved_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          professional_id: string;
          guide_id: string;
          batch_id?: string | null;
          competence_month: string;
          gross_value?: number;
          denied_value?: number;
          approved_value?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          professional_id?: string;
          guide_id?: string;
          batch_id?: string | null;
          competence_month?: string;
          gross_value?: number;
          denied_value?: number;
          approved_value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_production_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_payout_audit: {
        Row: {
          id: string;
          tenant_id: string;
          payout_id: string;
          action: string;
          actor_profile_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          payout_id: string;
          action: string;
          actor_profile_id: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          payout_id?: string;
          action?: string;
          actor_profile_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_payout_audit_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_payout_items: {
        Row: {
          id: string;
          payout_id: string;
          production_id: string;
          guide_id: string;
          approved_value: number;
          denied_value: number;
          calculated_value: number;
        };
        Insert: {
          id?: string;
          payout_id: string;
          production_id: string;
          guide_id: string;
          approved_value?: number;
          denied_value?: number;
          calculated_value?: number;
        };
        Update: {
          id?: string;
          payout_id?: string;
          production_id?: string;
          guide_id?: string;
          approved_value?: number;
          denied_value?: number;
          calculated_value?: number;
        };
        Relationships: [];
      };
      medical_payouts: {
        Row: {
          id: string;
          tenant_id: string;
          professional_id: string;
          competence_month: string;
          gross_value: number;
          denied_value: number;
          net_value: number;
          retention_value: number;
          final_value: number;
          status: MedicalPayoutStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          professional_id: string;
          competence_month: string;
          gross_value?: number;
          denied_value?: number;
          net_value?: number;
          retention_value?: number;
          final_value?: number;
          status?: MedicalPayoutStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          professional_id?: string;
          competence_month?: string;
          gross_value?: number;
          denied_value?: number;
          net_value?: number;
          retention_value?: number;
          final_value?: number;
          status?: MedicalPayoutStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_payouts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      pilot_adoption_events: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          event_type:
            | "login"
            | "onboarding_complete"
            | "dashboard_view"
            | "financial_workflow"
            | "module_access"
            | "feature_use";
          module: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          event_type:
            | "login"
            | "onboarding_complete"
            | "dashboard_view"
            | "financial_workflow"
            | "module_access"
            | "feature_use";
          module: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          event_type?:
            | "login"
            | "onboarding_complete"
            | "dashboard_view"
            | "financial_workflow"
            | "module_access"
            | "feature_use";
          module?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pilot_adoption_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pilot_adoption_events_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pilot_feedback: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          category: string;
          severity: "low" | "medium" | "high";
          description: string;
          context_route: string | null;
          context_module: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          category: string;
          severity: "low" | "medium" | "high";
          description: string;
          context_route?: string | null;
          context_module?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          category?: string;
          severity?: "low" | "medium" | "high";
          description?: string;
          context_route?: string | null;
          context_module?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pilot_feedback_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pilot_feedback_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pilot_feature_flags: {
        Row: {
          id: string;
          tenant_id: string;
          flag_key: string;
          enabled: boolean;
          description: string | null;
          updated_by_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          flag_key: string;
          enabled?: boolean;
          description?: string | null;
          updated_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          flag_key?: string;
          enabled?: boolean;
          description?: string | null;
          updated_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pilot_feature_flags_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      pilot_incidents: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          category: string;
          severity: "low" | "medium" | "high" | "critical";
          description: string;
          incident_status: "open" | "investigating" | "resolved" | "closed";
          operational_source: string;
          resolution_notes: string | null;
          follow_up_status: "pending" | "scheduled" | "done" | "not_required";
          context_route: string | null;
          context_module: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          category: string;
          severity: "low" | "medium" | "high" | "critical";
          description: string;
          incident_status?: "open" | "investigating" | "resolved" | "closed";
          operational_source?: string;
          resolution_notes?: string | null;
          follow_up_status?: "pending" | "scheduled" | "done" | "not_required";
          context_route?: string | null;
          context_module?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          category?: string;
          severity?: "low" | "medium" | "high" | "critical";
          description?: string;
          incident_status?: "open" | "investigating" | "resolved" | "closed";
          operational_source?: string;
          resolution_notes?: string | null;
          follow_up_status?: "pending" | "scheduled" | "done" | "not_required";
          context_route?: string | null;
          context_module?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pilot_incidents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pilot_incidents_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pilot_suggestions: {
        Row: {
          id: string;
          tenant_id: string;
          actor_profile_id: string;
          category: string;
          severity: "low" | "medium" | "high";
          description: string;
          suggestion_status: "submitted" | "reviewed" | "planned" | "done" | "declined";
          context_route: string | null;
          context_module: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          actor_profile_id: string;
          category: string;
          severity: "low" | "medium" | "high";
          description: string;
          suggestion_status?: "submitted" | "reviewed" | "planned" | "done" | "declined";
          context_route?: string | null;
          context_module?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          actor_profile_id?: string;
          category?: string;
          severity?: "low" | "medium" | "high";
          description?: string;
          suggestion_status?: "submitted" | "reviewed" | "planned" | "done" | "declined";
          context_route?: string | null;
          context_module?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pilot_suggestions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pilot_suggestions_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payout_rules: {
        Row: {
          id: string;
          tenant_id: string;
          professional_id: string | null;
          specialty: string;
          insurance_provider_id: string | null;
          payout_type: PayoutRuleType;
          payout_percentage: number | null;
          fixed_value: number | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          professional_id?: string | null;
          specialty?: string;
          insurance_provider_id?: string | null;
          payout_type: PayoutRuleType;
          payout_percentage?: number | null;
          fixed_value?: number | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          professional_id?: string | null;
          specialty?: string;
          insurance_provider_id?: string | null;
          payout_type?: PayoutRuleType;
          payout_percentage?: number | null;
          fixed_value?: number | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payout_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_embeddings: {
        Row: {
          id: string;
          tenant_id: string | null;
          document_id: string;
          domain: string;
          classification: string;
          agent_affinity: string[];
          source_path: string;
          chunk_index: number;
          content: string;
          content_hash: string;
          embedding: string | null;
          embedding_model: string | null;
          metadata: Json;
          version: string;
          language: string;
          indexed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id?: string | null;
          document_id: string;
          domain: string;
          classification: string;
          agent_affinity?: string[];
          source_path: string;
          chunk_index?: number;
          content: string;
          content_hash: string;
          embedding?: string | null;
          embedding_model?: string | null;
          metadata?: Json;
          version: string;
          language?: string;
          indexed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          document_id?: string;
          domain?: string;
          classification?: string;
          agent_affinity?: string[];
          source_path?: string;
          chunk_index?: number;
          content?: string;
          content_hash?: string;
          embedding?: string | null;
          embedding_model?: string | null;
          metadata?: Json;
          version?: string;
          language?: string;
          indexed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_index_runs: {
        Row: {
          id: string;
          tenant_id: string | null;
          mode: string;
          source_path: string;
          documents_processed: number;
          chunks_processed: number;
          chunks_embedded: number;
          chunks_skipped: number;
          embedding_model: string;
          embedding_dimensions: number;
          status: string;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          mode: string;
          source_path: string;
          documents_processed?: number;
          chunks_processed?: number;
          chunks_embedded?: number;
          chunks_skipped?: number;
          embedding_model: string;
          embedding_dimensions?: number;
          status?: string;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          mode?: string;
          source_path?: string;
          documents_processed?: number;
          chunks_processed?: number;
          chunks_embedded?: number;
          chunks_skipped?: number;
          embedding_model?: string;
          embedding_dimensions?: number;
          status?: string;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_index_runs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_tenant_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      current_professional_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_operational_manager: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_tenant_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_manage_billing: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_manage_tuss_catalog: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_operational_analytics_event_rollups: {
        Args: { p_from: string; p_to: string };
        Returns: Json;
      };
      get_operational_recommendation_feedback_rollups: {
        Args: { p_from: string; p_to: string };
        Returns: Json;
      };
      get_latest_operational_recommendation_feedback_for_ids: {
        Args: { p_ids: string[] };
        Returns: Json;
      };
      match_knowledge_embeddings: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter_domain?: string | null;
          filter_classification?: string | null;
          similarity_threshold?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          domain: string;
          classification: string;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      unit_type: UnitType;
      schedule_status: ScheduleStatus;
      shift_status: ShiftStatus;
      assignment_status: AssignmentStatus;
      swap_request_status: SwapRequestStatus;
      operational_event_severity: OperationalEventSeverity;
      operational_recommendation_feedback_type: OperationalRecommendationFeedbackType;
      operational_action_proposal_state: OperationalActionProposalState;
      operational_action_kind: OperationalActionKind;
      operational_action_proposal_audit_event: OperationalActionProposalAuditEvent;
      operational_simulation_state: OperationalSimulationState;
      operational_mutation_execution_state: OperationalMutationExecutionState;
      operational_orchestration_state: OperationalOrchestrationState;
      operational_orchestration_step_kind: OperationalOrchestrationStepKind;
      operational_orchestration_step_state: OperationalOrchestrationStepState;
      operational_memory_kind: OperationalMemoryKind;
      operational_memory_state: OperationalMemoryState;
      operational_policy_governance_recommendation_kind: OperationalPolicyGovernanceRecommendationKind;
      supervised_policy_lifecycle_state: SupervisedPolicyLifecycleState;
      operational_strategic_planning_lifecycle_state: OperationalStrategicPlanningLifecycleState;
      tiss_guide_type: TissGuideType;
      tiss_guide_status: TissGuideStatus;
      tiss_batch_status: TissBatchStatus;
      tiss_return_status: TissReturnStatus;
      tiss_denial_type: TissDenialType;
      tiss_denial_status: TissDenialStatus;
      tiss_appeal_status: TissAppealStatus;
      medical_payout_status: MedicalPayoutStatus;
      payout_rule_type: PayoutRuleType;
      financial_closing_status: FinancialClosingStatus;
      financial_closing_snapshot_type: FinancialClosingSnapshotType;
      operational_reconciliation_status: OperationalReconciliationStatus;
      operational_reconciliation_item_status: OperationalReconciliationItemStatus;
      operational_reconciliation_item_reference_type: OperationalReconciliationItemReferenceType;
      operational_reconciliation_issue_severity: OperationalReconciliationIssueSeverity;
      operational_reconciliation_audit_action: OperationalReconciliationAuditAction;
    };
    CompositeTypes: Record<string, never>;
  };
};
