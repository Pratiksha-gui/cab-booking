
"""create payments table

Revision ID: 7827c3b66073
Revises: 3c98704246c3
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7827c3b66073'
down_revision: Union[str, Sequence[str], None] = '3c98704246c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
