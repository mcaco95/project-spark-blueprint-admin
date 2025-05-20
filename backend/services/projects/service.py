# Project related business logic will go here 
from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, func, and_, desc, asc, delete as sqlalchemy_delete
from datetime import datetime

from core.db import db
from services.auth.models import User
from . import schemas
from .models import Project, project_members_table
from core.pagination import PaginatedResponse

# --- Project Services ---

def create_project(project_in: schemas.ProjectCreate, owner_id: UUID) -> Project:
    """Creates a new project, sets the owner as editor, and adds other specified members as viewers."""
    
    owner = db.session.get(User, owner_id)
    if not owner:
        raise ValueError("Owner user not found")

    project_data_dict = project_in.model_dump(exclude_unset=True)
    
    # Extract team_member_ids before creating Project instance, as it's not a direct model field
    team_member_ids_to_add = project_data_dict.pop('team_member_ids', [])
    
    # Ensure progress is handled (it's in ProjectBase, so model_dump includes it with its default if not set)
    # If not in project_data_dict, Pydantic default from ProjectBase via ProjectCreate already applied.
    # If it was explicitly None from a form, Pydantic default also handles it.
    # Explicitly setting it here if needed for some edge case not covered by Pydantic default (e.g. exclude_none=True elsewhere)
    if 'progress' not in project_data_dict or project_data_dict.get('progress') is None:
         project_data_dict['progress'] = 0


    db_project = Project(
        **project_data_dict, 
        owner_id=owner_id,
        created_by_id=owner_id 
    )
    db.session.add(db_project)
    db.session.flush() # Flush to get db_project.id for member associations

    # Add owner as editor
    db_project.members.append(owner)
    db.session.flush() # Ensure link is created before trying to update role
    stmt_owner_role = (
        project_members_table.update()
        .where(and_(project_members_table.c.project_id == db_project.id, 
                    project_members_table.c.user_id == owner_id))
        .values(role_in_project=schemas.ProjectRoleEnum.editor.value)
    )
    db.session.execute(stmt_owner_role)

    # Add other team members as viewers
    if team_member_ids_to_add:
        for user_id_str in team_member_ids_to_add:
            user_id = UUID(str(user_id_str)) # Ensure it's UUID object
            if user_id == owner_id:
                continue # Owner already added and role set

            member_user = db.session.get(User, user_id)
            if member_user:
                # Check if member already added (e.g. from a previous faulty operation)
                # For create, this list should initially be just the owner
                current_member_ids_in_project = [m.id for m in db_project.members]
                if member_user.id not in current_member_ids_in_project:
                    db_project.members.append(member_user)
                    db.session.flush() # Create link
                    stmt_member_role = (
                        project_members_table.update()
                        .where(and_(project_members_table.c.project_id == db_project.id, 
                                    project_members_table.c.user_id == user_id))
                        .values(role_in_project=schemas.ProjectRoleEnum.viewer.value)
                    )
                    db.session.execute(stmt_member_role)
            # else: log or raise error if a member ID is invalid? For now, silently skip.

    db.session.commit()
    db.session.refresh(db_project)
    return db.session.query(Project).options(joinedload(Project.owner), selectinload(Project.members)).filter(Project.id == db_project.id).one()

def get_project_by_id(project_id: UUID, current_user_id: UUID) -> Optional[Project]:
    """Gets a single non-deleted project by its ID if the user is owner or member."""
    project = db.session.query(Project).options(
        joinedload(Project.owner), # Eager load owner for createdBy
        selectinload(Project.members) # Eager load members for teamMembers
    ).filter(
        Project.id == project_id,
        Project.deleted_at == None,
        (Project.owner_id == current_user_id) | 
        (Project.id.in_(
            db.session.query(project_members_table.c.project_id)
            .filter(project_members_table.c.user_id == current_user_id)
        ))
    ).first()
    return project

def get_projects_for_user(user_id: UUID) -> List[Project]:
    """Gets all non-deleted projects where the user is either the owner or a member, with owner and members eager loaded."""
    projects = db.session.query(Project).options(
        joinedload(Project.owner),      # Eager load owner for createdBy
        selectinload(Project.members)   # Eager load members for teamMembers
    ).filter(
        Project.deleted_at == None,
        (Project.owner_id == user_id) | 
        (Project.id.in_(
            db.session.query(project_members_table.c.project_id)
            .filter(project_members_table.c.user_id == user_id)
        ))
    ).order_by(Project.created_at.desc()).all()
    return projects

