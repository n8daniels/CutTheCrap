# MCP Development Guidelines: Architecture & Gotchas

## Overview
This guide helps you avoid common pitfalls when building Model Context Protocol (MCP) servers, with a focus on performance, caching strategies, and relationship management.

---

## 🚨 Critical Gotchas to Avoid

### 1. **Cache Invalidation Hell**
**Problem:** When a source document updates, failing to invalidate dependent caches leads to stale data.

**Solution Pattern:**
```python
# Maintain a dependency graph
class DocumentGraph:
    def __init__(self):
        self.dependencies = {}  # doc_id -> [dependent_doc_ids]
        self.references = {}     # doc_id -> [referenced_doc_ids]
    
    def invalidate_cascade(self, doc_id):
        """Invalidate document and all dependents"""
        to_invalidate = {doc_id}
        queue = [doc_id]
        
        while queue:
            current = queue.pop(0)
            if current in self.dependencies:
                for dependent in self.dependencies[current]:
                    if dependent not in to_invalidate:
                        to_invalidate.add(dependent)
                        queue.append(dependent)
        
        return to_invalidate

# Usage
graph = DocumentGraph()
graph.add_relationship("bill_A", "service_doc_1")
graph.add_relationship("bill_A", "service_doc_2")

# When Bill A updates:
docs_to_invalidate = graph.invalidate_cascade("bill_A")
# Invalidates: bill_A, service_doc_1, service_doc_2
```

**Guidelines:**
- ✅ Always maintain bidirectional references (parent → child, child → parent)
- ✅ Implement cascade invalidation for dependent documents
- ✅ Use timestamps or version numbers to detect stale cache
- ❌ Never assume cache is valid without checking source document timestamp
- ❌ Don't invalidate everything - be surgical

---

### 2. **Synchronous Processing Bottleneck**
**Problem:** Waiting for AI processing blocks the entire request, creating terrible UX.

**Solution Pattern:**
```python
from enum import Enum
from typing import Optional
import asyncio

class ProcessingStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

class AsyncJobManager:
    def __init__(self):
        self.jobs = {}  # job_id -> job_data
    
    async def submit_job(self, doc_id, processing_fn):
        """Submit job and return immediately"""
        job_id = f"job_{doc_id}_{timestamp()}"
        
        self.jobs[job_id] = {
            "status": ProcessingStatus.PENDING,
            "doc_id": doc_id,
            "result": None,
            "error": None,
            "created_at": time.time()
        }
        
        # Start processing in background
        asyncio.create_task(self._process_job(job_id, processing_fn))
        
        return job_id
    
    async def _process_job(self, job_id, processing_fn):
        """Background processing"""
        self.jobs[job_id]["status"] = ProcessingStatus.PROCESSING
        try:
            result = await processing_fn()
            self.jobs[job_id]["status"] = ProcessingStatus.COMPLETE
            self.jobs[job_id]["result"] = result
        except Exception as e:
            self.jobs[job_id]["status"] = ProcessingStatus.FAILED
            self.jobs[job_id]["error"] = str(e)
    
    def get_job_status(self, job_id):
        """Poll job status"""
        return self.jobs.get(job_id, {"status": "not_found"})

# MCP Tool Implementation
@mcp.tool()
async def analyze_document(doc_id: str):
    """Analyze document - returns immediately with job_id"""
    
    # Check cache first
    cached = cache.get(f"analysis:{doc_id}")
    if cached:
        return {
            "status": "complete",
            "result": cached,
            "from_cache": True
        }
    
    # Submit background job
    job_id = await job_manager.submit_job(
        doc_id, 
        lambda: process_with_llm(doc_id)
    )
    
    return {
        "status": "processing",
        "job_id": job_id,
        "poll_url": f"/status/{job_id}",
        "estimated_time": "10-30 seconds"
    }

@mcp.tool()
def get_job_status(job_id: str):
    """Poll job status"""
    return job_manager.get_job_status(job_id)
```

**Guidelines:**
- ✅ Always return immediately from MCP tools
- ✅ Use job IDs for tracking long-running operations
- ✅ Provide polling endpoints for status checks
- ✅ Include estimated completion time when possible
- ❌ Never block for more than 100ms in a tool call
- ❌ Don't make the client guess when to poll - provide guidance

---

### 3. **Redundant AI Processing**
**Problem:** Processing the same document multiple times wastes money and time.

