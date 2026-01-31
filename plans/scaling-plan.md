# Scaling Plan

This document outlines the current system limits, where it will fail first, and a staged plan to evolve it into an enterprise-grade platform.

> **Note:** The numbers below are **conservative estimates** for a single-node EC2 deployment with synchronous AI enrichment and DynamoDB on-demand. Actual limits depend on CPU, memory, network, workload mix, and OpenAI latency.

---

## 1) Current Architecture (Baseline)

- **Backend:** NestJS + Fastify on a single EC2 instance (PM2)
- **DB:** DynamoDB on-demand
- **AI:** synchronous OpenAI call during `POST /incidents`
- **Observability:** CloudWatch logs

### Primary Bottlenecks

1. **Synchronous enrichment**: Each incident creation waits on OpenAI response.
2. **Single EC2 instance**: CPU and memory bound for concurrent requests.
3. **No cache**: All reads hit DynamoDB directly.
4. **No queue**: Burst traffic can overwhelm the API and OpenAI rate limits.

### Estimated Limits (Baseline)

- **Sustained writes (POST /incidents)**: ~2–5 req/s
  - Limited by OpenAI latency and concurrency.
- **Sustained reads (GET /incidents)**: ~20–50 req/s
  - Limited by EC2 and DynamoDB read capacity.
- **P95 latency**:
  - Create: 2–8s (OpenAI dependent)
  - Read: 100–400ms

**Failure Modes:**
- Elevated latency or timeouts on create when OpenAI rate limits or responds slowly.
- Single-node failure = complete outage.

---

## 2) Step 1 — Cache + Read Optimization

### Changes
- Add **Redis** (Elasticache or self-hosted) for frequently read lists.
- Cache hot endpoints (`GET /incidents`, `GET /incidents/:id`).
- Add small pagination window and server-side filtering.

### Benefits
- Reduce DynamoDB reads by 60–90% on hot data.
- Faster read latency.

### Estimated Limits After Step 1
- **Reads**: ~200–500 req/s
- **Writes**: still ~2–5 req/s (unchanged)
- **P95 read latency**: 30–100ms

---

## 3) Step 2 — Async Enrichment (Queue)

### Changes
- Move enrichment to async worker via **SQS** or **Kafka**.
- API returns immediately with `PENDING` status.
- Worker processes enrichment and updates DynamoDB.

### Benefits
- Create becomes fast and consistent.
- Backpressure handled by queue depth.
- Isolates OpenAI latency from user experience.

### Estimated Limits After Step 2
- **Writes**: ~20–50 req/s
- **Reads**: ~200–500 req/s (with cache)
- **P95 create latency**: 100–300ms

---

## 4) Step 3 — Horizontal Scale on Fargate

### Changes
- Dockerize backend.
- Deploy on ECS/Fargate behind ALB.
- Auto-scale based on CPU/queue depth.

### Benefits
- Horizontal scaling of API.
- Zero-downtime deployments.

### Estimated Limits After Step 3
- **Writes**: ~100–300 req/s (API tier)
- **Reads**: ~500–1,000+ req/s
- **P95 create latency**: 100–300ms

---

## 5) Step 4 — Batch Writes + Stream Processing

### Changes
- Batch updates to DynamoDB when enrichment results arrive.
- Use DynamoDB Streams for downstream processing.
- Optionally move analytics to a data lake (S3 + Athena).

### Benefits
- More efficient DB writes.
- Reduced DynamoDB costs.

### Estimated Limits After Step 4
- **Writes**: ~500–1,000 req/s (burst)
- **Reads**: ~1,000–2,000 req/s

---

## 6) Step 5 — Enterprise Observability

### Changes
- Add **PostHog** for product analytics and event tracking.
- Structured logging with trace IDs.
- Metrics + dashboards (CloudWatch or Grafana).
- Alerts for queue lag, error rates, and AI failures.

### Benefits
- Deep visibility into user flows and system bottlenecks.
- Faster incident response and debugging.

---

## 7) Future Enterprise Architecture (Target)

- **API**: ECS/Fargate autoscaling + ALB
- **Queue**: SQS / Kafka
- **Workers**: separate enrichment service
- **DB**: DynamoDB with read replicas + DAX (if needed)
- **Cache**: Redis
- **Analytics**: PostHog + data lake
- **Observability**: traces, metrics, logs + alerts

### Potential Enterprise Scale
- **Reads**: 5,000–20,000 req/s (multi-region)
- **Writes**: 1,000–5,000 req/s (async + batching)

---

## Summary Table

| Phase | Key Change | Sustained Reads | Sustained Writes | Notes |
|------|------------|-----------------|------------------|------|
| Baseline | Single EC2 + sync OpenAI | 20–50 r/s | 2–5 r/s | OpenAI latency dominates |
| Step 1 | Redis cache | 200–500 r/s | 2–5 r/s | DynamoDB load reduced |
| Step 2 | Async queue | 200–500 r/s | 20–50 r/s | Fast writes |
| Step 3 | Fargate autoscale | 500–1,000 r/s | 100–300 r/s | Horizontal scale |
| Step 4 | Batch writes | 1,000–2,000 r/s | 500–1,000 r/s | Efficient DB usage |
| Step 5 | Full observability | — | — | Reliability + insight |

---

## Risks to Watch

- **OpenAI rate limits**: must implement retries + backoff.
- **Queue backlog**: monitor depth and worker throughput.
- **DynamoDB hot partitions**: ensure PK design distributes load.
- **Cost**: caching + queue + Fargate adds infra cost.
