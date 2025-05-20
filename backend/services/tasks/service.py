# Placeholder for task services 
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, delete as sqlalchemy_delete, desc, asc, func, and_, case, or_
from uuid import UUID
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from .models import Task, task_assignees_table, task_dependencies_table
from .schemas import TaskCreate, TaskUpdate, TaskStatusEnum, DependencyTypeEnum
from services.auth.models import User # For fetching assignees
from services.projects.models import Project, project_members_table # For validating project existence
from core.db import db # Assuming db.session is the synchronous session
from core.pagination import PaginatedResponse
from services.projects.service import get_projects_for_user

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
            select(User).where(
                User.id.in_(task_create_data.assignee_ids),
                User.status == 'active'  # Only allow active users
            )
        ).scalars().all()
        if len(assignee_users) != len(set(task_create_data.assignee_ids)):
            # Log or handle missing/inactive users
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
                select(User).where(
                    User.id.in_(task_update_data.assignee_ids),
                    User.status == 'active'  # Only allow active users
                )
            ).scalars().all()
            # Add check for missing/inactive users if necessary
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

def get_tasks_paginated(
    page: int = 1,
    per_page: int = 10,
    status: Optional[str] = None,
    sort_by: str = 'created_at',
    sort_order: str = 'desc'
) -> PaginatedResponse[Task]:
    """Gets a paginated list of all tasks for admin view."""
    query = db.session.query(Task).options(
        joinedload(Task.owner),
        joinedload(Task.project),
        selectinload(Task.assignees)
    )

    # Apply filters
    if status:
        query = query.filter(Task.status == status)

    # Apply sorting
    sort_column = getattr(Task, sort_by, Task.created_at)
    if sort_order == 'desc':
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedResponse[Task](
        items=items,
        total=total,
        page=page,
        per_page=per_page
    ) 

def get_user_performance_metrics(user_id: UUID, days: int = 30) -> Dict:
    """Calculate performance metrics for a specific user."""
    print(f"DEBUG METRICS: get_user_performance_metrics called with user_id: {user_id}")
    session = db.session
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get tasks assigned to the user or owned by the user
    tasks_query = (
        session.query(Task)
        .outerjoin(task_assignees_table)
        .filter(
            and_(
                Task.created_at >= start_date,
                or_(
                    Task.owner_id == user_id,
                    task_assignees_table.c.user_id == user_id
                )
            )
        )
        .distinct()
    )

    # Calculate basic metrics
    total_tasks = tasks_query.count()
    completed_tasks = tasks_query.filter(Task.status.in_(['completed', 'done'])).count()
    in_progress_tasks = tasks_query.filter(Task.status == 'in_progress').count()
    todo_tasks = tasks_query.filter(Task.status == 'todo').count()
    review_tasks = tasks_query.filter(Task.status == 'review').count()
    
    # Calculate overdue tasks
    overdue_tasks = (
        tasks_query
        .filter(and_(
            Task.due_date < datetime.utcnow().date(),
            Task.status.in_(['todo', 'in_progress', 'review'])
        ))
        .count()
    )

    # Get tasks by status
    tasks_by_status = (
        tasks_query
        .with_entities(
            Task.status,
            func.count(Task.id.distinct())
        )
        .group_by(Task.status)
        .all()
    )
    
    print("DEBUG - Tasks by status:", tasks_by_status)
    
    status_counts = []
    for status, count in tasks_by_status:
        if status:  # Ensure status is not None
            status_counts.append({
                'name': status,
                'value': count
            })
    
    print("DEBUG - Status counts:", status_counts)

    # Get tasks by priority
    tasks_by_priority = (
        tasks_query
        .with_entities(
            Task.priority,
            func.count(Task.id.distinct())
        )
        .group_by(Task.priority)
        .all()
    )
    
    priority_counts = []
    for priority, count in tasks_by_priority:
        if priority:  # Ensure priority is not None
            priority_counts.append({
                'name': priority,
                'value': count
            })

    # Get active tasks with project info
    active_tasks = (
        tasks_query
        .options(joinedload(Task.project))  # Eager load project relationship
        .filter(Task.status.in_(['todo', 'in_progress', 'review']))
        .order_by(Task.due_date.asc())
        .limit(5)
        .all()
    )

    # Get active projects
    active_projects = (
        session.query(Project)
        .filter(
            Project.status == 'active',
            Project.deleted_at.is_(None),
            or_(
                Project.owner_id == user_id,
                Project.id.in_(
                    session.query(project_members_table.c.project_id)
                    .filter(project_members_table.c.user_id == user_id)
                )
            )
        )
        .all()
    )
    print(f"DEBUG METRICS: Found {len(active_projects)} active projects raw from query.")
    if active_projects:
        print(f"DEBUG METRICS: First raw active project details - ID: {active_projects[0].id}, Name: {active_projects[0].name}, Status: {active_projects[0].status}, Owner: {active_projects[0].owner_id}")

    # Format active projects data
    active_projects_data = []
    for project in active_projects:
        active_projects_data.append({
            "id": str(project.id),
            "name": project.name,
            "description": project.description or "",
            "status": project.status,
            "endDate": project.end_date.isoformat() if project.end_date else None,
            "progress": project.progress  # Use the progress directly from the project
        })
    
    print(f"DEBUG METRICS: Formatted active_projects_data: {active_projects_data}")

    # Format active tasks for response
    formatted_active_tasks = []
    for task in active_tasks:
        formatted_active_tasks.append({
            "id": str(task.id),
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "dueDate": task.due_date.isoformat() if task.due_date else None,
            "projectId": str(task.project_id) if task.project_id else None,
            "projectName": task.project.name if task.project else None
        })

    return {
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "inProgressTasks": in_progress_tasks,
        "todoTasks": todo_tasks,
        "reviewTasks": review_tasks,
        "overdueTasks": overdue_tasks,
        "taskStatusDistribution": status_counts,
        "tasksByPriority": priority_counts,
        "activeTasks": formatted_active_tasks,
        "activeProjects": active_projects_data
    }