**Solution Pattern:**
```python
import hashlib
from datetime import datetime, timedelta

class SmartCache:
    def __init__(self, redis_client, ttl_hours=24):
        self.redis = redis_client
        self.ttl = timedelta(hours=ttl_hours)
    
    def get_cache_key(self, doc_id, operation="analysis"):
        """Generate consistent cache keys"""
        return f"{operation}:{doc_id}"
    
    def get_with_source_check(self, doc_id, source_timestamp):
        """Get cached value only if source hasn't changed"""
        cache_key = self.get_cache_key(doc_id)
        cached_data = self.redis.get(cache_key)
        
        if not cached_data:
            return None
        
        # Check if source was modified after cache
        cache_time = self.redis.get(f"{cache_key}:timestamp")
        if cache_time and source_timestamp > float(cache_time):
            # Source is newer, invalidate cache
            self.redis.delete(cache_key)
            return None
        
        return cached_data
    
    def set_with_metadata(self, doc_id, value, source_timestamp):
        """Cache with source tracking"""
        cache_key = self.get_cache_key(doc_id)
        
        # Store value
        self.redis.setex(
            cache_key,
            int(self.ttl.total_seconds()),
            value
        )
        
        # Store cache creation timestamp
        self.redis.setex(
            f"{cache_key}:timestamp",
            int(self.ttl.total_seconds()),
            source_timestamp
        )
    
    def get_or_compute(self, doc_id, source_timestamp, compute_fn):
        """Cache-aside pattern with freshness check"""
        # Try cache first
        cached = self.get_with_source_check(doc_id, source_timestamp)
        if cached:
            return cached, True  # from_cache=True
        
        # Compute
        result = compute_fn()
        
        # Cache for next time
        self.set_with_metadata(doc_id, result, source_timestamp)
        
        return result, False  # from_cache=False

# Usage
@mcp.tool()
async def analyze_document(doc_id: str):
    # Get source document metadata
    doc_metadata = document_store.get_metadata(doc_id)
    source_timestamp = doc_metadata["last_modified"]
    
    # Smart cache lookup
    result, from_cache = smart_cache.get_or_compute(
        doc_id,
        source_timestamp,
        lambda: expensive_llm_call(doc_id)
    )
    
    return {
        "analysis": result,
        "from_cache": from_cache,
        "cache_age": "fresh" if not from_cache else "recent"
    }
```

**Guidelines:**
- ✅ Always check source document timestamp before using cache
- ✅ Store cache metadata (creation time, source version)
- ✅ Use cache-aside pattern for predictable behavior
- ✅ Log cache hit/miss rates to monitor effectiveness
- ❌ Never cache without TTL or invalidation strategy
- ❌ Don't ignore source document modifications

---

### 4. **Context Assembly Without Deduplication**
**Problem:** When assembling related documents, including the same content multiple times bloats context.

**Solution Pattern:**
```python
class ContextAssembler:
    def __init__(self, cache):
        self.cache = cache
    
    def assemble_document_context(self, primary_doc_id, max_depth=2):
        """
        Assemble primary document + related context without duplication
        """
        seen_docs = set()
        context = {
            "primary": None,
            "related": [],
            "relationships": []
        }
        
        # Get primary document
        primary = self._get_processed_doc(primary_doc_id)
        context["primary"] = primary
        seen_docs.add(primary_doc_id)
        
        # Get related documents (BFS)
        queue = [(primary_doc_id, 0)]  # (doc_id, depth)
        
        while queue:
            current_id, depth = queue.pop(0)
            
            if depth >= max_depth:
                continue
            
            # Get relationships
            references = graph.get_references(current_id)
            
            for ref_id in references:
                if ref_id in seen_docs:
                    # Already included, just note the relationship
                    context["relationships"].append({
                        "from": current_id,
                        "to": ref_id,
                        "type": "reference",
                        "note": "content already included"
                    })
                    continue
                
                # New document - include it
                ref_doc = self._get_processed_doc(ref_id)
                context["related"].append({
                    "doc_id": ref_id,
                    "content": ref_doc,
                    "referenced_by": current_id
                })
                
                context["relationships"].append({
                    "from": current_id,
                    "to": ref_id,
                    "type": "reference"
                })
                
                seen_docs.add(ref_id)
                queue.append((ref_id, depth + 1))
        
        return context
    
    def _get_processed_doc(self, doc_id):
        """Get processed version from cache or process"""
        cached = self.cache.get(f"processed:{doc_id}")
        if cached:
            return cached
        
        # Process and cache
        processed = process_document(doc_id)
        self.cache.set(f"processed:{doc_id}", processed)
        return processed

# Usage
@mcp.tool()
def get_document_with_context(doc_id: str, include_depth: int = 1):
    """Get document with related context, deduplicated"""
    assembler = ContextAssembler(smart_cache)
    context = assembler.assemble_document_context(doc_id, include_depth)
    
    return {
        "primary_document": context["primary"],
        "related_documents": context["related"],
        "relationship_graph": context["relationships"],
        "total_unique_docs": len(context["related"]) + 1
    }
```

