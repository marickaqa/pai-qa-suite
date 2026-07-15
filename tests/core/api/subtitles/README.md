# Subtitles API Tests

Tests for the PAI Subtitles backend at subtitles-api-dev.paicloud.ai.
Uses Vitest + Axios. Auth uses `SUBTITLES_QA_EMAIL` and `SUBTITLES_QA_PASSWORD` from `.env`.

## ftp.spec.ts

Tests FTP job ingestion for the Subtitles platform.
Uploads a real video file via FTP and waits for the full processing pipeline to complete.
Requires `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` env vars.

| Test | What it checks |
|---|---|
| should create a job after FTP upload | Job appears in job list with correct ftp_folder and source_type=ftp |
| should complete the job | Job status reaches completed within 120s timeout |
| should have correct job metadata | filename, content_type, tenant_id and translated_languages are correct |
