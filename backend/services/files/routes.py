# Flask-RESTX Namespace and Resource definitions for file/folder APIs will go here 

from flask import request, abort, send_file
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from http import HTTPStatus
import uuid
from werkzeug.datastructures import FileStorage
import os

from . import service
from .models import File, Folder
from core.db import db

# Create namespace
files_ns = Namespace('files', description='File management operations')

# API Models
folder_output_model = files_ns.model('FolderOutput', {
    'id': fields.String(required=True, description='Folder ID'),
    'name': fields.String(required=True, description='Folder name'),
    'description': fields.String(description='Folder description'),
    'parent_id': fields.String(description='Parent folder ID'),
    'project_id': fields.String(description='Project ID'),
    'owner_id': fields.String(required=True, description='Owner ID'),
    'created_at': fields.DateTime(required=True),
    'updated_at': fields.DateTime(required=True)
})

file_output_model = files_ns.model('FileOutput', {
    'id': fields.String(required=True, description='File ID'),
    'name': fields.String(required=True, description='File name'),
    'description': fields.String(description='File description'),
    'mime_type': fields.String(required=True, description='MIME type'),
    'size': fields.Integer(required=True, description='File size in bytes'),
    'folder_id': fields.String(description='Folder ID'),
    'project_id': fields.String(description='Project ID'),
    'owner_id': fields.String(required=True, description='Owner ID'),
    'created_at': fields.DateTime(required=True),
    'updated_at': fields.DateTime(required=True),
    'access_count': fields.Integer(required=True)
})

folder_create_model = files_ns.model('FolderCreate', {
    'name': fields.String(required=True, description='Folder name'),
    'description': fields.String(description='Folder description'),
    'parent_id': fields.String(description='Parent folder ID'),
    'project_id': fields.String(description='Project ID')
})

# Upload parser
upload_parser = files_ns.parser()
upload_parser.add_argument('file', location='files', type=FileStorage, required=True)
upload_parser.add_argument('folder_id', type=str, required=False)
upload_parser.add_argument('project_id', type=str, required=False)
upload_parser.add_argument('description', type=str, required=False)

@files_ns.route('/folders')
class FolderList(Resource):
    @jwt_required()
    @files_ns.marshal_list_with(folder_output_model)
    def get(self):
        """List all folders accessible to the current user"""
        current_user_id = uuid.UUID(get_jwt_identity())
        folders = Folder.query.filter_by(owner_id=current_user_id, deleted_at=None).all()
        return folders

    @jwt_required()
    @files_ns.expect(folder_create_model)
    @files_ns.marshal_with(folder_output_model)
    def post(self):
        """Create a new folder"""
        current_user_id = uuid.UUID(get_jwt_identity())
        data = request.json

        folder = Folder(
            name=data['name'],
            description=data.get('description'),
            parent_id=uuid.UUID(data['parent_id']) if data.get('parent_id') else None,
            project_id=uuid.UUID(data['project_id']) if data.get('project_id') else None,
            owner_id=current_user_id
        )

        db.session.add(folder)
        db.session.commit()
        return folder

@files_ns.route('/upload')
class FileUpload(Resource):
    @jwt_required()
    @files_ns.expect(upload_parser)
    @files_ns.marshal_with(file_output_model)
    def post(self):
        """Upload a new file"""
        current_user_id = uuid.UUID(get_jwt_identity())
        args = upload_parser.parse_args()
        uploaded_file = args['file']
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # Save file
        file_path = os.path.join(upload_dir, uploaded_file.filename)
        uploaded_file.save(file_path)
        
        # Create file record
        file = File(
            name=uploaded_file.filename,
            description=args.get('description'),
            mime_type=uploaded_file.content_type,
            size=os.path.getsize(file_path),
            storage_path=file_path,
            folder_id=uuid.UUID(args['folder_id']) if args.get('folder_id') else None,
            project_id=uuid.UUID(args['project_id']) if args.get('project_id') else None,
            owner_id=current_user_id
        )
        
        db.session.add(file)
        db.session.commit()
        return file

@files_ns.route('/folders/<uuid:folder_id>')
class FolderDetail(Resource):
    @jwt_required()
    @files_ns.marshal_with(folder_output_model)
    def get(self, folder_id):
        """Get folder details"""
        current_user_id = uuid.UUID(get_jwt_identity())
        folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first_or_404()
        
        # Check permissions
        if folder.owner_id != current_user_id:
            abort(HTTPStatus.FORBIDDEN, "You don't have permission to access this folder")
        
        return folder

@files_ns.route('/folders/<uuid:folder_id>/files')
class FolderFiles(Resource):
    @jwt_required()
    @files_ns.marshal_list_with(file_output_model)
    def get(self, folder_id):
        """List all files in a folder"""
        current_user_id = uuid.UUID(get_jwt_identity())
        folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first_or_404()
        
        # Check permissions
        if folder.owner_id != current_user_id:
            abort(HTTPStatus.FORBIDDEN, "You don't have permission to access this folder")
        
        return folder.files 