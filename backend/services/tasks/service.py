# Placeholder for task services 
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, delete as sqlalchemy_delete
from uuid import UUID
from typing import List, Optional

from backend.services.tasks.models import Task, task_assignees_table, task_dependencies_table
from backend.services.tasks.schemas import TaskCreate, TaskUpdate, TaskStatusEnum, DependencyTypeEnum
from backend.services.auth.models import User # For fetching assignees
from backend.services.projects.models import Project # For validating project existence
from backend.core.db import db # Assuming db.session is the synchronous session

def create_task(
    task_create_data: TaskCreate, 
    owner_id: UUID
) -> Task:
    session = db.session
    project_obj = session.get(Project, task_create_data.project_id)
    if not project_obj:
        raise ValueError(f"Project with id {task_create_data.project_id} not found.")

    db_task = Task(
        **task_create_data.model_dump(exclude_none=True, 
                                     exclude={'assignee_ids', 'depends_on_task_ids', 'dependency_type_for_new'}),
        owner_id=owner_id
    )
    
    if task_create_data.assignee_ids:
        assignee_users = session.execute(
            select(User).where(User.id.in_(task_create_data.assignee_ids))
        ).scalars().all()
        if len(assignee_users) != len(set(task_create_data.assignee_ids)):
            # Log or handle missing users
            pass 
        db_task.assignees = assignee_users

    session.add(db_task)
    session.flush() 

    if task_create_data.depends_on_task_ids:
        for dep_task_id in task_create_data.depends_on_task_ids:
            dep_task_obj = session.get(Task, dep_task_id)
            if not dep_task_obj:
                # Log or handle missing dependency task
                continue 
            
            stmt = task_dependencies_table.insert().values(
                task_id=db_task.id, 
                depends_on_task_id=dep_task_id, 
                dependency_type=task_create_data.dependency_type_for_new.value if task_create_data.dependency_type_for_new else DependencyTypeEnum.finish_to_start.value
            )
            session.execute(stmt)

    session.commit()
    # For synchronous sessions, refresh is often handled automatically or by accessing attributes.
    # If explicit refresh is needed after commit (e.g., to load relationships for the return value):
    # session.refresh(db_task, attribute_names=['assignees', 'dependencies', 'owner', 'project'])
    # However, it might be better to re-fetch or ensure relationships are loaded if needed by the caller.
    # For now, return the committed object. The caller (route) will handle serialization.
    return db_task

def get_task_by_id(task_id: UUID, user_id: UUID) -> Optional[Task]:
    session = db.session
    # User access logic would go here
    result = session.execute(
        select(Task)
        .options(
            selectinload(Task.owner),      # Use selectinload for synchronous eager loading
            selectinload(Task.project),
            selectinload(Task.assignees),
            selectinload(Task.dependencies) # Further nesting like .selectinload(Task.dependents) can be added if Task.dependencies has a dependents relationship itself
        )
        .where(Task.id == task_id)
    )
    return result.scalar_one_or_none()

def get_tasks_for_project(project_id: UUID, user_id: UUID) -> List[Task]:
    session = db.session
    # User access logic for project would go here
    result = session.execute(
        select(Task)
        .options(
            selectinload(Task.owner),
            selectinload(Task.project),
            selectinload(Task.assignees)
        )
        .where(Task.project_id == project_id)
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()

def update_task(
    task_id: UUID, 
    task_update_data: TaskUpdate, 
    user_id: UUID
) -> Optional[Task]:
    session = db.session
    db_task = get_task_by_id(task_id, user_id) # Reuses the getter
    if not db_task:
        return None
    
    # Authorization check (e.g. if user_id is owner or has specific role)

    update_data = task_update_data.model_dump(exclude_unset=True, 
                                             exclude={'assignee_ids', 'depends_on_task_ids', 'dependency_type_for_new'})
    for key, value in update_data.items():
        setattr(db_task, key, value)

    if task_update_data.assignee_ids is not None:
        if task_update_data.assignee_ids:
            assignee_users = session.execute(
                select(User).where(User.id.in_(task_update_data.assignee_ids))
            ).scalars().all()
            # Add check for missing users if necessary
            db_task.assignees = assignee_users
        else:
            db_task.assignees = []

    if task_update_data.depends_on_task_ids is not None:
        session.execute(sqlalchemy_delete(task_dependencies_table).where(task_dependencies_table.c.task_id == task_id))
        if task_update_data.depends_on_task_ids:
            dep_type = task_update_data.dependency_type_for_new or DependencyTypeEnum.finish_to_start
            for dep_task_id in task_update_data.depends_on_task_ids:
                dep_task_obj = session.get(Task, dep_task_id)
                if not dep_task_obj:
                    continue # Log or raise error
                stmt = task_dependencies_table.insert().values(
                    task_id=db_task.id, 
                    depends_on_task_id=dep_task_id, 
                    dependency_type=dep_type.value
                )
                session.execute(stmt)
        session.flush()

    session.commit()
    # session.refresh(db_task, attribute_names=['assignees', 'dependencies', 'owner', 'project'])
    return db_task

def delete_task(task_id: UUID, user_id: UUID) -> bool:
    session = db.session
    db_task = get_task_by_id(task_id, user_id)
    if not db_task:
        return False
    
    # Authorization check

    session.execute(sqlalchemy_delete(task_assignees_table).where(task_assignees_table.c.task_id == task_id))
    session.execute(sqlalchemy_delete(task_dependencies_table).where(
        (task_dependencies_table.c.task_id == task_id) | (task_dependencies_table.c.depends_on_task_id == task_id)
    ))
    
    session.delete(db_task)
    session.commit()
    return True 