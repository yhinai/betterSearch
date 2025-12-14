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
import warnings

# Suppress warnings from duckduckgo_search about package renaming
warnings.filterwarnings("ignore", category=RuntimeWarning, module="duckduckgo_search")

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

# Store group_id and all file IDs in memory (for hackathon - in production use DB)
CURRENT_GROUP_ID: Optional[str] = None
ALL_FILE_IDS: List[str] = []  # Persist all uploaded file IDs

# Pydantic models for responses
class IngestResponse(BaseModel):
    status: str
    group_id: Optional[str] = None
    message: str
    files_processed: int = 0
    total_files: int = 0  # Total files in knowledge base

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
    total_files: int = 0


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
            active_group=CURRENT_GROUP_ID,
            total_files=len(ALL_FILE_IDS)
        )
    except Exception as e:
        return HealthResponse(
            status="degraded",
            graphon_connected=False,
            active_group=CURRENT_GROUP_ID,
            total_files=len(ALL_FILE_IDS)
        )


@app.post("/ingest", response_model=IngestResponse)
async def ingest_files(files: List[UploadFile] = File(...)):
    """
    Upload and process files into Graphon Knowledge Graph.
    Accepts multiple files (PDF, images, videos).
    Files are ADDED to existing knowledge base, not replaced.
    """
    global CURRENT_GROUP_ID, ALL_FILE_IDS
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
        new_success_ids = [f.file_id for f in file_objects if f.processing_status == "SUCCESS"]
        
        if not new_success_ids:
            return IngestResponse(
                status="error",
                message="No files processed successfully",
                files_processed=0,
                total_files=len(ALL_FILE_IDS)
            )

        # 4. ADD new file IDs to master list (not replace!)
        ALL_FILE_IDS.extend(new_success_ids)
        print(f"📚 Total files in knowledge base: {len(ALL_FILE_IDS)}")

        # 5. Create NEW Knowledge Graph Group with ALL files
        group_name = f"betterSearch_KB_{len(ALL_FILE_IDS)}_files"
        CURRENT_GROUP_ID = await client.create_group(
            file_ids=ALL_FILE_IDS,  # Include ALL files, not just new ones
            group_name=group_name,
            wait_for_ready=True
        )
        
        print(f"✅ Knowledge Graph Ready: {CURRENT_GROUP_ID} ({len(ALL_FILE_IDS)} total files)")
        
        return IngestResponse(
            status="success",
            group_id=CURRENT_GROUP_ID,
            message=f"Knowledge Graph Updated - now contains {len(ALL_FILE_IDS)} files",
            files_processed=len(new_success_ids),
            total_files=len(ALL_FILE_IDS)
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
    query: str = Form(default=""),
    group_id: Optional[str] = Form(default=None)
):
    """
    Query the Knowledge Graph with natural language.
    Returns answer with source citations.
    """
    # Handle empty or missing query
    if not query or not query.strip():
        return QueryResponse(
            answer="Please provide a question to query the knowledge base.",
            sources=[]
        )
    
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
    """Clear the active knowledge graph group and all file IDs"""
    global CURRENT_GROUP_ID, ALL_FILE_IDS
    CURRENT_GROUP_ID = None
    ALL_FILE_IDS = []  # Clear all file IDs
    return {"status": "cleared", "message": "Knowledge Graph disconnected and all files removed"}


# --- Web Search Tool ---
class SearchResult(BaseModel):
    title: str
    link: str
    snippet: str

class SearchResponse(BaseModel):
    results: List[SearchResult]

@app.post("/search", response_model=SearchResponse)
async def search_web(
    query: str = Form(default=""),
    max_results: str = Form(default="5")
):
    """
    Perform a web search using DuckDuckGo (Free, No API Key).
    """
    try:
        # Handle empty query
        if not query or not query.strip():
            return SearchResponse(results=[])
        
        # Parse max_results safely
        try:
            num_results = int(max_results) if max_results else 5
        except ValueError:
            num_results = 5
            
        from duckduckgo_search import DDGS
        print(f"🔎 Searching Web: {query[:50]}...")
        
        results = DDGS().text(query, max_results=num_results)
        
        formatted_results = []
        if results:
            for r in results:
                formatted_results.append(SearchResult(
                    title=r.get('title', ''),
                    link=r.get('href', ''),
                    snippet=r.get('body', '')
                ))
                
        return SearchResponse(results=formatted_results)
        
    except Exception as e:
        print(f"❌ Search Error: {e}")
        # Return empty list instead of failure for resilience
        return SearchResponse(results=[])


if __name__ == "__main__":
    import uvicorn
    print("🧠 Neural Bridge Starting...")
    print(f"📡 API Key: {API_KEY[:20]}...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
