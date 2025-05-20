# Project related API routes will go here 
from flask import request, abort # Add abort here
from flask_restx import Namespace, Resource, fields, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from http import HTTPStatus
import uuid # For UUID type hint and conversion

from services.auth.schemas import UserPublic
from . import service
from . import schemas
from common.utils import pydantic_to_restx_marshallable # Changed

# Define the namespace for projects
projects_ns = Namespace('projects', description='Project management operations')

# --- API Models for Swagger (Request/Response marshalling) --- 
# Reusing Pydantic schemas for validation, but defining API models for flask-restx documentation and marshalling
# This helps in clearly defining the API contract in Swagger.

user_simple_api_model = projects_ns.model('UserSimpleOutput', {
    'id': fields.String(required=True, description='User ID', example=str(uuid.uuid4())),
    'name': fields.String(description='User name'),
    'email': fields.String(required=True, description='User email')
})

project_member_api_model = projects_ns.model('ProjectMemberOutput', {
    'user_id': fields.String(required=True, description='Member User ID'),
    'role_in_project': fields.String(required=True, description='Role in project', enum=[e.value for e in schemas.ProjectRoleEnum]),
    'user': fields.Nested(user_simple_api_model, required=True, description='Member user details'),
    'added_at': fields.DateTime(required=True, description='Timestamp when member was added')
})

project_output_model = projects_ns.model('ProjectOutput', {
    'id': fields.String(required=True, description='Project ID'),
    'name': fields.String(required=True, description='Project name'),
    'description': fields.String(description='Project description'),
    'status': fields.String(required=True, description='Project status', enum=[e.value for e in schemas.ProjectStatusEnum]),
    'priority': fields.String(required=True, description='Project priority', enum=[e.value for e in schemas.ProjectPriorityEnum]),
    'start_date': fields.Date(description='Project start date'),
    'due_date': fields.Date(description='Project due date'),
    'parent_id': fields.String(description='Parent project ID', allow_null=True),
    'owner_id': fields.String(required=True, description='Project owner ID'),
    'progress': fields.Integer(required=True, description='Project progress percentage (0-100)'),
    'createdBy': fields.String(required=True, description='Name of the user who created the project'),
    'owner': fields.Nested(user_simple_api_model, required=True, description='Project owner details'),
    'members': fields.List(fields.Nested(user_simple_api_model), description='List of project members (UserSimpleOutput)'),
    'created_at': fields.DateTime(required=True, description='Timestamp of creation'),
    'updated_at': fields.DateTime(description='Timestamp of last update'),
    # 'members': fields.List(fields.Nested(project_member_api_model), description='List of project members') # We will handle this in a separate endpoint
})

project_creation_model = projects_ns.model('ProjectCreationInput', {
    'name': fields.String(required=True, description='Project name', min_length=1, max_length=255),
    'description': fields.String(description='Project description'),
    'status': fields.String(description='Project status', enum=[e.value for e in schemas.ProjectStatusEnum], default=schemas.ProjectStatusEnum.planning.value),
    'priority': fields.String(description='Project priority', enum=[e.value for e in schemas.ProjectPriorityEnum], default=schemas.ProjectPriorityEnum.medium.value),
    'start_date': fields.Date(description='Project start date'),
    'end_date': fields.Date(description='Project end date'),
    'parent_id': fields.String(description='Parent project ID', allow_null=True),
    'progress': fields.Integer(description='Project progress percentage (0-100)', default=0, min=0, max=100)
})

project_update_model = projects_ns.model('ProjectUpdateInput', {
    'name': fields.String(description='Project name', min_length=1, max_length=255),
    'description': fields.String(description='Project description'),
    'status': fields.String(description='Project status', enum=[e.value for e in schemas.ProjectStatusEnum]),
    'priority': fields.String(description='Project priority', enum=[e.value for e in schemas.ProjectPriorityEnum]),
    'start_date': fields.Date(description='Project start date'),
    'end_date': fields.Date(description='Project end date'),
    'parent_id': fields.String(description='Parent project ID', allow_null=True),
    'progress': fields.Integer(description='Project progress percentage (0-100)', min=0, max=100)
})

add_member_model = projects_ns.model('AddProjectMemberInput', {
    'user_id': fields.String(required=True, description='ID of the user to add as a member'),
    'role_in_project': fields.String(required=True, description='Role for the user in this project', enum=[e.value for e in schemas.ProjectRoleEnum], default=schemas.ProjectRoleEnum.viewer.value)
})

# --- Helper function to convert Pydantic model to Flask-RESTx compatible dict for marshalling --- (This local definition is removed)
# def pydantic_to_restx_marshallable(pydantic_obj, restx_model_fields):
#    # ... (old content) ...

