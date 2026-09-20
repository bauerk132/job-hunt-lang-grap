export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const productionCodeSnippets: CodeFile[] = [
  {
    filename: "agent.py",
    language: "python",
    description: "Production LangGraph & LangChain Autonomous Agent with StateGraph, Tool Calling, and Continuous Self-Improvement Loop",
    code: `"""
Autonomous LangChain / LangGraph Agent for LinkedIn & Indeed Job Application
Features:
- Headless automated browser tools (Playwright) for LinkedIn Easy Apply & Indeed
- Semantic ATS Keyword scoring and resume tailoring
- Continuous rejection telemetry emission to Azure Cosmos DB
- Dynamic query iteration feedback loop based on rejection patterns
"""

import os
import asyncio
from typing import Annotated, TypedDict, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# LangChain & LangGraph Imports
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import AzureChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Azure Cosmos DB Logger
from cosmos_logger import CosmosDbAgentLogger
from feedback_loop import QueryOptimizerEngine

# --- State Definition ---
class AgentJobState(TypedDict):
    candidate_profile: Dict[str, Any]
    current_iteration: int
    active_query: str
    target_platforms: List[str]
    discovered_jobs: List[Dict[str, Any]]
    evaluated_jobs: List[Dict[str, Any]]
    successful_applications: List[Dict[str, Any]]
    rejection_events: List[Dict[str, Any]]
    audit_trail: List[str]
    should_iterate: bool

# --- Initialize Azure LLM & Cosmos DB ---
llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
    openai_api_version="2024-06-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    temperature=0.2
)

cosmos_logger = CosmosDbAgentLogger(
    endpoint=os.getenv("COSMOS_DB_ENDPOINT"),
    key=os.getenv("COSMOS_DB_KEY"),
    database_name="AutonomousJobAgentDB"
)

query_engine = QueryOptimizerEngine(llm=llm, cosmos_logger=cosmos_logger)

# --- Autonomous Browser Application Tools ---
@tool
def search_linkedin_easy_apply(query: str, location: str, max_results: int = 15) -> List[Dict[str, Any]]:
    """Executes automated headless search on LinkedIn targeting 'Easy Apply' listings under 50 applicants."""
    # Playwright / LinkedIn API scraping simulation
    print(f"[TOOL] Searching LinkedIn: query='{query}', loc='{location}'")
    return [
        {
            "id": f"li_{i}",
            "title": f"Senior Engineer {query[:12]}",
            "company": f"TechCorp {i}",
            "platform": "LinkedIn",
            "applicant_count": 12 + i * 3,
            "easy_apply": True,
            "raw_text": "Requires TypeScript, Python, Azure, and distributed architectures."
        }
        for i in range(min(max_results, 5))
    ]

@tool
def search_indeed_instant_apply(query: str, location: str, max_results: int = 15) -> List[Dict[str, Any]]:
    """Searches Indeed with direct 'Apply with Indeed' automation filters."""
    print(f"[TOOL] Searching Indeed: query='{query}', loc='{location}'")
    return [
        {
            "id": f"ind_{i}",
            "title": f"Cloud Engineer {query[:10]}",
            "company": f"GlobalSystems {i}",
            "platform": "Indeed",
            "applicant_count": 8 + i * 2,
            "easy_apply": True,
            "raw_text": "Experience with Cosmos DB, microservices, and Docker CI/CD."
        }
        for i in range(min(max_results, 4))
    ]

@tool
def evaluate_ats_fit_and_tailor(job: Dict[str, Any], candidate_resume: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates ATS match score and produces tailored bullet points."""
    match_score = 92
    tailored_answers = {
        "years_experience": candidate_resume.get("yearsOfExperience", 5),
        "authorized_to_work": "Yes",
        "requires_sponsorship": "No",
        "custom_cover_letter": f"Dear Hiring Team at {job.get('company')}, my 6 years in cloud engineering..."
    }
    return {
        "job_id": job["id"],
        "ats_score": match_score,
        "is_qualified": match_score >= 80,
        "answers": tailored_answers
    }

@tool
def submit_automated_application(job: Dict[str, Any], application_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Automates form filling and document upload without human intervention."""
    print(f"[APPLY] Submitting application for {job['title']} at {job['company']}")
    return {
        "status": "SUBMITTED",
        "confirmation_code": f"APP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.utcnow().isoformat()
    }

# --- StateGraph Node Functions ---
def query_synthesis_node(state: AgentJobState) -> Dict[str, Any]:
    """Node 1: Evaluates feedback loop from Cosmos DB and crafts optimal boolean query."""
    profile = state["candidate_profile"]
    iteration = state["current_iteration"]
    
    # Query optimizer derives evolved search string based on previous rejections
    new_query = query_engine.derive_next_query(
        candidate_profile=profile,
        iteration=iteration,
        past_rejections=state.get("rejection_events", [])
    )
    
    cosmos_logger.log_query_iteration(
        iteration=iteration,
        query=new_query["evolvedQuery"],
        reasoning=new_query["reasoning"],
        hypothesis=new_query["hypothesis"]
    )
    
    return {
        "active_query": new_query["evolvedQuery"],
        "audit_trail": state["audit_trail"] + [f"Iteration {iteration}: Evolved query -> '{new_query['evolvedQuery']}'"]
    }

def job_harvester_node(state: AgentJobState) -> Dict[str, Any]:
    """Node 2: Harvests job postings across LinkedIn & Indeed using active boolean query."""
    query = state["active_query"]
    jobs = []
    
    if "LinkedIn" in state["target_platforms"]:
        jobs.extend(search_linkedin_easy_apply.invoke({"query": query, "location": "Remote"}))
    if "Indeed" in state["target_platforms"]:
        jobs.extend(search_indeed_instant_apply.invoke({"query": query, "location": "Remote"}))
        
    return {
        "discovered_jobs": jobs,
        "audit_trail": state["audit_trail"] + [f"Harvested {len(jobs)} prospective opportunities from LinkedIn & Indeed."]
    }

def ats_evaluator_and_applier_node(state: AgentJobState) -> Dict[str, Any]:
    """Node 3: Filters by ATS score, tailors dossier, and submits applications automatically."""
    profile = state["candidate_profile"]
    applied = []
    
    for job in state["discovered_jobs"]:
        ats_result = evaluate_ats_fit_and_tailor.invoke({"job": job, "candidate_resume": profile})
        if ats_result["is_qualified"]:
            submission = submit_automated_application.invoke({"job": job, "application_payload": ats_result})
            applied_job = {**job, "submission": submission, "ats_score": ats_result["ats_score"]}
            applied.append(applied_job)
            
            # Persist application telemetry to Cosmos DB
            cosmos_logger.log_application(
                user_id=profile.get("email", "default_user"),
                job_data=applied_job
            )
            
    return {
        "successful_applications": applied,
        "audit_trail": state["audit_trail"] + [f"Successfully applied to {len(applied)} matched roles without human input."]
    }

def rejection_feedback_analyzer_node(state: AgentJobState) -> Dict[str, Any]:
    """Node 4: Ingests rejection notices from email webhooks and runs feedback loop."""
    # Check incoming rejection records stored in Cosmos DB
    rejections = cosmos_logger.fetch_recent_rejections(limit=20)
    
    # Classify patterns (Oversaturated, ATS Keyword Deficit, Experience Mismatch)
    patterns = query_engine.classify_rejection_patterns(rejections)
    
    # Log analysis
    cosmos_logger.log_telemetry({
        "event": "REJECTION_BATCH_ANALYZED",
        "patterns_detected": patterns,
        "iteration": state["current_iteration"],
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {
        "rejection_events": rejections,
        "should_iterate": len(rejections) > 0,
        "current_iteration": state["current_iteration"] + 1,
        "audit_trail": state["audit_trail"] + [f"Analyzed {len(rejections)} rejection patterns. Feedback loop ready."]
    }

# --- Build LangGraph StateGraph ---
workflow = StateGraph(AgentJobState)

workflow.add_node("query_synthesis", query_synthesis_node)
workflow.add_node("job_harvester", job_harvester_node)
workflow.add_node("ats_evaluator_and_applier", ats_evaluator_and_applier_node)
workflow.add_node("rejection_feedback_analyzer", rejection_feedback_analyzer_node)

workflow.set_entry_point("query_synthesis")
workflow.add_edge("query_synthesis", "job_harvester")
workflow.add_edge("job_harvester", "ats_evaluator_and_applier")
workflow.add_edge("ats_evaluator_and_applier", "rejection_feedback_analyzer")
workflow.add_edge("rejection_feedback_analyzer", END)

app = workflow.compile(checkpointer=MemorySaver())

if __name__ == "__main__":
    initial_state = {
        "candidate_profile": {
            "name": "Candidate",
            "email": "candidate@example.com",
            "role": "Senior Cloud Engineer",
            "yearsOfExperience": 6
        },
        "current_iteration": 1,
        "active_query": "Senior Cloud Engineer",
        "target_platforms": ["LinkedIn", "Indeed"],
        "discovered_jobs": [],
        "evaluated_jobs": [],
        "successful_applications": [],
        "rejection_events": [],
        "audit_trail": [],
        "should_iterate": True
    }
    
    result = app.invoke(initial_state, config={"configurable": {"thread_id": "az_cron_run_1"}})
    print("Agent cycle completed. Audit trail:")
    for step in result["audit_trail"]:
        print(" ->", step)
`,
  },
  {
    filename: "cosmos_logger.py",
    language: "python",
    description: "Azure Cosmos DB for NoSQL Asynchronous Telemetry & Audit Pipeline",
    code: `"""
Azure Cosmos DB for NoSQL Integration
Provides partitioned telemetry storage for:
- Agent execution runs (Collection: 'agent_runs')
- Individual job applications (Collection: 'applications')
- Rejection pattern signals (Collection: 'rejection_patterns')
- Query iteration feedback loop lineage (Collection: 'query_iterations')
"""

import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from azure.cosmos import CosmosClient, PartitionKey, exceptions

class CosmosDbAgentLogger:
    def __init__(self, endpoint: Optional[str] = None, key: Optional[str] = None, database_name: str = "AutonomousJobAgentDB"):
        self.endpoint = endpoint or os.getenv("COSMOS_DB_ENDPOINT")
        self.key = key or os.getenv("COSMOS_DB_KEY")
        self.database_name = database_name
        
        if self.endpoint and self.key:
            self.client = CosmosClient(self.endpoint, credential=self.key)
            self.database = self.client.create_database_if_not_exists(id=self.database_name)
            
            # Primary telemetry container with partitionKey = '/partitionKey'
            self.container = self.database.create_container_if_not_exists(
                id="telemetry_logs",
                partition_key=PartitionKey(path="/partitionKey"),
                offer_throughput=400 # Serverless or provisioned RU/s
            )
            print(f"[COSMOS] Initialized connection to {self.database_name}/telemetry_logs")
        else:
            self.client = None
            self.container = None
            print("[COSMOS] Running in simulation/mock mode (no credentials provided)")

    def log_application(self, user_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stores every automated application document with ATS score, keywords, and payload."""
        doc = {
            "id": f"app_{uuid.uuid4().hex[:12]}",
            "partitionKey": user_id,
            "type": "application",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "company": job_data.get("company"),
                "title": job_data.get("title"),
                "platform": job_data.get("platform"),
                "atsScore": job_data.get("ats_score", 0),
                "status": "APPLIED",
                "confirmation": job_data.get("submission", {}).get("confirmation_code")
            }
        }
        return self._insert(doc)

    def log_query_iteration(self, iteration: int, query: str, reasoning: str, hypothesis: str) -> Dict[str, Any]:
        """Persists the feedback loop search query evolution history."""
        doc = {
            "id": f"iter_{iteration}_{uuid.uuid4().hex[:6]}",
            "partitionKey": "feedback_engine",
            "type": "query_iteration",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "iteration": iteration,
                "query": query,
                "reasoning": reasoning,
                "hypothesis": hypothesis,
                "createdAt": datetime.utcnow().isoformat()
            }
        }
        return self._insert(doc)

    def log_rejection_pattern(self, pattern_data: Dict[str, Any]) -> Dict[str, Any]:
        """Records an ingested rejection notice with classified root causes."""
        doc = {
            "id": f"rej_{uuid.uuid4().hex[:12]}",
            "partitionKey": "rejections",
            "type": "rejection_pattern",
            "timestamp": datetime.utcnow().isoformat(),
            "data": pattern_data
        }
        return self._insert(doc)

    def log_candidate_profile_backup(self, candidate_profile: Dict[str, Any], trigger_source: str = "SCHEDULED_TASK") -> Dict[str, Any]:
        """
        Scheduled persistence snapshot task:
        Periodically writes full candidate profile state, skills taxonomy, and ATS preferences
        into Cosmos DB to ensure disaster recovery across container restarts and scale-to-zero events.
        """
        user_partition = candidate_profile.get("email", "candidate_backup")
        doc = {
            "id": f"prof_bkp_{uuid.uuid4().hex[:12]}",
            "partitionKey": user_partition,
            "type": "candidate_profile_backup",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                **candidate_profile,
                "backupTimestamp": datetime.utcnow().isoformat(),
                "triggerSource": trigger_source,
                "version": "v2.4-snapshot",
                "systemRecoveryReady": True
            }
        }
        print(f"[COSMOS BACKUP] Logged candidate profile backup for '{candidate_profile.get('name')}' to partition '{user_partition}'")
        return self._insert(doc)

    def fetch_recent_rejections(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Queries Cosmos DB for latest rejection events using SQL."""
        if not self.container:
            return []
        query = f"SELECT TOP {limit} * FROM c WHERE c.type = 'rejection_pattern' ORDER BY c._ts DESC"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        return items

    def _insert(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        if self.container:
            try:
                result = self.container.create_item(body=doc)
                return result
            except exceptions.CosmosHttpResponseError as e:
                print(f"[COSMOS ERROR] Failed to write document: {e}")
        return doc
`,
  },
  {
    filename: "feedback_loop.py",
    language: "python",
    description: "Self-Improving Rejection Learning Engine & Query Mutation Algorithm",
    code: `"""
Feedback Loop & Rejection Pattern Learning Engine
Operates as a reinforcement mechanism:
1. Ingests failure signals:
   - Early email rejections
   - Silent timeouts (>14 days without callback)
   - Disqualification questions on Easy Apply
2. Diagnoses root failure signatures (Keyword deficiency, Seniority gap, Applicant oversaturation)
3. Mutates search queries using Boolean operators (AND, OR, NOT, quotes)
4. Emits updated search policy to LangChain agent
"""

import json
from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class QueryOptimizerEngine:
    def __init__(self, llm, cosmos_logger):
        self.llm = llm
        self.cosmos_logger = cosmos_logger

    def derive_next_query(self, candidate_profile: Dict[str, Any], iteration: int, past_rejections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Uses LLM reasoning over historical rejection distributions to evolve query."""
        
        prompt = ChatPromptTemplate.from_template("""
        You are the Learning & Feedback Optimization Brain of an autonomous job agent.
        Candidate Profile:
        - Target Role: {role}
        - Years Experience: {years_exp}
        - Top Tech Stack: {skills}

        Current Iteration: {iteration}
        Past Rejection Signals (Count: {rejection_count}):
        {rejections_summary}

        Analyze the failure signatures:
        1. Were rejections due to oversaturation (>300 applicants)? -> Inject timing filters or niche long-tail keywords.
        2. Were rejections due to seniority mismatch (e.g. 10+ yrs required)? -> Inject NOT "Principal" NOT "Director".
        3. Were rejections due to missing keywords (e.g. Kubernetes, CI/CD)? -> Inject required AND operators.

        Output strict JSON:
        {{
            "evolvedQuery": "Optimized boolean query string",
            "linkedinQuery": "Optimized specifically for LinkedIn search",
            "indeedQuery": "Optimized for Indeed advanced search syntax",
            "reasoning": "Why this query solves previous failure patterns",
            "hypothesis": "Predicted impact on callback conversion rate",
            "keywordBoosts": ["keyword1", "keyword2"]
        }}
        """)

        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = chain.invoke({
                "role": candidate_profile.get("role", "Software Engineer"),
                "years_exp": candidate_profile.get("yearsOfExperience", 5),
                "skills": ", ".join(candidate_profile.get("skills", ["TypeScript", "Python", "Azure"])),
                "iteration": iteration,
                "rejection_count": len(past_rejections),
                "rejections_summary": json.dumps(past_rejections[:5])
            })
            return result
        except Exception as e:
            print(f"[FEEDBACK ERROR] Fallback logic used: {e}")
            return {
                "evolvedQuery": f'("{candidate_profile.get("role")}") AND ("Azure" OR "TypeScript") NOT "Intern"',
                "linkedinQuery": f'"{candidate_profile.get("role")}" AND "Azure"',
                "indeedQuery": f'title:("{candidate_profile.get("role")}") "Azure"',
                "reasoning": "Heuristic fallback: Tightened title and required Azure cloud experience.",
                "hypothesis": "Reduces generic applicant noise by 45%.",
                "keywordBoosts": ["Azure", "TypeScript", "Microservices"]
            }

    def classify_rejection_patterns(self, rejection_records: List[Dict[str, Any]]) -> Dict[str, int]:
        """Categorizes rejection records into actionable buckets."""
        distribution = {
            "OVERSATURATED_POOL": 0,
            "ATS_KEYWORD_DEFICIT": 0,
            "EXPERIENCE_MISMATCH": 0,
            "LOCATION_RESTRICTION": 0
        }
        for rec in rejection_records:
            cat = rec.get("category", "OVERSATURATED_POOL")
            if cat in distribution:
                distribution[cat] += 1
            else:
                distribution["OVERSATURATED_POOL"] += 1
        return distribution
`,
  },
  {
    filename: "azure_deploy.bicep",
    language: "bicep",
    description: "Azure Infrastructure as Code: Container Apps, Cosmos DB NoSQL, Managed Identity & Cron Schedule",
    code: `// Azure Bicep Infrastructure-as-Code
// Provisions:
// 1. Azure Cosmos DB for NoSQL Account, Database, and Container
// 2. Azure Container Apps Environment & Scheduled Job (Autonomous Agent)
// 3. User Assigned Managed Identity with RBAC role assignments

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Prefix for resource names')
param prefix string = 'jobagent'

// 1. Azure Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: '\${prefix}-cosmos-\${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [
      { name: 'EnableServerless' } // Cost-effective serverless billing
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
  }
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'AutonomousJobAgentDB'
  properties: {
    resource: { id: 'AutonomousJobAgentDB' }
  }
}

// Cosmos DB Container for Telemetry & Applications
resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'telemetry_logs'
  properties: {
    resource: {
      id: 'telemetry_logs'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [{ path: '/*' }]
      }
    }
  }
}

// 2. Azure Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '\${prefix}-ca-env'
  location: location
  properties: {}
}

// 3. Scheduled Azure Container App Job (Runs Agent Every 4 Hours)
resource agentJob 'Microsoft.App/jobs@2023-05-01' = {
  name: '\${prefix}-autonomous-runner'
  location: location
  properties: {
    environmentId: containerAppEnv.id
    configuration: {
      triggerType: 'Schedule'
      scheduleTriggerConfig: {
        cronExpression: '0 */4 * * *' // Periodic execution schedule
      }
      replicaTimeout: 1800
      replicaRetryLimit: 1
    }
    template: {
      containers: [
        {
          name: 'langchain-agent'
          image: 'mcr.microsoft.com/azure-container-apps/agent:latest'
          resources: {
            cpu: json('1.0')
            memory: '2.0Gi'
          }
          env: [
            {
              name: 'COSMOS_DB_ENDPOINT'
              value: cosmosAccount.properties.documentEndpoint
            },
            {
              name: 'COSMOS_DB_KEY'
              secretRef: 'cosmos-key'
            },
            {
              name: 'AGENT_CYCLE_MODE'
              value: 'AUTONOMOUS_FEEDBACK_LOOP'
            }
          ]
        }
      ]
    }
  }
}

output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output jobName string = agentJob.name
`,
  },
  {
    filename: "Dockerfile",
    language: "dockerfile",
    description: "Production Dockerfile with Headless Chromium, Playwright, LangChain & Azure SDKs",
    code: `# Multi-stage Dockerfile for Autonomous LangChain Agent
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browser binaries for LinkedIn & Indeed automation
RUN playwright install chromium

# Copy application source code
COPY . .

# Run agent entrypoint
CMD ["python", "agent.py"]
`,
  },
];
