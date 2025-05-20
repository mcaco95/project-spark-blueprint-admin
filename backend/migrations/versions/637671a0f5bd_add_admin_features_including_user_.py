"""Add admin features including user status last login and system settings

Revision ID: 637671a0f5bd
Revises: db7963ccb795
Create Date: 2025-05-19 17:20:05.022866

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '637671a0f5bd'
down_revision = 'db7963ccb795'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Create system_settings table if it doesn't exist
    if 'system_settings' not in inspector.get_table_names():
        op.create_table('system_settings',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('value', sa.String(), nullable=False),
            sa.Column('type', sa.String(length=20), nullable=False),
            sa.Column('description', sa.String(length=1000), nullable=True),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name'),
            sa.CheckConstraint("type IN ('string', 'boolean', 'number')", name='valid_setting_type')
        )

    # Add permissions to user_roles if it doesn't exist
    with op.batch_alter_table('user_roles', schema=None) as batch_op:
        if 'permissions' not in [c['name'] for c in inspector.get_columns('user_roles')]:
            batch_op.add_column(sa.Column('permissions', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False))

    # Add last_login to users if it doesn't exist
    with op.batch_alter_table('users', schema=None) as batch_op:
        user_columns = [c['name'] for c in inspector.get_columns('users')]
        if 'last_login' not in user_columns:
            batch_op.add_column(sa.Column('last_login', sa.DateTime(), nullable=True))

    # Handle status column separately
    if 'status' not in [c['name'] for c in inspector.get_columns('users')]:
        # Create a temporary status column without constraints
        op.add_column('users', sa.Column('status', sa.String(20), nullable=True))
        
        # Set default value for existing rows
        op.execute("UPDATE users SET status = 'active' WHERE status IS NULL")
        
        # Make the column not nullable
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.alter_column('status',
                existing_type=sa.String(20),
                nullable=False,
                server_default="'active'"
            )
            
            # Now add the constraint
            batch_op.create_check_constraint(
                'valid_user_status',
                "status IN ('active', 'inactive', 'pending')"
            )


def downgrade():
    # Drop columns first
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('valid_user_status', type_='check')
        batch_op.drop_column('last_login')
        batch_op.drop_column('status')

    with op.batch_alter_table('user_roles', schema=None) as batch_op:
        batch_op.drop_column('permissions')

    # Drop tables
    op.drop_table('system_settings')