# --- Project Routes ---
@projects_ns.route('/')
class ProjectList(Resource):
    @jwt_required()
    @projects_ns.marshal_list_with(project_output_model)
    def get(self):
        """List all projects for the current user (owner or member)."""
        current_user_id_str = get_jwt_identity()
        print(f"[PROJECTS GET] JWT Identity (current_user_id_str): {current_user_id_str}") # DEBUG PRINT
        current_user_id = uuid.UUID(current_user_id_str)
        projects_db = service.get_projects_for_user(user_id=current_user_id)
        
        # Convert DB objects to Pydantic ProjectPublic schemas
        projects_public_list = [schemas.ProjectPublic.from_orm(p_db) for p_db in projects_db]
            
        # Flask-RESTx @marshal_list_with will handle converting these Pydantic objects (or their dicts)
        # using project_output_model. The key is that project_output_model was defined 
        # in a way that pydantic_to_restx_marshallable (when defining the model) or direct field mapping can work.
        # For direct marshalling by @marshal_list_with from Pydantic, ensure Pydantic objects are returned.
        # If pydantic_to_restx_marshallable was used to *define* project_output_model itself from a Pydantic schema,
        # then returning Pydantic objects here is fine.
        # The current setup calls pydantic_to_restx_marshallable in GET/POST manually before returning.
        # Let's adjust to return Pydantic objects directly and rely on @marshal_with.
        return projects_public_list, HTTPStatus.OK

    @jwt_required()
    @projects_ns.expect(project_creation_model, validate=True)
    @projects_ns.marshal_with(project_output_model, code=HTTPStatus.CREATED)
    def post(self):
        """Create a new project."""
        current_user_id_str = get_jwt_identity()
        print(f"[PROJECTS POST] Raw JWT Identity: {current_user_id_str}") # Debug print
        print(f"[PROJECTS POST] JWT Identity type: {type(current_user_id_str)}") # Debug print
        
        try:
            current_user_id = uuid.UUID(current_user_id_str)
            print(f"[PROJECTS POST] Successfully converted to UUID: {current_user_id}") # Debug print
        except ValueError as e:
            print(f"[PROJECTS POST] Failed to convert to UUID: {e}") # Debug print
            raise

        try:
            project_data = schemas.ProjectCreate(**request.json)
        except Exception as e: # Pydantic validation error
            abort(HTTPStatus.BAD_REQUEST, f"Input payload validation failed: {e}")

        try:
            created_project_db = service.create_project(project_in=project_data, owner_id=current_user_id)
            project_public = schemas.ProjectPublic.from_orm(created_project_db)
            return project_public, HTTPStatus.CREATED
        except ValueError as e:
            abort(HTTPStatus.BAD_REQUEST, str(e))
        except Exception as e:
            # Log the exception e
            abort(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not create project")

@projects_ns.route('/<uuid:project_id>')
@projects_ns.response(HTTPStatus.NOT_FOUND, 'Project not found or no access.')
@projects_ns.response(HTTPStatus.UNAUTHORIZED, 'Authentication required.')
class ProjectDetail(Resource):
    @jwt_required()
    @projects_ns.marshal_with(project_output_model)
    def get(self, project_id: uuid.UUID):
        """Get a specific project by ID."""
        current_user_id_str = get_jwt_identity()
        current_user_id = uuid.UUID(current_user_id_str)
        project_db = service.get_project_by_id(project_id=project_id, current_user_id=current_user_id)
        if not project_db:
            abort(HTTPStatus.NOT_FOUND, "Project not found or no access to this project.")
        project_public = schemas.ProjectPublic.from_orm(project_db)
        return project_public, HTTPStatus.OK

    @jwt_required()
    # @projects_ns.expect(project_update_model, validate=True) # Temporarily remove validate=True for diagnostics
    @projects_ns.expect(project_update_model) # Keep for Swagger, but no strict validation by Flask-RESTX
    @projects_ns.marshal_with(project_output_model)
    def put(self, project_id: uuid.UUID):
        """Update an existing project."""
        current_user_id_str = get_jwt_identity()
        current_user_id = uuid.UUID(current_user_id_str)

        try:
            update_data = schemas.ProjectUpdate(**request.json)
        except Exception as e: # Pydantic validation error
             abort(HTTPStatus.BAD_REQUEST, f"Input payload validation failed: {e}")

        updated_project_db = service.update_project(project_id=project_id, project_in=update_data, current_user_id=current_user_id)
        if not updated_project_db:
            # Service layer returns None if not found, or user not authorized to update
            # A more granular check might be needed here if you want to distinguish 403 from 404
            abort(HTTPStatus.NOT_FOUND, "Project not found or user not authorized to update.")
        project_public = schemas.ProjectPublic.from_orm(updated_project_db)
        return project_public, HTTPStatus.OK

    @jwt_required()
    @projects_ns.response(HTTPStatus.NO_CONTENT, 'Project deleted successfully.')
    @projects_ns.response(HTTPStatus.FORBIDDEN, 'Only project owner can delete.')
    def delete(self, project_id: uuid.UUID):
        """Delete a project (soft delete)."""
        current_user_id_str = get_jwt_identity()
        current_user_id = uuid.UUID(current_user_id_str)
        
        # First, check if user can even see the project to give a 404 if not.
        project_check = service.get_project_by_id(project_id=project_id, current_user_id=current_user_id)
        if not project_check:
            abort(HTTPStatus.NOT_FOUND, "Project not found or no access.")
        
        # Now check if current user is the owner for deletion rights
        if project_check.owner_id != current_user_id:
            abort(HTTPStatus.FORBIDDEN, "Only the project owner can delete this project.")

        if service.delete_project(project_id=project_id, current_user_id=current_user_id):
            return '', HTTPStatus.NO_CONTENT
        else:
            # This case should ideally be caught by the owner check above, 
            # but as a fallback from the service layer returning False for other reasons:
            abort(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not delete project.")

# --- Project Member Routes ---
@projects_ns.route('/<uuid:project_id>/members')
@projects_ns.response(HTTPStatus.NOT_FOUND, 'Project not found or no access.')
class ProjectMemberList(Resource):
    @jwt_required()
    @projects_ns.marshal_list_with(project_member_api_model)
    def get(self, project_id: uuid.UUID):
        """List all members of a project."""
        current_user_id_str = get_jwt_identity()
        current_user_id = uuid.UUID(current_user_id_str)
        members = service.get_project_members(project_id=project_id, current_user_id=current_user_id)
        # service.get_project_members already ensures access and returns List[schemas.ProjectMemberPublic]
        # which needs to be converted for Flask-RESTx marshalling
        if members is None: # Should not happen if service.get_project_members is called after get_project_by_id
             abort(HTTPStatus.NOT_FOUND, "Project not found or no access to view members.")
        return members, HTTPStatus.OK

    @jwt_required()
    @projects_ns.expect(add_member_model, validate=True)
    @projects_ns.marshal_with(project_output_model) # Returns the updated project data
    @projects_ns.response(HTTPStatus.BAD_REQUEST, 'User to add not found or invalid role.')
    @projects_ns.response(HTTPStatus.FORBIDDEN, 'Not authorized to add members.')
    def post(self, project_id: uuid.UUID):
        """Add a member to a project."""
        current_user_id_str = get_jwt_identity()
        current_user_id = uuid.UUID(current_user_id_str)
        
        try:
            member_data = schemas.AddProjectMemberRequest(**request.json)
        except Exception as e:
            abort(HTTPStatus.BAD_REQUEST, f"Input payload validation failed: {e}")

        try:
            updated_project_db = service.add_member_to_project(
                project_id=project_id, 
                user_id_to_add=member_data.user_id, 
                role_in_project=member_data.role_in_project, 
                current_user_id=current_user_id
            )
            if not updated_project_db:
                 # This could be due to project not found, user not found, or auth failure from service layer
                 # Service layer needs to raise specific exceptions or route needs more specific checks
                abort(HTTPStatus.FORBIDDEN, "Could not add member. Project not found, user not found, or not authorized.")
            project_public = schemas.ProjectPublic.from_orm(updated_project_db)
            return project_public, HTTPStatus.OK
        except ValueError as e: # e.g. user to add not found
            abort(HTTPStatus.BAD_REQUEST, str(e))
        except Exception as e: # Catch-all for other unexpected errors
            # Log error e
            abort(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not add member to project.")

@projects_ns.route('/<uuid:project_id>/members/<uuid:user_id>')
@projects_ns.response(HTTPStatus.NOT_FOUND, 'Project or user not found, or user is not a member.')
@projects_ns.response(HTTPStatus.FORBIDDEN, 'Not authorized to remove this member.')
class ProjectMemberDetail(Resource):
    @jwt_required()
    @projects_ns.response(HTTPStatus.NO_CONTENT, 'Member removed successfully.')
    def delete(self, project_id: uuid.UUID, user_id: uuid.UUID):
        """Remove a member from a project."""
        current_user_id_str = get_jwt_identity()
        current_user_id = uuid.UUID(current_user_id_str)
        
        updated_project_db = service.remove_member_from_project(
            project_id=project_id, 
            user_id_to_remove=user_id, 
            current_user_id=current_user_id
        )
        
        if not updated_project_db:
            # Could be: project not found, current user no access, user_to_remove not found,
            # user_to_remove not a member, or current_user not authorized to remove.
            # Service layer needs to be more specific or we add checks here.
            # For now, a generic response. Consider checking if user_to_remove is owner for a more specific 403.
            project_check = service.get_project_by_id(project_id, current_user_id)
            if not project_check:
                abort(HTTPStatus.NOT_FOUND, "Project not found or no access.")
            if project_check.owner_id == user_id and project_check.owner_id == current_user_id:
                abort(HTTPStatus.FORBIDDEN, "Project owner cannot remove themselves via this endpoint.") 
            if project_check.owner_id == user_id and project_check.owner_id != current_user_id:
                 abort(HTTPStatus.FORBIDDEN, "Only the project owner can remove themselves (or transfer ownership). This member is the owner.")
            # Add more checks if user_id is not a member, or if current_user is not owner/editor
            abort(HTTPStatus.FORBIDDEN, "Could not remove member. Ensure project and user exist, user is a member, and you have permission.")

        return '', HTTPStatus.NO_CONTENT 