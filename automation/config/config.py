import os

BASE_URL = os.getenv("BASE_URL", "https://Nikhilreddy098.github.io/TicketMatchPro/")
SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL", "https://zfvhnuliowfqnhghwbcb.supabase.co")
SUPABASE_KEY = os.getenv("EXPO_PUBLIC_SUPABASE_KEY", "sb_publishable_swgqn8wXn9C29hJP6tTZFQ_w7N8nrSr")

# Timeout settings
IMPLICIT_WAIT = 10
EXPLICIT_WAIT = 15

# Directory paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESULTS_DIR = os.path.join(ROOT_DIR, "Test Results")
EXCEL_DIR = os.path.join(RESULTS_DIR, "Excel")
HTML_DIR = os.path.join(RESULTS_DIR, "HTML")
JSON_DIR = os.path.join(RESULTS_DIR, "JSON")
SCREENSHOTS_DIR = os.path.join(RESULTS_DIR, "Screenshots")
LOGS_DIR = os.path.join(RESULTS_DIR, "Logs")
SUMMARY_DIR = os.path.join(RESULTS_DIR, "Summary")

for directory in [RESULTS_DIR, EXCEL_DIR, HTML_DIR, JSON_DIR, SCREENSHOTS_DIR, LOGS_DIR, SUMMARY_DIR]:
    os.makedirs(directory, exist_ok=True)