def update_project(
    project_id: UUID, 
    project_in: schemas.ProjectUpdate, 
    current_user_id: UUID
) -> Optional[Project]:
    """Updates a project. Handles direct attributes and replaces team members if provided."""
    project = get_project_by_id(project_id, current_user_id)
    if not project:
        return None

    is_owner = project.owner_id == current_user_id
    is_editor = False
    if not is_owner:
        member_link_stmt = select(project_members_table.c.role_in_project).where(
            project_members_table.c.project_id == project_id,
            project_members_table.c.user_id == current_user_id
        )
        member_link_role = db.session.execute(member_link_stmt).scalar_one_or_none()
        if member_link_role and member_link_role == schemas.ProjectRoleEnum.editor.value:
            is_editor = True

    if not (is_owner or is_editor):
        return None 

    print(f"[SERVICE UPDATE_PROJECT] project_in (Pydantic model): {project_in}") # DEBUG
    print(f"[SERVICE UPDATE_PROJECT] project_in.end_date: {project_in.end_date}, type: {type(project_in.end_date)}") # DEBUG

    update_data = project_in.model_dump(exclude_unset=True)
    print(f"[SERVICE UPDATE_PROJECT] update_data from model_dump(exclude_unset=True): {update_data}") # DEBUG
    
    new_team_member_ids = update_data.pop('team_member_ids', None)

    # Update direct attributes of the project
    for field_name, value in update_data.items():
        if field_name == 'end_date':
            print(f"[SERVICE UPDATE_PROJECT] Attempting to set {field_name}: {value}, type: {type(value)}") # DEBUG
        setattr(project, field_name, value)
    
    project.updated_by_id = current_user_id
    # updated_at is handled by the model's onupdate if defined, or here
    project.updated_at = datetime.utcnow() # Use utcnow for consistency if model doesn't auto-update

    print(f"[SERVICE UPDATE_PROJECT] Initial project.members: {[m.id for m in project.members]}") # DEBUG
    if new_team_member_ids is not None: # If team_member_ids was explicitly provided (even if empty list)
        print(f"[SERVICE UPDATE_PROJECT] new_team_member_ids from payload: {new_team_member_ids}") # DEBUG
        # Preserve owner
        owner_member = None
        # members_to_keep = [] # This logic can be simplified
        for member in project.members:
            if member.id == project.owner_id:
                owner_member = member # Keep owner object
                # members_to_keep.append(owner_member)
                break
        
        new_members_for_project_orm_objects = []
        if owner_member: # Owner should always be present if they are the project owner
            new_members_for_project_orm_objects.append(owner_member)
            print(f"[SERVICE UPDATE_PROJECT] Added owner {owner_member.id} to new_members_for_project_orm_objects") # DEBUG

        processed_new_ids = set()
        if owner_member:
            processed_new_ids.add(owner_member.id)

        for member_uuid in new_team_member_ids: # member_uuid is already a UUID object
            # user_id = UUID(str(user_id_str)) # No longer needed, it's already UUID
            if member_uuid in processed_new_ids: # Avoid reprocessing, especially the owner if included in team_member_ids
                print(f"[SERVICE UPDATE_PROJECT] Skipping already processed/owner UUID: {member_uuid}") # DEBUG
                continue
            
            user = db.session.get(User, member_uuid)
            if user:
                new_members_for_project_orm_objects.append(user)
                print(f"[SERVICE UPDATE_PROJECT] Fetched and added user {user.id} to new_members_for_project_orm_objects") # DEBUG
            else:
                print(f"[SERVICE UPDATE_PROJECT] User with ID {member_uuid} not found in DB, skipping.") # DEBUG
            processed_new_ids.add(member_uuid)
        
        print(f"[SERVICE UPDATE_PROJECT] Final list of user IDs for project.members assignment: {[u.id for u in new_members_for_project_orm_objects]}") # DEBUG
        project.members = new_members_for_project_orm_objects # SQLAlchemy handles inserts/deletes in association
        db.session.flush() # Apply member changes
        print(f"[SERVICE UPDATE_PROJECT] project.members after assignment and flush: {[m.id for m in project.members]}") # DEBUG

        # Set roles for new/updated members (owner's role is preserved, others become viewers)
        for member_in_project in project.members: # Iterate through members now associated with project
            role_to_set = schemas.ProjectRoleEnum.viewer.value
            if member_in_project.id == project.owner_id:
                role_to_set = schemas.ProjectRoleEnum.editor.value # Owner is always editor
            
            print(f"[SERVICE UPDATE_PROJECT] Setting role for user {member_in_project.id} to {role_to_set}") # DEBUG
            stmt_role_update = (
                project_members_table.update()
                .where(and_(project_members_table.c.project_id == project.id, 
                            project_members_table.c.user_id == member_in_project.id))
                .values(role_in_project=role_to_set)
            )
            # Check if link exists before updating role (SQLAlchemy might have created it without role)
            # This is tricky because project.members = ... might just create links.
            # A robust way: insert with role or update.
            # For simplicity, assuming append then update role is fine.
            # If the link doesn't exist, this update does nothing.
            # If project.members handles everything, the role needs to be set when link is made.
            # Given the separate role update for owner in create, doing it separately here too.
            
            # Simpler: Ensure all members in project.members (after assignment) have their roles set.
            # If they are new, the link is made by project.members assignment.
            # We just need to ensure their role in project_members_table is correct.
            
            # Check if a link record exists, if not, it was just added by project.members
            # This part is tricky. `project.members = ...` only syncs the user IDs.
            # Roles must be managed separately.
            # The easiest way is after `project.members` assignment, iterate and ensure roles.

            # This will update existing links or newly created ones if roles need explicit setting
            # This assumes the user is already in project.members
            db.session.execute(stmt_role_update)

        db.session.flush() # Explicitly flush after role updates

    db.session.commit()
    db.session.refresh(project)
    # Re-fetch with eager loading to ensure all data is current for the response
    return db.session.query(Project).options(joinedload(Project.owner), selectinload(Project.members)).filter(Project.id == project.id).one()

