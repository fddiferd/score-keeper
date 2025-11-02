# Firestore Composite Indexes
# These indexes are required for optimal query performance in Firestore

# =============================================================================
# GAMES COLLECTION - USER_ID + DATE INDEX
# =============================================================================

# Composite index for games collection (user_id + date) - Dev environment
resource "google_firestore_index" "games_user_date_dev" {
  provider = google-beta
  project  = google_project.project.project_id
  database = google_firestore_database.dev.name

  collection = "games"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "date"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.dev]
}

# Composite index for games collection (user_id + date) - Staging environment
resource "google_firestore_index" "games_user_date_staging" {
  provider = google-beta
  project  = google_project.project.project_id
  database = google_firestore_database.staging.name

  collection = "games"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "date"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.staging]
}

# Composite index for games collection (user_id + date) - Production environment
resource "google_firestore_index" "games_user_date_prod" {
  provider = google-beta
  project  = google_project.project.project_id
  database = google_firestore_database.prod.name

  collection = "games"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "date"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.prod]
}

# =============================================================================
# GAMES COLLECTION - USER_IDS ARRAY + IS_COMPLETE + UPDATED_AT INDEX
# =============================================================================

# Composite index for games collection (user_ids array) - Dev environment
resource "google_firestore_index" "games_user_ids_active_dev" {
  provider = google-beta
  project  = google_project.project.project_id
  database = google_firestore_database.dev.name

  collection = "games"

  fields {
    field_path   = "user_ids"
    array_config = "CONTAINS"
  }

  fields {
    field_path = "is_complete"
    order      = "ASCENDING"
  }

  fields {
    field_path = "updated_at"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.dev]
}

# Composite index for games collection (user_ids array) - Staging environment
resource "google_firestore_index" "games_user_ids_active_staging" {
  provider = google-beta
  project  = google_project.project.project_id
  database = google_firestore_database.staging.name

  collection = "games"

  fields {
    field_path   = "user_ids"
    array_config = "CONTAINS"
  }

  fields {
    field_path = "is_complete"
    order      = "ASCENDING"
  }

  fields {
    field_path = "updated_at"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.staging]
}

# Composite index for games collection (user_ids array) - Production environment
resource "google_firestore_index" "games_user_ids_active_prod" {
  provider = google-beta
  project  = google_project.project.project_id
  database = google_firestore_database.prod.name

  collection = "games"

  fields {
    field_path   = "user_ids"
    array_config = "CONTAINS"
  }

  fields {
    field_path = "is_complete"
    order      = "ASCENDING"
  }

  fields {
    field_path = "updated_at"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.prod]
}

