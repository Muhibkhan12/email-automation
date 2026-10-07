from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = "af50edef33b1"
down_revision: Union[str, Sequence[str], None] = "a02ecaf9956d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ---------------------------------------------------------
    # 1. Add user_id temporarily as nullable
    # ---------------------------------------------------------
    # We cannot add it as NOT NULL immediately because existing
    # uploads already exist and don't have a user_id yet.

    op.add_column(
        "uploads",
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True
        )
    )

    op.execute("""
        UPDATE uploads AS u
        INNER JOIN campaigns AS c
            ON u.campaign_id = c.id
        SET u.user_id = c.user_id
    """)

    # ---------------------------------------------------------
    # 3. Change error_message TEXT -> VARCHAR(255)
    # ---------------------------------------------------------
    # This was detected by Alembic because the current database
    # uses TEXT while the SQLAlchemy model uses String(255).

    op.alter_column(
        "uploads",
        "error_message",
        existing_type=mysql.TEXT(),
        type_=sa.String(length=255),
        existing_nullable=True
    )

    # ---------------------------------------------------------
    # 4. Add foreign key: uploads.user_id -> users.id
    # ---------------------------------------------------------

    op.create_foreign_key(
        "fk_uploads_user_id_users",
        "uploads",
        "users",
        ["user_id"],
        ["id"]
    )

    # ---------------------------------------------------------
    # 5. Make user_id NOT NULL
    # ---------------------------------------------------------
    # At this point existing uploads should already have their
    # user_id populated from campaigns.

    op.alter_column(
        "uploads",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False
    )

    # ---------------------------------------------------------
    # 6. Create index on user_id
    # ---------------------------------------------------------
    # This improves queries such as:
    #
    # SELECT * FROM uploads WHERE user_id = ?
    #

    op.create_index(
        "ix_uploads_user_id",
        "uploads",
        ["user_id"],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    # ---------------------------------------------------------
    # 1. Remove user_id index
    # ---------------------------------------------------------

    op.drop_index(
        "ix_uploads_user_id",
        table_name="uploads"
    )

    # ---------------------------------------------------------
    # 2. Remove foreign key
    # ---------------------------------------------------------

    op.drop_constraint(
        "fk_uploads_user_id_users",
        "uploads",
        type_="foreignkey"
    )

    # ---------------------------------------------------------
    # 3. Change error_message back to TEXT
    # ---------------------------------------------------------

    op.alter_column(
        "uploads",
        "error_message",
        existing_type=sa.String(length=255),
        type_=mysql.TEXT(),
        existing_nullable=True
    )

    # ---------------------------------------------------------
    # 4. Remove user_id
    # ---------------------------------------------------------

    op.drop_column(
        "uploads",
        "user_id"
    )