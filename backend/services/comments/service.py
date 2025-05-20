from typing import List, Optional
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_
import logging

from .models import Comment
from .schemas import CommentCreate, CommentUpdate
from backend.services.projects.models import Project # For permission checks
from backend.services.tasks.models import Task # For permission checks

logger = logging.getLogger(__name__)

def create_comment(
    db: Session, 
    comment_in: CommentCreate, 
    author_id: str
) -> Optional[Comment]:
    try:
        if not comment_in.project_id and not comment_in.task_id:
            logger.warning("Comment creation failed: project_id or task_id must be provided.")
            return None
        if comment_in.project_id and comment_in.task_id:
            logger.warning("Comment creation failed: Cannot link comment to both project and task.")
            return None

        db_comment = Comment(**comment_in.model_dump(), author_id=author_id)
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        logger.info(f"Comment created with id {db_comment.id}")
        return db_comment
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating comment: {e}")
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred while creating comment: {e}")
        return None

def get_comments_for_project(db: Session, project_id: str) -> List[Comment]:
    try:
        return (
            db.query(Comment)
            .filter(Comment.project_id == project_id, Comment.parent_comment_id == None) # Top-level comments
            .options(selectinload(Comment.author), selectinload(Comment.replies).selectinload(Comment.author)) # Eager load author and replies with their authors
            .order_by(Comment.created_at.asc())
            .all()
        )
    except Exception as e:
        logger.error(f"Error fetching comments for project {project_id}: {e}")
        return []

def get_comments_for_task(db: Session, task_id: str) -> List[Comment]:
    try:
        return (
            db.query(Comment)
            .filter(Comment.task_id == task_id, Comment.parent_comment_id == None) # Top-level comments
            .options(selectinload(Comment.author), selectinload(Comment.replies).selectinload(Comment.author))
            .order_by(Comment.created_at.asc())
            .all()
        )
    except Exception as e:
        logger.error(f"Error fetching comments for task {task_id}: {e}")
        return []

def get_comment_by_id(db: Session, comment_id: str) -> Optional[Comment]:
    try:
        return db.query(Comment).filter(Comment.id == comment_id).first()
    except Exception as e:
        logger.error(f"Error fetching comment by id {comment_id}: {e}")
        return None

def update_comment(
    db: Session, 
    comment_id: str, 
    comment_in: CommentUpdate, 
    user_id: str # For permission check
) -> Optional[Comment]:
    db_comment = get_comment_by_id(db, comment_id)
    if not db_comment:
        logger.warning(f"Update comment failed: Comment {comment_id} not found.")
        return None

    if str(db_comment.author_id) != user_id:
        logger.warning(f"User {user_id} not authorized to update comment {comment_id}.")
        # Potentially add more sophisticated permission checks here (e.g., admin/project owner)
        return None 

    try:
        update_data = comment_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_comment, key, value)
        
        db.add(db_comment) # or db.merge(db_comment)
        db.commit()
        db.refresh(db_comment)
        logger.info(f"Comment {comment_id} updated successfully.")
        return db_comment
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating comment {comment_id}: {e}")
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating comment {comment_id}: {e}")
        return None

def delete_comment(db: Session, comment_id: str, user_id: str) -> bool:
    db_comment = get_comment_by_id(db, comment_id)
    if not db_comment:
        logger.warning(f"Delete comment failed: Comment {comment_id} not found.")
        return False

    # Basic permission: only author can delete
    # More complex logic (admin, project owner) could be added here.
    if str(db_comment.author_id) != user_id:
        # For now, let's allow project/task owners to delete comments on their items
        is_authorized = False
        if db_comment.project_id:
            project = db.query(Project).filter(Project.id == db_comment.project_id).first()
            if project and str(project.owner_id) == user_id:
                is_authorized = True
        elif db_comment.task_id:
            task = db.query(Task).filter(Task.id == db_comment.task_id).first()
            if task and str(task.owner_id) == user_id:
                is_authorized = True
        
        if not is_authorized:
            logger.warning(f"User {user_id} not authorized to delete comment {comment_id}.")
            return False

    try:
        db.delete(db_comment)
        db.commit()
        logger.info(f"Comment {comment_id} deleted successfully by user {user_id}.")
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting comment {comment_id}: {e}")
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting comment {comment_id}: {e}")
        return False 