**Guidelines:**
- ✅ Track seen documents during context assembly
- ✅ Include relationship metadata even when deduplicating content
- ✅ Use breadth-first search to control context size
- ✅ Make depth configurable (different use cases need different amounts)
- ❌ Never include the same document text twice
- ❌ Don't lose relationship information when deduplicating

---

### 5. **Missing Performance Monitoring**
**Problem:** Can't optimize what you don't measure.

**Solution Pattern:**
```python
from dataclasses import dataclass
from typing import Optional
import time

@dataclass
class PerformanceMetrics:
    cache_hits: int = 0
    cache_misses: int = 0
    avg_response_time: float = 0.0
    llm_calls: int = 0
    llm_cost: float = 0.0
    error_count: int = 0

class MonitoredMCPServer:
    def __init__(self):
        self.metrics = PerformanceMetrics()
        self.response_times = []
    
    def record_cache_hit(self):
        self.metrics.cache_hits += 1
    
    def record_cache_miss(self):
        self.metrics.cache_misses += 1
    
    def record_llm_call(self, tokens_used, cost):
        self.metrics.llm_calls += 1
        self.metrics.llm_cost += cost
    
    def record_response_time(self, duration_ms):
        self.response_times.append(duration_ms)
        # Keep rolling average
        if len(self.response_times) > 1000:
            self.response_times.pop(0)
        self.metrics.avg_response_time = sum(self.response_times) / len(self.response_times)
    
    def get_cache_hit_rate(self):
        total = self.metrics.cache_hits + self.metrics.cache_misses
        if total == 0:
            return 0.0
        return (self.metrics.cache_hits / total) * 100
    
    def get_health_report(self):
        return {
            "cache_hit_rate": f"{self.get_cache_hit_rate():.1f}%",
            "avg_response_time_ms": f"{self.metrics.avg_response_time:.2f}",
            "total_llm_calls": self.metrics.llm_calls,
            "total_llm_cost": f"${self.metrics.llm_cost:.2f}",
            "error_rate": self.metrics.error_count,
            "status": self._determine_health_status()
        }
    
    def _determine_health_status(self):
        """Determine if MCP is healthy"""
        if self.metrics.avg_response_time > 200:
            return "⚠️  SLOW - Average response time high"
        if self.get_cache_hit_rate() < 60:
            return "⚠️  LOW CACHE HIT RATE - Check caching strategy"
        if self.metrics.error_count > 10:
            return "❌ ERRORS - Investigate failures"
        return "✅ HEALTHY"

# Decorator for automatic monitoring
def monitored_tool(monitor: MonitoredMCPServer):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                
                # Record metrics based on result
                if result.get("from_cache"):
                    monitor.record_cache_hit()
                else:
                    monitor.record_cache_miss()
                
                duration_ms = (time.time() - start) * 1000
                monitor.record_response_time(duration_ms)
                
                return result
            except Exception as e:
                monitor.metrics.error_count += 1
                raise
        return wrapper
    return decorator

# Usage
monitor = MonitoredMCPServer()

@mcp.tool()
@monitored_tool(monitor)
async def analyze_document(doc_id: str):
    # Your implementation
    pass

@mcp.tool()
def get_mcp_health():
    """Tool to expose health metrics to clients"""
    return monitor.get_health_report()
```

**Guidelines:**
- ✅ Track cache hit rates (aim for >70%)
- ✅ Monitor average response times (aim for <100ms)
- ✅ Count LLM API calls and costs
- ✅ Log errors and track error rates
- ✅ Expose health metrics via a dedicated tool
- ❌ Don't deploy without monitoring
- ❌ Don't ignore degrading metrics

---

## 🎯 Quick Decision Guide

### Should I cache this?
```
Is it expensive to compute? (>500ms or costs money)
    YES → Cache it
    NO  → Consider skipping cache

Does the source data change frequently? (<1 hour)
    YES → Use short TTL (minutes) or timestamp-based invalidation
    NO  → Use long TTL (hours/days)

Do multiple requests need the same data?
    YES → Definitely cache
    NO  → Maybe cache if computation is very expensive
```

### Should I process synchronously or async?
```
Does processing take <100ms?
    YES → Synchronous is fine
    NO  → Use async job pattern

Is it user-facing and time-sensitive?
    YES → Return partial results + job_id for polling
    NO  → Background processing is fine
```

### Should I invalidate cache or use TTL?
```
Do I know exactly when source data changes?
    YES → Event-based invalidation (best)
    NO  → TTL-based with timestamp checking (good)

Can I afford stale data for a few minutes?
    YES → Simple TTL (easiest)
    NO  → Aggressive timestamp checking + invalidation
```

