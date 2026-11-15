
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_logs": {
                  Row: {
                    "action": string,"created_at": string,"entity_id": string | null,"entity_type": string | null,"id": string,"metadata": NonNullable<Json>,"org_id": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"org_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"org_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_logs_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_logs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"assignment_submissions": {
                  Row: {
                    "assignment_id": string,"content_text": string | null,"feedback": string | null,"file_name": string | null,"grade": number | null,"graded_at": string | null,"graded_by": string | null,"id": string,"mime_type": string | null,"org_id": string,"size_bytes": number | null,"status": Database["public"]['Enums']["submission_status"],"storage_path": string | null,"student_id": string,"submitted_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignment_id": string,"content_text"?: string | null,"feedback"?: string | null,"file_name"?: string | null,"grade"?: number | null,"graded_at"?: string | null,"graded_by"?: string | null,"id"?: string,"mime_type"?: string | null,"org_id": string,"size_bytes"?: number | null,"status"?: Database["public"]['Enums']["submission_status"],"storage_path"?: string | null,"student_id": string,"submitted_at"?: string,"updated_at"?: string
                  }
                  Update: {
                    "assignment_id"?: string,"content_text"?: string | null,"feedback"?: string | null,"file_name"?: string | null,"grade"?: number | null,"graded_at"?: string | null,"graded_by"?: string | null,"id"?: string,"mime_type"?: string | null,"org_id"?: string,"size_bytes"?: number | null,"status"?: Database["public"]['Enums']["submission_status"],"storage_path"?: string | null,"student_id"?: string,"submitted_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignment_submissions_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: false
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignment_submissions_graded_by_fkey"
      columns: ["graded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignment_submissions_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignment_submissions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"assignments": {
                  Row: {
                    "course_id": string,"created_at": string,"due_at": string | null,"grading_criteria": string | null,"id": string,"instructions": string,"lesson_id": string,"max_points": number,"org_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"due_at"?: string | null,"grading_criteria"?: string | null,"id"?: string,"instructions": string,"lesson_id": string,"max_points"?: number,"org_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"due_at"?: string | null,"grading_criteria"?: string | null,"id"?: string,"instructions"?: string,"lesson_id"?: string,"max_points"?: number,"org_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: true
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "color": string,"created_at": string,"description": string | null,"id": string,"name": string,"org_id": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"org_id": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"org_id"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"certificates": {
                  Row: {
                    "code": string,"course_id": string,"course_title": string,"created_at": string,"enrollment_id": string,"id": string,"instructor_name": string,"issued_at": string,"org_id": string,"org_name": string,"student_id": string,"student_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"course_id": string,"course_title": string,"created_at"?: string,"enrollment_id": string,"id"?: string,"instructor_name": string,"issued_at"?: string,"org_id": string,"org_name": string,"student_id": string,"student_name": string
                  }
                  Update: {
                    "code"?: string,"course_id"?: string,"course_title"?: string,"created_at"?: string,"enrollment_id"?: string,"id"?: string,"instructor_name"?: string,"issued_at"?: string,"org_id"?: string,"org_name"?: string,"student_id"?: string,"student_name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificates_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: true
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"course_instructors": {
                  Row: {
                    "course_id": string,"created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"user_id": string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_instructors_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_instructors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"course_sections": {
                  Row: {
                    "course_id": string,"created_at": string,"id": string,"position": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"id"?: string,"position"?: number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"id"?: string,"position"?: number,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_sections_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "category_id": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string,"difficulty": Database["public"]['Enums']["difficulty_level"],"duration_minutes": number,"id": string,"instructor_id": string,"is_featured": boolean,"learning_objectives": (string)[],"lesson_count": number,"org_id": string,"published_at": string | null,"requirements": (string)[],"requires_approval": boolean,"slug": string,"status": Database["public"]['Enums']["course_status"],"student_count": number,"subtitle": string | null,"thumbnail_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description": string,"difficulty"?: Database["public"]['Enums']["difficulty_level"],"duration_minutes"?: number,"id"?: string,"instructor_id": string,"is_featured"?: boolean,"learning_objectives"?: (string)[],"lesson_count"?: number,"org_id": string,"published_at"?: string | null,"requirements"?: (string)[],"requires_approval"?: boolean,"slug": string,"status"?: Database["public"]['Enums']["course_status"],"student_count"?: number,"subtitle"?: string | null,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string,"difficulty"?: Database["public"]['Enums']["difficulty_level"],"duration_minutes"?: number,"id"?: string,"instructor_id"?: string,"is_featured"?: boolean,"learning_objectives"?: (string)[],"lesson_count"?: number,"org_id"?: string,"published_at"?: string | null,"requirements"?: (string)[],"requires_approval"?: boolean,"slug"?: string,"status"?: Database["public"]['Enums']["course_status"],"student_count"?: number,"subtitle"?: string | null,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "courses_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courses_instructor_id_fkey"
      columns: ["instructor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courses_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"enrollments": {
                  Row: {
                    "completed_at": string | null,"course_id": string,"enrolled_at": string,"id": string,"last_accessed_at": string | null,"org_id": string,"progress_percent": number,"status": Database["public"]['Enums']["enrollment_status"],"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"course_id": string,"enrolled_at"?: string,"id"?: string,"last_accessed_at"?: string | null,"org_id": string,"progress_percent"?: number,"status"?: Database["public"]['Enums']["enrollment_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"course_id"?: string,"enrolled_at"?: string,"id"?: string,"last_accessed_at"?: string | null,"org_id"?: string,"progress_percent"?: number,"status"?: Database["public"]['Enums']["enrollment_status"],"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enrollments_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"instructor_requests": {
                  Row: {
                    "created_at": string,"id": string,"message": string | null,"org_id": string,"reviewed_at": string | null,"reviewed_by": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"org_id": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"org_id"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "instructor_requests_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "instructor_requests_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "instructor_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_progress": {
                  Row: {
                    "completed_at": string | null,"enrollment_id": string,"id": string,"last_viewed_at": string,"lesson_id": string,"org_id": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"enrollment_id": string,"id"?: string,"last_viewed_at"?: string,"lesson_id": string,"org_id": string,"student_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"enrollment_id"?: string,"id"?: string,"last_viewed_at"?: string,"lesson_id"?: string,"org_id"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_progress_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: false
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_resources": {
                  Row: {
                    "created_at": string,"external_url": string | null,"file_name": string | null,"id": string,"lesson_id": string,"mime_type": string | null,"size_bytes": number | null,"storage_path": string | null,"title": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"external_url"?: string | null,"file_name"?: string | null,"id"?: string,"lesson_id": string,"mime_type"?: string | null,"size_bytes"?: number | null,"storage_path"?: string | null,"title": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"external_url"?: string | null,"file_name"?: string | null,"id"?: string,"lesson_id"?: string,"mime_type"?: string | null,"size_bytes"?: number | null,"storage_path"?: string | null,"title"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_resources_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_resources_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "content": string | null,"course_id": string,"created_at": string,"estimated_minutes": number,"id": string,"is_preview": boolean,"is_published": boolean,"position": number,"section_id": string,"title": string,"type": Database["public"]['Enums']["lesson_type"],"updated_at": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "content"?: string | null,"course_id": string,"created_at"?: string,"estimated_minutes"?: number,"id"?: string,"is_preview"?: boolean,"is_published"?: boolean,"position"?: number,"section_id": string,"title": string,"type": Database["public"]['Enums']["lesson_type"],"updated_at"?: string,"video_url"?: string | null
                  }
                  Update: {
                    "content"?: string | null,"course_id"?: string,"created_at"?: string,"estimated_minutes"?: number,"id"?: string,"is_preview"?: boolean,"is_published"?: boolean,"position"?: number,"section_id"?: string,"title"?: string,"type"?: Database["public"]['Enums']["lesson_type"],"updated_at"?: string,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lessons_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "course_sections"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"link": string | null,"org_id": string | null,"read_at": string | null,"title": string,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"link"?: string | null,"org_id"?: string | null,"read_at"?: string | null,"title": string,"type"?: Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"link"?: string | null,"org_id"?: string | null,"read_at"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["notification_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_members": {
                  Row: {
                    "created_at": string,"id": string,"org_id": string,"role": Database["public"]['Enums']["user_role"],"status": Database["public"]['Enums']["member_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"org_id": string,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["member_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"org_id"?: string,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["member_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_members_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"id": string,"is_active": boolean,"logo_url": string | null,"name": string,"primary_color": string,"slug": string,"updated_at": string,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"logo_url"?: string | null,"name": string,"primary_color"?: string,"slug": string,"updated_at"?: string,"website_url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"logo_url"?: string | null,"name"?: string,"primary_color"?: string,"slug"?: string,"updated_at"?: string,"website_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"platform_settings": {
                  Row: {
                    "allow_signups": boolean,"id": boolean,"logo_url": string | null,"platform_name": string,"primary_color": string,"require_enrollment_approval": boolean,"support_email": string,"tagline": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_signups"?: boolean,"id"?: boolean,"logo_url"?: string | null,"platform_name"?: string,"primary_color"?: string,"require_enrollment_approval"?: boolean,"support_email"?: string,"tagline"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "allow_signups"?: boolean,"id"?: boolean,"logo_url"?: string | null,"platform_name"?: string,"primary_color"?: string,"require_enrollment_approval"?: boolean,"support_email"?: string,"tagline"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"default_org_id": string | null,"email": string,"email_verified": boolean,"full_name": string,"headline": string | null,"id": string,"last_login_at": string | null,"role": Database["public"]['Enums']["user_role"],"status": Database["public"]['Enums']["account_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"default_org_id"?: string | null,"email": string,"email_verified"?: boolean,"full_name": string,"headline"?: string | null,"id": string,"last_login_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"default_org_id"?: string | null,"email"?: string,"email_verified"?: boolean,"full_name"?: string,"headline"?: string | null,"id"?: string,"last_login_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_default_org_id_fkey"
      columns: ["default_org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "accepted_answers": (string)[],"created_at": string,"explanation": string | null,"id": string,"points": number,"position": number,"prompt": string,"quiz_id": string,"type": Database["public"]['Enums']["question_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_answers"?: (string)[],"created_at"?: string,"explanation"?: string | null,"id"?: string,"points"?: number,"position"?: number,"prompt": string,"quiz_id": string,"type": Database["public"]['Enums']["question_type"]
                  }
                  Update: {
                    "accepted_answers"?: (string)[],"created_at"?: string,"explanation"?: string | null,"id"?: string,"points"?: number,"position"?: number,"prompt"?: string,"quiz_id"?: string,"type"?: Database["public"]['Enums']["question_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "questions_quiz_id_fkey"
      columns: ["quiz_id"]
isOneToOne: false
      referencedRelation: "quizzes"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_answers": {
                  Row: {
                    "answer_text": string | null,"attempt_id": string,"id": string,"is_correct": boolean | null,"points_awarded": number | null,"question_id": string,"selected_option_ids": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_text"?: string | null,"attempt_id": string,"id"?: string,"is_correct"?: boolean | null,"points_awarded"?: number | null,"question_id": string,"selected_option_ids"?: (string)[]
                  }
                  Update: {
                    "answer_text"?: string | null,"attempt_id"?: string,"id"?: string,"is_correct"?: boolean | null,"points_awarded"?: number | null,"question_id"?: string,"selected_option_ids"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_answers_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: false
      referencedRelation: "quiz_attempts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_answers_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_attempts": {
                  Row: {
                    "attempt_number": number,"enrollment_id": string,"expires_at": string | null,"id": string,"org_id": string,"passed": boolean | null,"quiz_id": string,"score": number | null,"started_at": string,"status": string,"student_id": string,"submitted_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempt_number": number,"enrollment_id": string,"expires_at"?: string | null,"id"?: string,"org_id": string,"passed"?: boolean | null,"quiz_id": string,"score"?: number | null,"started_at"?: string,"status"?: string,"student_id": string,"submitted_at"?: string | null
                  }
                  Update: {
                    "attempt_number"?: number,"enrollment_id"?: string,"expires_at"?: string | null,"id"?: string,"org_id"?: string,"passed"?: boolean | null,"quiz_id"?: string,"score"?: number | null,"started_at"?: string,"status"?: string,"student_id"?: string,"submitted_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_attempts_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: false
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_attempts_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_attempts_quiz_id_fkey"
      columns: ["quiz_id"]
isOneToOne: false
      referencedRelation: "quizzes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_attempts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_options": {
                  Row: {
                    "id": string,"is_correct": boolean,"label": string,"position": number,"question_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_correct"?: boolean,"label": string,"position"?: number,"question_id": string
                  }
                  Update: {
                    "id"?: string,"is_correct"?: boolean,"label"?: string,"position"?: number,"question_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_options_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"quizzes": {
                  Row: {
                    "course_id": string,"created_at": string,"id": string,"instructions": string | null,"lesson_id": string,"max_attempts": number,"org_id": string,"passing_score": number,"randomize_answers": boolean,"randomize_questions": boolean,"show_results": boolean,"time_limit_minutes": number | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"id"?: string,"instructions"?: string | null,"lesson_id": string,"max_attempts"?: number,"org_id": string,"passing_score"?: number,"randomize_answers"?: boolean,"randomize_questions"?: boolean,"show_results"?: boolean,"time_limit_minutes"?: number | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"id"?: string,"instructions"?: string | null,"lesson_id"?: string,"max_attempts"?: number,"org_id"?: string,"passing_score"?: number,"randomize_answers"?: boolean,"randomize_questions"?: boolean,"show_results"?: boolean,"time_limit_minutes"?: number | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quizzes_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quizzes_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: true
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quizzes_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_access_lesson_content":
{ Args: { "p_lesson": string }; Returns: boolean
                           },
"can_author_in_org":
{ Args: { "p_org": string }; Returns: boolean
                           },
"can_view_attempt":
{ Args: { "p_attempt": string }; Returns: boolean
                           },
"can_view_course":
{ Args: { "p_course": string }; Returns: boolean
                           },
"can_view_lesson":
{ Args: { "p_lesson": string }; Returns: boolean
                           },
"can_view_profile":
{ Args: { "p_profile": string }; Returns: boolean
                           },
"current_user_org_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"enroll_in_course":
{ Args: { "p_course_id": string }; Returns: {
              "enrollment_id": string,"enrollment_status": Database["public"]['Enums']["enrollment_status"],"requires_approval": boolean
            }[]
                           },
"get_course_curriculum":
{ Args: { "p_course": string }; Returns: {
              "estimated_minutes": number,"is_preview": boolean,"lesson_id": string,"lesson_position": number,"lesson_title": string,"lesson_type": Database["public"]['Enums']["lesson_type"],"section_id": string,"section_position": number,"section_title": string
            }[]
                           },
"get_course_metrics":
{ Args: { "p_course_ids": (string)[] }; Returns: {
              "course_id": string,"lesson_count": number,"student_count": number
            }[]
                           },
"get_public_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "courses": number,"learners": number,"organizations": number
            }[]
                           },
"get_quiz_attempt":
{ Args: { "p_attempt_id": string }; Returns: Json
                           },
"is_active_member_of":
{ Args: { "p_org": string,"p_user": string }; Returns: boolean
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin_of_user":
{ Args: { "p_user": string }; Returns: boolean
                           },
"is_assignment_manager":
{ Args: { "p_assignment": string }; Returns: boolean
                           },
"is_course_manager":
{ Args: { "p_course": string }; Returns: boolean
                           },
"is_enrolled":
{ Args: { "p_course": string }; Returns: boolean
                           },
"is_instructor_of_student":
{ Args: { "p_student": string }; Returns: boolean
                           },
"is_org_admin":
{ Args: { "p_org": string }; Returns: boolean
                           },
"is_org_member":
{ Args: { "p_org": string }; Returns: boolean
                           },
"is_quiz_manager":
{ Args: { "p_quiz": string }; Returns: boolean
                           },
"is_super_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"record_lesson_progress":
{ Args: { "p_completed"?: boolean,"p_lesson_id": string }; Returns: {
              "certificate_code": string,"completed_lessons": number,"course_completed": boolean,"progress": number,"total_lessons": number
            }[]
                           },
"start_quiz_attempt":
{ Args: { "p_quiz_id": string }; Returns: {
              "attempt_id": string,"attempt_number": number,"expires_at": string
            }[]
                           },
"submit_quiz_attempt":
{ Args: { "p_answers": Json,"p_attempt_id": string }; Returns: {
              "attempts_used": number,"correct_answers": number,"max_attempts": number,"passed": boolean,"score": number,"total_questions": number
            }[]
                           },
"verify_certificate":
{ Args: { "p_code": string }; Returns: {
              "code": string,"course_title": string,"instructor_name": string,"issued_at": string,"org_name": string,"student_name": string
            }[]
                           }
          }
          Enums: {
            "account_status": "active"|"suspended","course_status": "draft"|"published"|"archived","difficulty_level": "beginner"|"intermediate"|"advanced","enrollment_status": "pending"|"active"|"completed"|"rejected"|"cancelled","lesson_type": "video"|"text"|"pdf"|"resource"|"quiz"|"assignment","member_status": "active"|"invited"|"suspended","notification_type": "enrollment"|"lesson"|"assignment"|"deadline"|"quiz"|"grade"|"feedback"|"completion"|"system","question_type": "single"|"multiple"|"true_false"|"short_answer","submission_status": "submitted"|"graded"|"returned","user_role": "super_admin"|"org_admin"|"instructor"|"student"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_status": ["active", "suspended"],"course_status": ["draft", "published", "archived"],"difficulty_level": ["beginner", "intermediate", "advanced"],"enrollment_status": ["pending", "active", "completed", "rejected", "cancelled"],"lesson_type": ["video", "text", "pdf", "resource", "quiz", "assignment"],"member_status": ["active", "invited", "suspended"],"notification_type": ["enrollment", "lesson", "assignment", "deadline", "quiz", "grade", "feedback", "completion", "system"],"question_type": ["single", "multiple", "true_false", "short_answer"],"submission_status": ["submitted", "graded", "returned"],"user_role": ["super_admin", "org_admin", "instructor", "student"]
          }
        }
} as const
