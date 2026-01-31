# Application Flow Diagram

## Mermaid (High-level)

```mermaid
flowchart LR
  subgraph Client
    User[User]
    FE[Frontend Vite and React]
  end

  subgraph Backend
    API[NestJS API Fastify]
    Enrich[AI Enrichment OpenAI]
  end

  subgraph Data
    DDB[(DynamoDB)]
  end

  User -->|Create incident| FE
  FE -->|POST /incidents| API
  API -->|PutItem| DDB
  API -->|Prompt and completion| Enrich
  Enrich -->|summary and suggestion| API
  API -->|UpdateItem| DDB

  FE -->|GET /incidents| API
  FE -->|GET /incidents/:id| API
  API -->|Get and Scan| DDB
  API -->|Response| FE
```

## ASCII (Sequence)

```
User
  |
  | 1) Create incident
  v
Frontend
  |
  | POST /incidents
  v
Backend API (NestJS)
  |  PutItem
  v
DynamoDB
  ^
  |  OpenAI prompt
  |
OpenAI
  |
  |  Summary + suggestion
  v
Backend API
  |  UpdateItem
  v
DynamoDB
  |
  | Response
  v
Frontend
```
