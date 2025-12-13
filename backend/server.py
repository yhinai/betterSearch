"""
Neural Bridge - Graphon.ai Integration Server
FastAPI backend for betterSearch knowledge graph functionality
"""

import os
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()  # Load from backend/.env
except ImportError:
    pass  # python-dotenv not installed, use system env vars

app = FastAPI(
    title="Neural Bridge",
    description="betterSearch - Graphon.ai Integration Server",
    version="1.0.0"
)

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key from environment variable (required)
API_KEY = os.getenv("GRAPHON_API_KEY")
if not API_KEY:
    print("⚠️  WARNING: GRAPHON_API_KEY not set. Set it in backend/.env or as environment variable.")
    API_KEY = ""  # Will fail gracefully when used

# Store group_id in memory (for hackathon - in production use DB)
CURRENT_GROUP_ID: Optional[str] = None

# Pydantic models for responses
class IngestResponse(BaseModel):
    status: str
    group_id: Optional[str] = None
    message: str
    files_processed: int = 0

class Source(BaseModel):
    node_type: str  # 'video', 'document', 'image'
    video_name: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    pdf_name: Optional[str] = None
    page_num: Optional[int] = None
    text: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source] = []

class HealthResponse(BaseModel):
    status: str
    graphon_connected: bool
    active_group: Optional[str] = None


# Initialize Graphon client lazily
_client = None

def get_client():
    global _client
    if _client is None:
        try:
            from graphon_client import GraphonClient
            _client = GraphonClient(api_key=API_KEY)
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="graphon-client not installed. Run: pip install graphon-client"
            )
    return _client


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check server health and Graphon connection status"""
    try:
        get_client()
        return HealthResponse(
            status="healthy",
            graphon_connected=True,
            active_group=CURRENT_GROUP_ID
        )
    except Exception as e:
        return HealthResponse(
            status="degraded",
            graphon_connected=False,
            active_group=CURRENT_GROUP_ID
        )


@app.post("/ingest", response_model=IngestResponse)
async def ingest_files(files: List[UploadFile] = File(...)):
    """
    Upload and process files into Graphon Knowledge Graph.
    Accepts multiple files (PDF, images, videos).
    """
    global CURRENT_GROUP_ID
    temp_files = []
    client = get_client()
    
    try:
        # 1. Save uploaded files temporarily
        for file in files:
            temp_path = f"/tmp/graphon_{file.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append(temp_path)
        
        print(f"📤 Uploading {len(temp_files)} files to Graphon...")
        
        # 2. Upload & Process to Graphon
        file_objects = await client.upload_and_process_files(
            file_paths=temp_files,
            poll_until_complete=True
        )
        
        # 3. Filter successful uploads
        success_ids = [f.file_id for f in file_objects if f.processing_status == "SUCCESS"]
        
        if not success_ids:
            return IngestResponse(
                status="error",
                message="No files processed successfully",
                files_processed=0
            )

        # 4. Create Knowledge Graph Group
        group_name = f"betterSearch_KB_{len(success_ids)}_files"
        CURRENT_GROUP_ID = await client.create_group(
            file_ids=success_ids,
            group_name=group_name,
            wait_for_ready=True
        )
        
        print(f"✅ Knowledge Graph Ready: {CURRENT_GROUP_ID}")
        
        return IngestResponse(
            status="success",
            group_id=CURRENT_GROUP_ID,
            message="Knowledge Graph Built Successfully",
            files_processed=len(success_ids)
        )

    except Exception as e:
        print(f"❌ Ingest Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temp files
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)


@app.post("/query", response_model=QueryResponse)
async def query_knowledge(
    query: str = Form(...),
    group_id: Optional[str] = Form(None)
):
    """
    Query the Knowledge Graph with natural language.
    Returns answer with source citations.
    """
    target_group = group_id or CURRENT_GROUP_ID
    
    if not target_group:
        return QueryResponse(
            answer="No Knowledge Base active. Please upload documents first to build your knowledge graph.",
            sources=[]
        )

    client = get_client()
    
    try:
        print(f"🔍 Querying group {target_group}: {query[:50]}...")
        
        response = await client.query_group(
            group_id=target_group,
            query=query,
            return_source_data=True
        )
        
        # Convert sources to our format (sources are dicts per SDK docs)
        sources = []
        if hasattr(response, 'sources') and response.sources:
            for src in response.sources:
                # Sources are dicts, use .get() for safety
                sources.append(Source(
                    node_type=src.get('node_type', 'document'),
                    video_name=src.get('video_name'),
                    start_time=src.get('start_time'),
                    end_time=src.get('end_time'),
                    pdf_name=src.get('pdf_name'),
                    page_num=src.get('page_num'),
                    text=src.get('text')
                ))
        
        return QueryResponse(
            answer=response.answer,
            sources=sources
        )
        
    except Exception as e:
        print(f"❌ Query Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/group")
async def get_current_group():
    """Get the currently active knowledge graph group ID"""
    return {"group_id": CURRENT_GROUP_ID}


@app.delete("/group")
async def clear_group():
    """Clear the active knowledge graph group"""
    global CURRENT_GROUP_ID
    CURRENT_GROUP_ID = None
    return {"status": "cleared", "message": "Knowledge Graph disconnected"}


if __name__ == "__main__":
    import uvicorn
    print("🧠 Neural Bridge Starting...")
    print(f"📡 API Key: {API_KEY[:20]}...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