def get_team_metrics(days: int = 30) -> Dict:
    """Calculate team-wide metrics."""
    session = db.session
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    print("DEBUG - Fetching team metrics for all users")

    # Get all users first
    users = session.query(User).all()
    
    metrics = {
        'taskDistribution': [],
        'averageTasksPerUser': 0,
        'averageCompletionTime': 0,
        'topPerformers': []
    }

    total_tasks = 0
    for user in users:
        print(f"DEBUG - Processing user: {user.name} ({user.id})")
        
        # Get task count for this user (both assigned and owned tasks)
        user_tasks = (
            session.query(Task)
            .outerjoin(task_assignees_table)
            .filter(
                and_(
                    Task.created_at >= start_date,
                    or_(
                        Task.owner_id == user.id,
                        task_assignees_table.c.user_id == user.id
                    )
                )
            )
        )
        
        task_count = user_tasks.count()
        print(f"DEBUG - Task count for {user.name}: {task_count}")
        
        # Get task status distribution for this user
        tasks_by_status = (
            user_tasks
            .with_entities(
                Task.status,
                func.count(Task.id.distinct())
            )
            .group_by(Task.status)
            .all()
        )
        
        print(f"DEBUG - Tasks by status:", tasks_by_status)
        
        status_counts = []
        for status, count in tasks_by_status:
            if status:  # Ensure status is not None
                status_counts.append({
                    'name': status,
                    'value': count
                })
        
        print(f"DEBUG - Status distribution for {user.name}:", status_counts)
        
        metrics['taskDistribution'].append({
            'userId': str(user.id),
            'userName': user.name,
            'taskCount': task_count,
            'taskStatusDistribution': status_counts
        })
        total_tasks += task_count

    # Calculate averages
    user_count = len(users) or 1  # Avoid division by zero
    metrics['averageTasksPerUser'] = total_tasks / user_count

    print("DEBUG - Final metrics:", metrics)
    return metrics

def get_task_history(task_id: UUID) -> List[Dict]:
    """Get the history of changes for a task."""
    # This would require implementing task history tracking
    # For now, return a placeholder
    return [] 