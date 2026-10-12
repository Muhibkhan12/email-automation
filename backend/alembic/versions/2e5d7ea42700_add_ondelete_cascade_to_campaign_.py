"""add ondelete cascade to campaign_recipients.upload_id

Revision ID: 2e5d7ea42700
Revises: af50edef33b1
Create Date: 2026-10-12 21:54:27.445213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2e5d7ea42700'
down_revision: Union[str, Sequence[str], None] = 'af50edef33b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # campaign_id FK -> CASCADE
    op.drop_constraint(
        'campaign_recipients_ibfk_1',
        'campaign_recipients',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'campaign_recipients_ibfk_1',
        'campaign_recipients',
        'campaigns',
        ['campaign_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # upload_id FK -> CASCADE  (ye Alembic ne miss kiya tha)
    op.drop_constraint(
        'campaign_recipients_ibfk_2',
        'campaign_recipients',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'campaign_recipients_ibfk_2',
        'campaign_recipients',
        'uploads',
        ['upload_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """Downgrade schema."""

    # upload_id FK -> revert (no cascade)
    op.drop_constraint(
        'campaign_recipients_ibfk_2',
        'campaign_recipients',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'campaign_recipients_ibfk_2',
        'campaign_recipients',
        'uploads',
        ['upload_id'],
        ['id']
    )

    # campaign_id FK -> revert (no cascade)
    op.drop_constraint(
        'campaign_recipients_ibfk_1',
        'campaign_recipients',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'campaign_recipients_ibfk_1',
        'campaign_recipients',
        'campaigns',
        ['campaign_id'],
        ['id']
    )