def delete_project(project_id: UUID, current_user_id: UUID) -> bool:
    """Soft deletes a project. Only the project owner can delete."""
    project = get_project_by_id(project_id, current_user_id)
    if not project:
        return False

    if project.owner_id != current_user_id:
        return False

    project.deleted_at = func.now()
    project.updated_by_id = current_user_id
    db.session.commit()
    return True

# --- Project Member Services ---

def add_member_to_project(
    project_id: UUID, 
    user_id_to_add: UUID, 
    role_in_project: schemas.ProjectRoleEnum, 
    current_user_id: UUID
) -> Optional[Project]:
    """Adds a user to a project. Only owner or an editor can add members."""
    project = get_project_by_id(project_id, current_user_id)
    if not project:
        return None

    is_owner = project.owner_id == current_user_id
    is_editor = False
    if not is_owner:
        member_link = db.session.query(project_members_table).filter(
            project_members_table.c.project_id == project_id,
            project_members_table.c.user_id == current_user_id
        ).first()
        if member_link and member_link.role_in_project == 'editor':
            is_editor = True
    
    if not (is_owner or is_editor):
        return None

    user_to_add = db.session.get(User, user_id_to_add)
    if not user_to_add:
        raise ValueError(f"User with ID {user_id_to_add} not found.")

    existing_member_ids = [member.id for member in project.members]
    if user_id_to_add in existing_member_ids:
        stmt = (project_members_table.update()
                .where(and_(project_members_table.c.project_id == project_id, 
                            project_members_table.c.user_id == user_id_to_add))
                .values(role_in_project=role_in_project.value))
        db.session.execute(stmt)
        db.session.commit()
        db.session.refresh(project)
        return project

    project.members.append(user_to_add)
    db.session.commit()

    stmt_set_role = (project_members_table.update()
            .where(and_(project_members_table.c.project_id == project_id, 
                        project_members_table.c.user_id == user_id_to_add))
            .values(role_in_project=role_in_project.value))
    db.session.execute(stmt_set_role)
    db.session.commit()
    
    db.session.refresh(project)
    return project

def remove_member_from_project(
    project_id: UUID, 
    user_id_to_remove: UUID, 
    current_user_id: UUID
) -> Optional[Project]:
    """Removes a user from a project. Only owner or editor can remove (owner cannot be removed by editor)."""
    project = get_project_by_id(project_id, current_user_id)
    if not project:
        return None

    is_owner = project.owner_id == current_user_id
    is_editor = False
    if not is_owner:
        member_link = db.session.query(project_members_table).filter(
            project_members_table.c.project_id == project_id,
            project_members_table.c.user_id == current_user_id
        ).first()
        if member_link and member_link.role_in_project == 'editor':
            is_editor = True

    if not (is_owner or is_editor):
        return None

    if project.owner_id == user_id_to_remove and not is_owner:
        return None
    if project.owner_id == user_id_to_remove and is_owner:
        return None

    user_to_remove = db.session.get(User, user_id_to_remove)
    if not user_to_remove:
        raise ValueError(f"User with ID {user_id_to_remove} to remove not found.")

    if user_to_remove in project.members:
        project.members.remove(user_to_remove)
        db.session.commit()
        db.session.refresh(project)
        return project
    
    return None

def get_project_members(project_id: UUID, current_user_id: UUID) -> List[schemas.ProjectMemberPublic]:
    """Gets a list of members for a project. Requires the current user to have access to the project."""
    project = get_project_by_id(project_id, current_user_id)
    if not project:
        return []

    members_data = db.session.query(
        User,
        project_members_table.c.role_in_project,
        project_members_table.c.added_at
    ).join(
        project_members_table,
        User.id == project_members_table.c.user_id
    ).filter(
        project_members_table.c.project_id == project_id
    ).all()

    result = []
    for user_model, role, added_at_val in members_data:
        user_simple_public = schemas.UserSimplePublic.from_orm(user_model)
        result.append(schemas.ProjectMemberPublic(
            user_id=user_model.id,
            role_in_project=role,
            user=user_simple_public,
            added_at=added_at_val
        ))
    return result 

def get_projects_paginated(
    page: int = 1,
    per_page: int = 10,
    status: Optional[str] = None,
    sort_by: str = 'created_at',
    sort_order: str = 'desc'
) -> PaginatedResponse[Project]:
    """Gets a paginated list of all projects for admin view."""
    query = db.session.query(Project).options(
        joinedload(Project.owner),
        selectinload(Project.members)
    )

    # Apply filters
    if status:
        query = query.filter(Project.status == status)

    # Apply sorting
    sort_column = getattr(Project, sort_by, Project.created_at)
    if sort_order == 'desc':
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedResponse[Project](
        items=items,
        total=total,
        page=page,
        per_page=per_page
    ) 