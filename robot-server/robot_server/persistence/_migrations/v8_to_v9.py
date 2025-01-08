"""Migrate the persistence directory from schema 8 to 9.

Summary of changes from schema 8:

- Adds a new `labware_offset` table.
"""

from pathlib import Path

from robot_server.persistence.database import sql_engine_ctx
from robot_server.persistence.file_and_directory_names import DB_FILE
from robot_server.persistence.tables import schema_9

from .._folder_migrator import Migration


class Migration8to9(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 8 to 9."""
        # FIX BEFORE MERGE: Put an actual migration here.
        with sql_engine_ctx(dest_dir / DB_FILE) as engine:
            schema_9.metadata.create_all(engine)
