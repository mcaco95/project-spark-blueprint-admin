from typing import List, TypeVar, Generic

T = TypeVar('T')

class PaginatedResponse(Generic[T]):
    def __init__(self, items: List[T], total: int, page: int, per_page: int):
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page
        self.pages = (total + per_page - 1) // per_page if per_page > 0 else 0 