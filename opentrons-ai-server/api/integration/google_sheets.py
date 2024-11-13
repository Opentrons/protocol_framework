import asyncio
import json
import random

import gspread
import structlog
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from api.settings import Settings


class GoogleSheetsClient:
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"]

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.logger = structlog.stdlib.get_logger(settings.logger_name)
        self.client = self._initialize_client()

    def _initialize_client(self) -> gspread.Client:
        """Initialize the gspread client with credentials loaded from environment."""
        creds = self._get_credentials()
        return gspread.authorize(creds)

    def _get_credentials(self) -> Credentials:
        google_credentials_json = self.settings.google_credentials_json.get_secret_value()
        if not google_credentials_json:
            raise EnvironmentError("Missing GOOGLE_SHEETS_CREDENTIALS")

        creds_info = json.loads(google_credentials_json)
        creds = Credentials.from_authorized_user_info(creds_info, self.SCOPES)

        # Refresh credentials if expired
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())

        if not creds or not creds.valid:
            raise EnvironmentError("Invalid or expired Google Sheets credentials.")

        return creds

    async def append_feedback_to_sheet(self, user_id: str, feedback: str) -> None:
        """Append a row of feedback to the Google Sheet."""
        try:
            sheet_id = self.settings.google_sheet_id
            worksheet_name = self.settings.google_sheet_worksheet

            # Open the spreadsheet and worksheet asynchronously
            spreadsheet = await asyncio.to_thread(self.client.open_by_key, sheet_id)
            worksheet = await asyncio.to_thread(spreadsheet.worksheet, worksheet_name)

            # Append the row asynchronously
            await asyncio.to_thread(worksheet.append_row, [user_id, feedback])

            self.logger.info("Feedback successfully appended to Google Sheet.")
        except gspread.SpreadsheetNotFound:
            self.logger.error("Spreadsheet not found or not accessible.")
        except Exception:
            self.logger.error("Error appending feedback to Google Sheet.", exc_info=True)

    async def run_sample_feedback(self):
        """Run a sample feedback append with random data, for testing purposes."""
        user_id = str(random.randint(100000, 999999))
        feedback = f"This is a random feedback with ID {user_id}."
        await self.append_feedback_to_sheet(user_id, feedback)


def main() -> None:
    """Main function to test the GoogleSheetsClient class."""
    settings = Settings()
    google_sheets_client = GoogleSheetsClient(settings)
    asyncio.run(google_sheets_client.run_sample_feedback())


if __name__ == "__main__":
    main()
