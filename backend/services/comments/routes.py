from flask import request
from flask_restx import Namespace, Resource, fields, marshal
from flask_jwt_extended import jwt_required, current_user
from http import HTTPStatus
from uuid import UUID

from core.db import db # Changed
from .service import (
    create_comment,
    get_comments_for_project,
    get_comments_for_task,
    update_comment,
    delete_comment,
    get_comment_by_id
)
from .schemas import CommentCreate, CommentUpdate, CommentOutputPublic as CommentOutputSchema # Pydantic schema
from services.auth.schemas import UserPublic # Changed
from common.utils import pydantic_to_restx_marshallable # Changed

comments_ns = Namespace("comments", description="Comment operations for projects and tasks")

# --- RESTx Models for Marshalling --- #
user_public_restx_for_comment = comments_ns.model("UserPublicForCommentOutput", {
    "id": fields.String(required=True, description="User ID"),
    "name": fields.String(description="User name", allow_null=True), # UserPublic.name is Optional
    "email": fields.String(required=True, description="User email")
    # Other fields from UserPublic (language, role, created_at) are intentionally omitted
    # to match the UserSimpleOutput schema used in OpenAPI for comment author.
})

# Need to handle recursive model for replies in RESTx
# Define a base comment output without replies first
comment_output_base_restx = comments_ns.model("CommentOutputBase", {
    "id": fields.String(required=True, description="Comment ID", example=str(UUID("00000000-0000-0000-0000-000000000000"))),
    "text_content": fields.String(required=True, description="The content of the comment"),
    "author": fields.Nested(user_public_restx_for_comment, required=True, description="Author of the comment"),
    "project_id": fields.String(description="ID of the project this comment belongs to", example=str(UUID("00000000-0000-0000-0000-000000000000")), allow_null=True),
    "task_id": fields.String(description="ID of the task this comment belongs to", example=str(UUID("00000000-0000-0000-0000-000000000000")), allow_null=True),
    "parent_comment_id": fields.String(description="ID of the parent comment if this is a reply", example=str(UUID("00000000-0000-0000-0000-000000000000")), allow_null=True),
    "created_at": fields.DateTime(required=True, description="Timestamp of comment creation"),
    "updated_at": fields.DateTime(required=True, description="Timestamp of last update")
})

# Now define the full comment output that includes replies (recursive)
comment_output_full_restx = comments_ns.clone("CommentOutputWithReplies", comment_output_base_restx, {
    "replies": fields.List(fields.Nested(comment_output_base_restx, description="Replies to this comment")) # Initially point to base to avoid direct recursion definition error
})
# Then, patch the replies to point to the full model for true recursion
comment_output_full_restx['replies'] = fields.List(fields.Nested(comment_output_full_restx, description="Replies to this comment"))

comment_list_restx = fields.List(fields.Nested(comment_output_full_restx))

comment_input_restx = comments_ns.model("CommentInput", {
    "text_content": fields.String(required=True, description="Content of the comment", min_length=1),
    "parent_comment_id": fields.String(description="ID of the parent comment for a reply", example=str(UUID("00000000-0000-0000-0000-000000000000")))
})

comment_update_restx = comments_ns.model("CommentUpdateInput", {
    "text_content": fields.String(description="New content for the comment", min_length=1)
})

# --- Project Comments Endpoints --- #
@comments_ns.route("/project/<uuid:project_id>/comments")
@comments_ns.param("project_id", "The ID of the project")
class ProjectCommentList(Resource):
    @jwt_required()
    @comments_ns.marshal_list_with(comment_output_full_restx)
    def get(self, project_id):
        """List all top-level comments for a project."""
        comments = get_comments_for_project(db.session, str(project_id))
        return comments, HTTPStatus.OK

    @jwt_required()
    @comments_ns.expect(comment_input_restx, validate=True)
    @comments_ns.marshal_with(comment_output_full_restx, code=HTTPStatus.CREATED)
    def post(self, project_id):
        """Create a new comment for a project."""
        data = request.json
        comment_in = CommentCreate(
            text_content=data['text_content'],
            project_id=UUID(str(project_id)),
            parent_comment_id=UUID(data['parent_comment_id']) if data.get('parent_comment_id') else None
        )
        comment = create_comment(db.session, comment_in, current_user.id)
        if comment:
            return comment, HTTPStatus.CREATED
        return {"message": "Failed to create comment or invalid input"}, HTTPStatus.BAD_REQUEST

# --- Task Comments Endpoints --- #
@comments_ns.route("/task/<uuid:task_id>/comments")
@comments_ns.param("task_id", "The ID of the task")
class TaskCommentList(Resource):
    @jwt_required()
    @comments_ns.marshal_list_with(comment_output_full_restx)
    def get(self, task_id):
        """List all top-level comments for a task."""
        comments = get_comments_for_task(db.session, str(task_id))
        return comments, HTTPStatus.OK

    @jwt_required()
    @comments_ns.expect(comment_input_restx, validate=True)
    @comments_ns.marshal_with(comment_output_full_restx, code=HTTPStatus.CREATED)
    def post(self, task_id):
        """Create a new comment for a task."""
        data = request.json
        comment_in = CommentCreate(
            text_content=data['text_content'],
            task_id=UUID(str(task_id)),
            parent_comment_id=UUID(data['parent_comment_id']) if data.get('parent_comment_id') else None
        )
        comment = create_comment(db.session, comment_in, current_user.id)
        if comment:
            return comment, HTTPStatus.CREATED
        return {"message": "Failed to create comment or invalid input"}, HTTPStatus.BAD_REQUEST

# --- Individual Comment Endpoints --- #
@comments_ns.route("/<uuid:comment_id>")
@comments_ns.param("comment_id", "The ID of the comment")
class CommentItem(Resource):
    @jwt_required()
    @comments_ns.marshal_with(comment_output_full_restx)
    def get(self, comment_id):
        """Get a specific comment by its ID (primarily for testing/direct access)."""
        comment = get_comment_by_id(db.session, str(comment_id))
        if not comment:
            return {"message": "Comment not found"}, HTTPStatus.NOT_FOUND
        return comment, HTTPStatus.OK

    @jwt_required()
    @comments_ns.expect(comment_update_restx, validate=True)
    @comments_ns.marshal_with(comment_output_full_restx)
    def put(self, comment_id):
        """Update an existing comment."""
        data = request.json
        comment_in = CommentUpdate(text_content=data.get('text_content'))
        comment = update_comment(db.session, str(comment_id), comment_in, current_user.id)
        if comment:
            return comment, HTTPStatus.OK
        # Consider different error codes for not found vs. not authorized vs. bad input
        return {"message": "Failed to update comment, comment not found, or not authorized"}, HTTPStatus.BAD_REQUEST 

    @jwt_required()
    @comments_ns.response(HTTPStatus.NO_CONTENT, "Comment deleted successfully")
    def delete(self, comment_id):
        """Delete a comment."""
        if delete_comment(db.session, str(comment_id), current_user.id):
            return "", HTTPStatus.NO_CONTENT
        return {"message": "Failed to delete comment, comment not found, or not authorized"}, HTTPStatus.BAD_REQUEST 