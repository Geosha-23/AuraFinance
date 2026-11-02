import os
import json
import uuid
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings

# Global DB state
_use_mongo = False
_mongo_client = None
_db = None

# Fallback store directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
LOCAL_STORE_FILE = os.path.join(DATA_DIR, "finance_store.json")

# In-memory document store structure with JSON persistence
class LocalAsyncCollection:
    def __init__(self, name: str, parent_db):
        self.name = name
        self.parent_db = parent_db

    def _matches_filter(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for key, value in query.items():
            if key in ["_id", "id"]:
                doc_id = str(doc.get("_id") or doc.get("id") or "")
                if doc_id != str(value):
                    return False
            elif key == "$or":
                if not any(self._matches_filter(doc, subq) for subq in value):
                    return False
            elif isinstance(value, dict):
                # Simple operator checks
                val_in_doc = doc.get(key)
                for op, op_val in value.items():
                    if op == "$gte" and not (val_in_doc is not None and val_in_doc >= op_val):
                        return False
                    elif op == "$lte" and not (val_in_doc is not None and val_in_doc <= op_val):
                        return False
                    elif op == "$gt" and not (val_in_doc is not None and val_in_doc > op_val):
                        return False
                    elif op == "$lt" and not (val_in_doc is not None and val_in_doc < op_val):
                        return False
                    elif op == "$in" and val_in_doc not in op_val:
                        return False
                    elif op == "$ne" and val_in_doc == op_val:
                        return False
            elif doc.get(key) != value:
                return False
        return True

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        else:
            doc_copy["_id"] = str(doc_copy["_id"])
        data = self.parent_db.get_collection_data(self.name)
        data.append(doc_copy)
        self.parent_db.save()
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]):
        inserted_ids = []
        data = self.parent_db.get_collection_data(self.name)
        for doc in documents:
            doc_copy = dict(doc)
            if "_id" not in doc_copy:
                doc_copy["_id"] = str(uuid.uuid4())
            else:
                doc_copy["_id"] = str(doc_copy["_id"])
            data.append(doc_copy)
            inserted_ids.append(doc_copy["_id"])
        self.parent_db.save()
        
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    async def find_one(self, query: Dict[str, Any]):
        data = self.parent_db.get_collection_data(self.name)
        for doc in data:
            if self._matches_filter(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        data = self.parent_db.get_collection_data(self.name)
        matched = []
        for doc in data:
            if self._matches_filter(doc, query or {}):
                matched.append(dict(doc))
        
        class AsyncCursor:
            def __init__(self, items):
                self._items = items
                self._sort_key = None
                self._sort_dir = 1
                self._limit = None
                self._skip = 0

            def sort(self, key_or_list, direction=1):
                if isinstance(key_or_list, list):
                    key, direction = key_or_list[0]
                else:
                    key = key_or_list
                self._sort_key = key
                self._sort_dir = direction
                return self

            def limit(self, count: int):
                self._limit = count
                return self

            def skip(self, count: int):
                self._skip = count
                return self

            async def to_list(self, length: Optional[int] = None):
                res = list(self._items)
                if self._sort_key:
                    res.sort(key=lambda x: x.get(self._sort_key, ""), reverse=(self._sort_dir == -1))
                if self._skip:
                    res = res[self._skip:]
                if length is not None:
                    res = res[:length]
                elif self._limit is not None:
                    res = res[:self._limit]
                return res

            def __aiter__(self):
                self._iter = iter(self._items)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return AsyncCursor(matched)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        data = self.parent_db.get_collection_data(self.name)
        modified = 0
        for doc in data:
            if self._matches_filter(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                    modified = 1
                    break
        if modified:
            self.parent_db.save()
            
        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        return UpdateResult(modified)

    async def delete_one(self, query: Dict[str, Any]):
        data = self.parent_db.get_collection_data(self.name)
        deleted = 0
        for i, doc in enumerate(data):
            if self._matches_filter(doc, query):
                del data[i]
                deleted = 1
                break
        if deleted:
            self.parent_db.save()
            
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted)

    async def delete_many(self, query: Dict[str, Any]):
        data = self.parent_db.get_collection_data(self.name)
        initial_len = len(data)
        self.parent_db.store[self.name] = [d for d in data if not self._matches_filter(d, query)]
        deleted = initial_len - len(self.parent_db.store[self.name])
        if deleted > 0:
            self.parent_db.save()
            
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted)

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        data = self.parent_db.get_collection_data(self.name)
        if not query:
            return len(data)
        return sum(1 for doc in data if self._matches_filter(doc, query))


class LocalAsyncDatabase:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.store: Dict[str, List[Dict[str, Any]]] = {}
        self.load()

    def load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self.store = json.load(f)
            except Exception:
                self.store = {}
        else:
            self.store = {}

    def save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.store, f, indent=2, default=str)
        except Exception as e:
            print(f"[LocalDatabase] Error saving: {e}")

    def get_collection_data(self, name: str) -> List[Dict[str, Any]]:
        if name not in self.store:
            self.store[name] = []
        return self.store[name]

    def __getitem__(self, name: str) -> LocalAsyncCollection:
        return LocalAsyncCollection(name, self)

    def get_collection(self, name: str) -> LocalAsyncCollection:
        return LocalAsyncCollection(name, self)


async def init_db():
    global _use_mongo, _mongo_client, _db
    try:
        # pyrefly: ignore[missing-import]
        from motor.motor_asyncio import AsyncIOMotorClient
        # pyrefly: ignore[missing-import]
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Verify connection with ping
        await client.admin.command('ping')
        _mongo_client = client
        _db = client[settings.DATABASE_NAME]
        _use_mongo = True
        print(f"Connected successfully to MongoDB at {settings.MONGODB_URI}")
    except Exception as e:
        print(f"MongoDB not reachable ({e}). Initializing high-performance local persistent store: {LOCAL_STORE_FILE}")
        _use_mongo = False
        _db = LocalAsyncDatabase(LOCAL_STORE_FILE)


def get_database():
    global _db
    if _db is None:
        _db = LocalAsyncDatabase(LOCAL_STORE_FILE)
    return _db


# Convenience accessors for collections
def get_users_collection():
    return get_database()["users"]

def get_transactions_collection():
    return get_database()["transactions"]

def get_budgets_collection():
    return get_database()["budgets"]

def get_alerts_collection():
    return get_database()["alerts"]
