#!/usr/bin/env python3
"""
Voyage AI Memory Search Module
Mission Control - Vector Search for Enhanced Memory Recall
"""

import os
import json
import voyageai
from typing import List, Dict, Tuple
from dataclasses import dataclass
from pathlib import Path

# Configuration
VOYAGE_API_KEY = "pa-32Ur54RjrfSmTdrvlesNg3XsaPPFNcOj2XfRnRmkgUg"
DEFAULT_MODEL = "voyage-2"
LARGE_MODEL = "voyage-large-2"
TOP_K = 5
SIMILARITY_THRESHOLD = 0.75

@dataclass
class MemoryChunk:
    """Represents a chunk of memory with metadata"""
    content: str
    source: str
    chunk_id: int
    embedding: List[float] = None
    
@dataclass
class SearchResult:
    """Represents a search result"""
    content: str
    source: str
    similarity: float
    chunk_id: int

class VoyageMemorySearch:
    """Vector search for Mission Control memory system"""
    
    def __init__(self, api_key: str = VOYAGE_API_KEY, model: str = DEFAULT_MODEL):
        self.client = voyageai.Client(api_key=api_key)
        self.model = model
        self.memory_index: List[MemoryChunk] = []
        self.initialized = False
        
    def initialize(self):
        """Initialize the search system and test connection"""
        try:
            # Test connection with a simple embedding
            test_result = self.client.embed(["test connection"], model=self.model)
            self.initialized = True
            print(f"✅ Voyage AI connected successfully")
            print(f"   Model: {self.model}")
            print(f"   Embedding dimensions: {len(test_result.embeddings[0])}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to Voyage AI: {e}")
            return False
    
    def chunk_text(self, text: str, max_tokens: int = 4000, overlap: int = 200) -> List[str]:
        """Split text into chunks with overlap"""
        # Simple chunking by paragraphs first
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            para_length = len(para.split())
            
            if current_length + para_length > max_tokens and current_chunk:
                # Save current chunk
                chunks.append('\n\n'.join(current_chunk))
                # Start new chunk with overlap
                overlap_text = '\n\n'.join(current_chunk[-2:]) if len(current_chunk) >= 2 else current_chunk[-1]
                current_chunk = [overlap_text, para] if overlap_text != para else [para]
                current_length = len(overlap_text.split()) + para_length
            else:
                current_chunk.append(para)
                current_length += para_length
        
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))
        
        return chunks
    
    def index_file(self, file_path: str) -> int:
        """Index a memory file for search"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            chunks = self.chunk_text(content)
            chunk_objects = []
            
            # Get embeddings for all chunks
            embeddings = self.client.embed(chunks, model=self.model).embeddings
            
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_obj = MemoryChunk(
                    content=chunk_text,
                    source=file_path,
                    chunk_id=i,
                    embedding=embedding
                )
                chunk_objects.append(chunk_obj)
            
            self.memory_index.extend(chunk_objects)
            print(f"✅ Indexed {len(chunks)} chunks from {file_path}")
            return len(chunks)
            
        except Exception as e:
            print(f"❌ Failed to index {file_path}: {e}")
            return 0
    
    def index_memory_files(self):
        """Index all memory files"""
        memory_files = [
            "MEMORY.md",
            "memory/2026-02-17.md",
            "memory/2026-02-18.md",
            "PENDING_TASKS.md"
        ]
        
        total_chunks = 0
        for file_path in memory_files:
            full_path = Path("/root/.openclaw/workspace") / file_path
            if full_path.exists():
                total_chunks += self.index_file(str(full_path))
            else:
                print(f"⚠️ File not found: {file_path}")
        
        print(f"\n📊 Total indexed: {total_chunks} chunks from {len(memory_files)} files")
        return total_chunks
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        import math
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0.0
    
    def search(self, query: str, top_k: int = TOP_K) -> List[SearchResult]:
        """Search memory for relevant content"""
        if not self.initialized:
            print("⚠️ Search system not initialized. Call initialize() first.")
            return []
        
        if not self.memory_index:
            print("⚠️ No memory indexed. Call index_memory_files() first.")
            return []
        
        # Embed query
        query_embedding = self.client.embed([query], model=self.model).embeddings[0]
        
        # Calculate similarities
        results = []
        for chunk in self.memory_index:
            similarity = self.cosine_similarity(query_embedding, chunk.embedding)
            if similarity >= SIMILARITY_THRESHOLD:
                results.append(SearchResult(
                    content=chunk.content,
                    source=chunk.source,
                    similarity=similarity,
                    chunk_id=chunk.chunk_id
                ))
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x.similarity, reverse=True)
        return results[:top_k]
    
    def format_results(self, results: List[SearchResult]) -> str:
        """Format search results for display"""
        if not results:
            return "No relevant results found."
        
        output = [f"\n🔍 Found {len(results)} relevant memories:\n"]
        
        for i, result in enumerate(results, 1):
            output.append(f"\n{'─' * 60}")
            output.append(f"Result {i} | Similarity: {result.similarity:.3f} | Source: {result.source}")
            output.append(f"{'─' * 60}")
            # Truncate long content
            content = result.content[:800] + "..." if len(result.content) > 800 else result.content
            output.append(content)
        
        return '\n'.join(output)


# Convenience functions for Mission Control
def search_memory(query: str, top_k: int = 5) -> str:
    """
    Search Mission Control memory using Voyage AI embeddings.
    
    Args:
        query: Natural language query
        top_k: Number of results to return
        
    Returns:
        Formatted search results
    """
    search = VoyageMemorySearch()
    
    if not search.initialized:
        if not search.initialize():
            return "❌ Failed to initialize Voyage AI search"
    
    if not search.memory_index:
        search.index_memory_files()
    
    results = search.search(query, top_k=top_k)
    return search.format_results(results)


def quick_search(query: str) -> str:
    """Quick one-liner search function"""
    return search_memory(query)


if __name__ == "__main__":
    # Test the system
    print("=" * 70)
    print("Voyage AI Memory Search - Mission Control")
    print("=" * 70)
    
    search = VoyageMemorySearch()
    
    # Initialize and test connection
    if search.initialize():
        # Index memory files
        search.index_memory_files()
        
        # Test queries
        test_queries = [
            "What were the decisions about cron consolidation?",
            "What is TASK-014 about?",
            "What are EricF's preferences?",
            "What happened with the innovation sprint?"
        ]
        
        print("\n" + "=" * 70)
        print("TEST QUERIES")
        print("=" * 70)
        
        for query in test_queries:
            print(f"\n\n📝 Query: {query}")
            results = search.search(query)
            print(search.format_results(results))
    else:
        print("\n❌ System initialization failed")
