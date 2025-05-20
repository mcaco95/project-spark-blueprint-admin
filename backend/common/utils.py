from flask_restx import fields
from pydantic import BaseModel # Needed for type checking if isinstance(pydantic_obj, BaseModel)
from uuid import UUID # For type hints, though not strictly used in current logic
from datetime import datetime # For type hints, though not strictly used in current logic

def pydantic_to_restx_marshallable(pydantic_obj, restx_model_fields):
    """
    Recursively converts a Pydantic model instance (or list of instances)
    to a dictionary that can be marshalled by Flask-RESTx, respecting the structure
    defined by restx_model_fields (which is a Flask-RESTx model definition dict).
    
    :param pydantic_obj: The Pydantic model instance or list of instances.
    :param restx_model_fields: The Flask-RESTx model (fields definition dict) to marshal with.
    :return: A dictionary or list of dictionaries ready for Flask-RESTx marshalling.
    """
    if pydantic_obj is None:
        return None
    
    response_data = {}
    if isinstance(pydantic_obj, list):
        # If it's a list, process each item
        return [pydantic_to_restx_marshallable(item, restx_model_fields) for item in pydantic_obj]

    # Use model_dump() if available (Pydantic v2), otherwise assume it's already a dict or compatible.
    # For simplicity here, assuming Pydantic objects will have model_dump.
    # A more robust version might check for specific Pydantic versions or duck-type.
    obj_dict = pydantic_obj.model_dump(by_alias=True) if hasattr(pydantic_obj, 'model_dump') else pydantic_obj
    
    # Check if restx_model_fields itself is a model (has .fields attribute) or just a dict of fields
    actual_fields_dict = restx_model_fields.fields if hasattr(restx_model_fields, 'fields') else restx_model_fields

    for key, field_type in actual_fields_dict.items():
        if key in obj_dict:
            value = obj_dict[key]
            if isinstance(field_type, fields.Nested) and value is not None:
                # For nested fields, recursively call with the nested model's fields
                nested_model_definition = field_type.model # This is the nested RESTx model
                if isinstance(value, list): # Should ideally not happen if schema matches
                    response_data[key] = [pydantic_to_restx_marshallable(item, nested_model_definition) for item in value]
                else:
                    response_data[key] = pydantic_to_restx_marshallable(value, nested_model_definition)
            elif isinstance(field_type, fields.List) and isinstance(field_type.container, fields.Nested) and value is not None:
                # For lists of nested fields
                nested_model_definition = field_type.container.model # This is the nested RESTx model
                response_data[key] = [pydantic_to_restx_marshallable(item, nested_model_definition) for item in value]
            elif value is not None:
                # For simple fields, assign the value directly
                response_data[key] = value
            elif hasattr(field_type, 'allow_null') and field_type.allow_null:
                 response_data[key] = None
        elif hasattr(field_type, 'required') and field_type.required and not (hasattr(field_type, 'allow_null') and field_type.allow_null):
            # Handle required fields that might be missing in source, if default/logic allows
            # For now, this implies a missing required field if not found in obj_dict and no allow_null.
            # Depending on strictness, could raise error or assign default if field_type has one.
            pass # Or response_data[key] = field_type.default if it exists
                 
    return response_data 