---

## 📊 Performance Targets

### Good Performance Benchmarks
- **Cache hit rate:** >70%
- **Average response time:** <100ms for cached, <30s for uncached
- **LLM call reduction:** >60% compared to no-cache baseline
- **Error rate:** <1%

### Warning Signs
- 🚨 Cache hit rate <50% → Review caching strategy
- 🚨 Response times >200ms average → Investigate bottlenecks
- 🚨 >10 errors/hour → Check error logs
- 🚨 LLM costs increasing linearly with requests → Cache isn't working

---

## 🔧 Testing Your MCP Server

### Essential Test Cases
```python
# Test 1: Cache invalidation cascade
def test_cascade_invalidation():
    # Setup: Bill A referenced by 3 docs
    graph.add_relationship("bill_A", "service_1")
    graph.add_relationship("bill_A", "service_2")
    graph.add_relationship("bill_A", "service_3")
    
    # Invalidate Bill A
    invalidated = graph.invalidate_cascade("bill_A")
    
    # Assert all 4 docs marked invalid
    assert len(invalidated) == 4
    assert "bill_A" in invalidated
    assert "service_1" in invalidated

# Test 2: Stale cache detection
def test_stale_cache_detection():
    # Cache document at T0
    cache.set_with_metadata("doc_1", "old_content", timestamp_t0)
    
    # Update source at T1
    update_document("doc_1", timestamp_t1)
    
    # Request should detect stale cache and reprocess
    result = cache.get_with_source_check("doc_1", timestamp_t1)
    assert result is None  # Cache invalidated

# Test 3: Concurrent request deduplication
async def test_concurrent_deduplication():
    # Multiple simultaneous requests for same doc
    tasks = [
        analyze_document("doc_1"),
        analyze_document("doc_1"),
        analyze_document("doc_1")
    ]
    
    results = await asyncio.gather(*tasks)
    
    # Only 1 LLM call should be made
    assert monitor.metrics.llm_calls == 1
    # All should get same result
    assert results[0] == results[1] == results[2]
```

---

## 📝 Logging Best Practices

```python
import logging
import json

# Structured logging for debugging
logger = logging.getLogger("mcp_server")

def log_cache_event(event_type, doc_id, from_cache=False, processing_time_ms=None):
    """Structured logging for cache events"""
    log_data = {
        "event": event_type,
        "doc_id": doc_id,
        "from_cache": from_cache,
        "processing_time_ms": processing_time_ms,
        "timestamp": time.time()
    }
    logger.info(json.dumps(log_data))

# Usage
log_cache_event("document_requested", "bill_123", from_cache=True, processing_time_ms=45)
```

**What to log:**
- ✅ Cache hits/misses with doc_id
- ✅ Processing times for each operation
- ✅ Invalidation events with cascade count
- ✅ LLM API calls with token counts
- ✅ Errors with full stack traces
- ❌ Don't log sensitive document content
- ❌ Don't log so much it impacts performance

---

## 🚀 Deployment Checklist

Before deploying your MCP server:

- [ ] Cache invalidation strategy implemented and tested
- [ ] Async processing for operations >100ms
- [ ] Smart caching with timestamp/version checking
- [ ] Context deduplication implemented
- [ ] Performance monitoring in place
- [ ] Health check endpoint exposed
- [ ] Error handling and logging configured
- [ ] Load testing completed (simulate 100+ concurrent requests)
- [ ] Cache hit rate >70% in testing
- [ ] Documentation updated with API examples

---

## 📚 Additional Resources

- [MCP Official Docs](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Async Patterns in Python](https://docs.python.org/3/library/asyncio.html)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/)

---

## 🆘 When Things Go Wrong

### Symptom: MCP server is slow
**Debug steps:**
1. Check `get_mcp_health()` - what's the avg response time?
2. Check cache hit rate - is it <50%?
3. Look at logs - are you seeing redundant processing?
4. Profile with timing decorators - where's the bottleneck?

### Symptom: Stale data being returned
**Debug steps:**
1. Check source document timestamps vs cache timestamps
2. Verify invalidation cascade is working
3. Check TTL settings - are they too long?
4. Look for missed invalidation events

### Symptom: High LLM costs
**Debug steps:**
1. Check cache hit rate - should be >70%
2. Look for request patterns - are clients polling inefficiently?
3. Check for duplicate processing of same document
4. Consider pre-processing common documents during off-peak hours

---

*Remember: An MCP server should make AI processing faster and cheaper by eliminating redundancy. If it's not doing that, something needs tuning.*
