import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Service, Engineer, Runbook, Incident, Setting, MemoryLog } from '../models/index.js';

const seedDatabase = async () => {
  try {
    console.log('\x1b[36m[Seed Script] Initializing MongoDB database seed...\x1b[0m');
    await connectDB();

    console.log('[Seed Script] Clearing existing collections...');
    await Promise.all([
      Service.deleteMany({}),
      Engineer.deleteMany({}),
      Runbook.deleteMany({}),
      Incident.deleteMany({}),
      Setting.deleteMany({}),
      MemoryLog.deleteMany({}),
    ]);

    // 1. Seed Engineers
    console.log('[Seed Script] Seeding 3 DevOps/SRE Engineers...');
    const engineers = await Engineer.create([
      {
        name: 'Alex Chen',
        email: 'alex.chen@fixmemory.ai',
        role: 'Senior Staff SRE',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isOnCall: true,
        specialties: ['Kubernetes', 'PostgreSQL', 'Networking', 'PgBouncer'],
        currentAssignedIncidents: 0,
      },
      {
        name: 'Sarah Connor',
        email: 'sarah.connor@fixmemory.ai',
        role: 'Lead Infrastructure Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        isOnCall: false,
        specialties: ['Kafka', 'Redis', 'Distributed Systems', 'Chaos Engineering'],
        currentAssignedIncidents: 0,
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.vance@fixmemory.ai',
        role: 'Platform Security & SRE',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        isOnCall: false,
        specialties: ['OAuth2/JWT', 'Stripe API', 'Observability', 'Datadog'],
        currentAssignedIncidents: 0,
      },
    ]);

    const engineerMap = {
      alex: engineers[0]._id,
      sarah: engineers[1]._id,
      marcus: engineers[2]._id,
    };

    // 2. Seed Services
    console.log('[Seed Script] Seeding 4 Microservices...');
    const services = await Service.create([
      {
        name: 'payment-service',
        slug: 'payment-service',
        tier: 'TIER_0',
        description: 'Core billing, checkout payment gateway, and Stripe charge orchestration.',
        repositoryUrl: 'https://github.com/org/payment-service',
        ownerTeam: 'Checkout & Payments SRE',
        environment: 'production',
        healthStatus: 'HEALTHY',
        hindsightBankId: 'bank_payment_service',
      },
      {
        name: 'auth-service',
        slug: 'auth-service',
        tier: 'TIER_0',
        description: 'SSO, session validation, OAuth tokens, and Redis user cache.',
        repositoryUrl: 'https://github.com/org/auth-service',
        ownerTeam: 'Identity & Security',
        environment: 'production',
        healthStatus: 'HEALTHY',
        hindsightBankId: 'bank_auth_service',
      },
      {
        name: 'order-processor',
        slug: 'order-processor',
        tier: 'TIER_1',
        description: 'Async order fulfillment, inventory checks, and PostgreSQL transactional ledger.',
        repositoryUrl: 'https://github.com/org/order-processor',
        ownerTeam: 'Commerce Core',
        environment: 'production',
        healthStatus: 'HEALTHY',
        hindsightBankId: 'bank_order_processor',
      },
      {
        name: 'notification-worker',
        slug: 'notification-worker',
        tier: 'TIER_2',
        description: 'Kafka event consumer sending transactional emails, SMS, and push webhooks.',
        repositoryUrl: 'https://github.com/org/notification-worker',
        ownerTeam: 'Engagement & Messaging',
        environment: 'production',
        healthStatus: 'HEALTHY',
        hindsightBankId: 'bank_notification_worker',
      },
    ]);

    const serviceMap = {
      payment: services[0]._id,
      auth: services[1]._id,
      order: services[2]._id,
      notification: services[3]._id,
    };

    // 3. Seed Runbooks
    console.log('[Seed Script] Seeding 4 Standard Operating Procedure (SOP) Runbooks...');
    await Runbook.create([
      {
        title: 'PostgreSQL Connection Pool Triage & Recovery',
        slug: 'rb-postgres-pool-triage',
        serviceId: serviceMap.order,
        triggerKeywords: ['sequelizeconnectionacquiretimeouterror', 'connection pool', 'max_connections', 'pool exhaustion', 'pg_stat_activity'],
        summary: 'Step-by-step diagnostic and remediation for Postgres connection saturation without crashing the primary database.',
        markdownContent: `## Postgres Connection Saturation SOP\nWhen connection pool timeout occurs, inspect active vs idle in transaction queries before attempting pod scaling.\n\n### Danger Notice\nDO NOT restart primary RDS database or abruptly increase replicas; verify client leaks first.`,
        actionSteps: [
          {
            stepNumber: 1,
            instruction: 'Inspect active connections and identify transactions holding idle locks.',
            cliCommand: "psql -h postgres-prod.internal -U app_user -d orders_db -c \"SELECT pid, usename, state, query_start, age(clock_timestamp(), query_start), query FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start ASC LIMIT 10;\"",
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 2,
            instruction: 'Check connection count grouped by client application IP address.',
            cliCommand: "psql -h postgres-prod.internal -U app_user -d orders_db -c \"SELECT client_addr, count(*) FROM pg_stat_activity GROUP BY client_addr ORDER BY count DESC;\"",
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 3,
            instruction: 'Terminate orphaned idle-in-transaction connections older than 5 minutes (CAUTION: mutates connections).',
            cliCommand: "psql -h postgres-prod.internal -U app_user -d orders_db -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND query_start < now() - interval '5 minutes';\"",
            isAutomated: false,
            dangerLevel: 'CAUTION_MUTATING',
          },
        ],
        author: 'Alex Chen',
      },
      {
        title: 'Redis Client Connection Overload & Pool Recovery',
        slug: 'rb-redis-clients-overload',
        serviceId: serviceMap.auth,
        triggerKeywords: ['rediserror', 'max client connections', 'redis pool exhaustion', 'clients reached', 'auth-service'],
        summary: 'Remediation guide for Redis max clients limit without executing destructive FLUSHALL.',
        markdownContent: `## Redis Client Exhaustion SOP\nRedis client exhaustion is typically caused by unclosed connection sockets in node workers. Never execute FLUSHALL in production.`,
        actionSteps: [
          {
            stepNumber: 1,
            instruction: 'Check connected clients count and memory usage on Redis primary.',
            cliCommand: 'redis-cli -h redis-prod.internal -p 6379 info clients',
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 2,
            instruction: 'List the top 10 oldest connected clients and their idle times.',
            cliCommand: 'redis-cli -h redis-prod.internal -p 6379 client list | sort -k12 -n | tail -n 10',
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 3,
            instruction: 'Kill idle connection sockets exceeding 600s idle time.',
            cliCommand: "redis-cli -h redis-prod.internal -p 6379 CLIENT KILL TYPE normal IDLE 600",
            isAutomated: false,
            dangerLevel: 'CAUTION_MUTATING',
          },
        ],
        author: 'Sarah Connor',
      },
      {
        title: 'Kafka Consumer Lag & Rebalance Storm Resolution',
        slug: 'rb-kafka-lag-rebalance',
        serviceId: serviceMap.notification,
        triggerKeywords: ['commitfailedexception', 'rebalanced', 'consumer lag', 'kafka', 'notification-worker'],
        summary: 'Procedures to stabilize flapping Kafka consumer groups without compounding rebalance storms.',
        markdownContent: `## Kafka Consumer Rebalance SOP\nWhen consumers flapping exceeds heartbeat timeouts, do NOT blindly add consumer pods if partition count is already fully saturated.`,
        actionSteps: [
          {
            stepNumber: 1,
            instruction: 'Inspect current consumer group lag and partition assignments.',
            cliCommand: 'kafka-consumer-groups.sh --bootstrap-server kafka-prod:9092 --describe --group notification-workers-group',
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 2,
            instruction: 'Check topic partition count to verify max concurrency limit.',
            cliCommand: 'kafka-topics.sh --bootstrap-server kafka-prod:9092 --describe --topic email-notifications',
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 3,
            instruction: 'Tune consumer environment variables for longer poll intervals.',
            cliCommand: 'kubectl set env deployment/notification-worker MAX_POLL_INTERVAL_MS=600000 MAX_POLL_RECORDS=50',
            isAutomated: false,
            dangerLevel: 'CAUTION_MUTATING',
          },
        ],
        author: 'Sarah Connor',
      },
      {
        title: 'Stripe API Gateway Timeout & HTTP Socket Exhaustion',
        slug: 'rb-stripe-http-timeouts',
        serviceId: serviceMap.payment,
        triggerKeywords: ['stripeconnectiontimeout', 'gateway timeout', 'outbound http', 'payment-service', '504'],
        summary: 'Diagnostic runbook for external payment provider connectivity timeouts and client pooling.',
        markdownContent: `## Payment Gateway Timeout SOP\nWhen third-party payment endpoints time out, verify DNS resolution and local socket pool saturation before restarting containers.`,
        actionSteps: [
          {
            stepNumber: 1,
            instruction: 'Check DNS resolution and TCP handshake latency to api.stripe.com from container.',
            cliCommand: 'kubectl exec -it deployment/payment-service -- curl -o /dev/null -s -w "DNS: %{time_namelookup}s | Connect: %{time_connect}s | Total: %{time_total}s\\n" https://api.stripe.com/healthcheck',
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 2,
            instruction: 'Inspect socket usage statistics for payment-service node process.',
            cliCommand: 'kubectl exec -it deployment/payment-service -- netstat -ant | grep 443 | wc -l',
            isAutomated: false,
            dangerLevel: 'SAFE_READONLY',
          },
          {
            stepNumber: 3,
            instruction: 'Adjust payment-service HTTP agent keep-alive pool settings.',
            cliCommand: 'kubectl set env deployment/payment-service HTTP_CLIENT_MAX_SOCKETS=100 HTTP_CLIENT_TIMEOUT_MS=15000',
            isAutomated: false,
            dangerLevel: 'CAUTION_MUTATING',
          },
        ],
        author: 'Marcus Vance',
      },
    ]);

    // 4. Seed 5 Realistic Historical Incidents
    console.log('[Seed Script] Seeding 5 Historical Incidents with real DevOps RCA & Failed Approaches...');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    await Incident.create([
      // INC-1001: Stripe Connection Timeout
      {
        incidentNumber: 'INC-1001',
        title: 'Stripe API 504 Gateway Timeout during checkout traffic spike',
        description: 'Checkout flows intermittently failing with 504 Gateway Timeout on payment-service. Users report duplicate charge attempts.',
        severity: 'CRITICAL',
        status: 'RESOLVED',
        serviceId: serviceMap.payment,
        assignedEngineerId: engineerMap.alex,
        errorMessage: 'StripeConnectionTimeout: Connection timed out after 30000ms to api.stripe.com/v1/charges',
        errorSignature: 'StripeConnectionTimeout: Connection timed out to api.stripe.com',
        stackTrace: `StripeConnectionTimeout: Connection timed out after 30000ms to api.stripe.com/v1/charges
    at Timeout._onTimeout (/app/node_modules/stripe/lib/net/HttpClient.js:142:19)
    at listOnTimeout (node:internal/timers:573:17)
    at process.processTimers (node:internal/timers:514:7)
    at async PaymentController.charge (/app/src/controllers/payment.js:84:18)`,
        rawLogs: '[2026-09-20 14:12:01] ERROR [payment-service] Request failed: POST https://api.stripe.com/v1/charges (Timeout 30s)\n[2026-09-20 14:12:05] WARN  [payment-service] Connection pool saturated: 10/10 sockets in use.',
        metricsSnapshot: { cpuUsage: 68, memoryUsage: 72, errorRate: 28.5, latencyP99: 30000 },
        timeline: [
          {
            timestamp: new Date(now - 7 * oneDay),
            actorType: 'SYSTEM',
            actorName: 'Datadog Alert',
            action: 'Incident Triggered',
            details: 'High 5xx error rate alert fired on payment-service (> 25%).',
          },
          {
            timestamp: new Date(now - 7 * oneDay + 5 * 60000),
            actorType: 'HUMAN',
            actorName: 'Alex Chen',
            action: 'Investigating Socket Usage',
            details: 'Discovered outbound HTTP agent had maxSockets capped at default 10.',
            commandExecuted: 'kubectl exec -it deployment/payment-service -- netstat -ant | grep 443 | wc -l',
            commandOutput: '10 sockets established (100% capacity)',
          },
          {
            timestamp: new Date(now - 7 * oneDay + 24 * 60000),
            actorType: 'HUMAN',
            actorName: 'Alex Chen',
            action: 'Incident Resolved',
            details: 'Scaled HTTP client socket limits to 100 with exponential backoff retry jitter.',
          },
        ],
        hypotheses: [
          {
            statement: 'Stripe API is down globally.',
            status: 'REFUTED',
            notes: 'Stripe status page reported 100% operational.',
          },
          {
            statement: 'Outbound Node.js http.Agent connection pool is exhausted.',
            status: 'VALIDATED',
            notes: 'Confirmed netstat showed all 10 sockets stuck in TIME_WAIT.',
          },
        ],
        failedApproaches: [
          {
            actionTaken: 'Restarted all payment-service pods simultaneously.',
            whyItFailed: 'Triggered instant thundering herd of retries and dropped 120 in-flight cart sessions.',
            negativeImpact: '120 customers experienced cart loss; created 34 urgent support tickets.',
          },
        ],
        rootCause: 'Node.js http.Agent was configured with default maxSockets=10 without connection keep-alive tuning, causing queue starvation under 500 RPS traffic.',
        resolutionSummary: 'Configured custom https.Agent with maxSockets=100, keepAlive=true, and timeout=15000ms. Deployed with zero downtime rollout.',
        preventativeActions: [
          'Add Datadog metric for active HTTP client pool saturation.',
          'Standardize shared HTTP agent configuration across all backend services.',
        ],
        createdAt: new Date(now - 7 * oneDay),
        resolvedAt: new Date(now - 7 * oneDay + 24 * 60000),
        mttrMinutes: 24,
      },

      // INC-1002: JWT Verification Failure
      {
        incidentNumber: 'INC-1002',
        title: 'User login failures due to expired JWKS key set in auth-service',
        description: 'Authentication requests returning 401 Unauthorized globally. Users unable to log in or renew access tokens.',
        severity: 'HIGH',
        status: 'RESOLVED',
        serviceId: serviceMap.auth,
        assignedEngineerId: engineerMap.marcus,
        errorMessage: 'JsonWebTokenError: Unable to verify token signature: JWKS key set expired',
        errorSignature: 'JsonWebTokenError: JWKS key set expired',
        stackTrace: `JsonWebTokenError: Unable to verify token signature: JWKS key set expired
    at JwksClient.getSigningKey (/app/node_modules/jwks-rsa/lib/JwksClient.js:89:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async verifyTokenMiddleware (/app/src/middleware/auth.js:32:19)`,
        rawLogs: '[2026-09-22 09:30:10] ERROR [auth-service] Token verification failed: Kid not found in local JWKS keystore.\n[2026-09-22 09:30:12] ERROR [auth-service] Key rotation detected but cache TTL prevents re-fetch.',
        metricsSnapshot: { cpuUsage: 45, memoryUsage: 55, errorRate: 42.0, latencyP99: 120 },
        timeline: [
          {
            timestamp: new Date(now - 5 * oneDay),
            actorType: 'SYSTEM',
            actorName: 'PagerDuty',
            action: 'Incident Triggered',
            details: 'Auth error rate spiked above 40%.',
          },
          {
            timestamp: new Date(now - 5 * oneDay + 18 * 60000),
            actorType: 'HUMAN',
            actorName: 'Marcus Vance',
            action: 'Incident Resolved',
            details: 'Updated jwks-rsa client with auto-refresh rate-limiting on key miss.',
          },
        ],
        hypotheses: [
          {
            statement: 'OAuth provider rotated signing keys without notification.',
            status: 'VALIDATED',
            notes: 'Provider rotated key at 09:00 UTC.',
          },
        ],
        failedApproaches: [
          {
            actionTaken: 'Disabled token verification check in auth gateway.',
            whyItFailed: 'Immediate security audit violation; zero-trust policy triggered automated rollback.',
            negativeImpact: 'Triggered tier-1 security review.',
          },
        ],
        rootCause: 'The jwks-rsa library had cache: true with 24h TTL and no cache-miss dynamic re-fetch enabled.',
        resolutionSummary: 'Enabled jwksRequestsPerMinute: 10 with cache-miss fetch fallback.',
        preventativeActions: ['Monitor JWKS cache expiration and alert on key rotation mismatch.'],
        createdAt: new Date(now - 5 * oneDay),
        resolvedAt: new Date(now - 5 * oneDay + 18 * 60000),
        mttrMinutes: 18,
      },

      // INC-1003: Postgres Connection Pool Exhaustion
      {
        incidentNumber: 'INC-1003',
        title: 'PostgreSQL Connection Pool Exhaustion on order-processor ledger writes',
        description: 'Order submissions failing with 500 Internal Server Error. Database query latency exceeding 10 seconds.',
        severity: 'CRITICAL',
        status: 'RESOLVED',
        serviceId: serviceMap.order,
        assignedEngineerId: engineerMap.alex,
        errorMessage: 'SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out after 10000ms',
        errorSignature: 'SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out',
        stackTrace: `SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out after 10000ms
    at Timeout._onTimeout (/app/node_modules/sequelize-pool/lib/Pool.js:231:19)
    at listOnTimeout (node:internal/timers:573:17)
    at async OrderService.createOrder (/app/src/services/order.js:112:20)`,
        rawLogs: '[2026-09-24 16:40:02] ERROR [order-processor] DB connection acquire timeout after 10000ms\n[2026-09-24 16:40:05] WARN  [order-processor] Active pool: 50/50 in use, 184 waiting.',
        metricsSnapshot: { cpuUsage: 92, memoryUsage: 88, errorRate: 35.0, latencyP99: 10400 },
        timeline: [
          {
            timestamp: new Date(now - 3 * oneDay),
            actorType: 'SYSTEM',
            actorName: 'System',
            action: 'Incident Triggered',
            details: 'Database connection pool exhausted on order-processor.',
          },
          {
            timestamp: new Date(now - 3 * oneDay + 32 * 60000),
            actorType: 'HUMAN',
            actorName: 'Alex Chen',
            action: 'Incident Resolved',
            details: 'Terminated leaked transaction loops and deployed connection leak fix.',
          },
        ],
        hypotheses: [
          {
            statement: 'PostgreSQL primary server CPU throttled.',
            status: 'REFUTED',
            notes: 'Database CPU was below 30%; issue was application client pooling.',
          },
          {
            statement: 'Unclosed transaction in discount calculation routine.',
            status: 'VALIDATED',
            notes: 'Discovered missing rollback on error condition in discount promo handler.',
          },
        ],
        failedApproaches: [
          {
            actionTaken: 'Increased PostgreSQL max_connections to 500 without connection pooler.',
            whyItFailed: 'Exhausted database memory and led to OOMKilled on database primary node.',
            negativeImpact: 'Full database crash and failover required, adding 15 minutes of downtime.',
          },
        ],
        rootCause: 'Promo code discount loop opened transactions inside a try block but failed to execute rollback inside catch block on invalid promo format.',
        resolutionSummary: 'Added strict transaction rollback guards and installed PgBouncer in front of orders database.',
        preventativeActions: [
          'Enforce linter rule for mandatory transaction finally { rollback() } blocks.',
          'Deploy PgBouncer transaction pooling in production.',
        ],
        createdAt: new Date(now - 3 * oneDay),
        resolvedAt: new Date(now - 3 * oneDay + 32 * 60000),
        mttrMinutes: 32,
      },

      // INC-1004: Redis Pool Exhaustion
      {
        incidentNumber: 'INC-1004',
        title: 'Redis max clients limit reached in auth-service session cluster',
        description: 'Session checks failing with Redis max clients reached. User logins degraded.',
        severity: 'HIGH',
        status: 'RESOLVED',
        serviceId: serviceMap.auth,
        assignedEngineerId: engineerMap.sarah,
        errorMessage: 'RedisError: Max client connections reached: 10000 clients',
        errorSignature: 'RedisError: Max client connections reached',
        stackTrace: `RedisError: Max client connections reached: 10000 clients
    at Redis.sendCommand (/app/node_modules/ioredis/lib/redis.js:410:14)
    at async SessionStore.get (/app/src/stores/redisSession.js:45:18)`,
        rawLogs: '[2026-09-25 11:15:30] ERROR [auth-service] Redis connection failed: max clients reached (10000/10000)',
        metricsSnapshot: { cpuUsage: 81, memoryUsage: 90, errorRate: 22.0, latencyP99: 4500 },
        timeline: [
          {
            timestamp: new Date(now - 2 * oneDay),
            actorType: 'SYSTEM',
            actorName: 'System',
            action: 'Incident Triggered',
            details: 'Redis client connection limit reached (10k).',
          },
          {
            timestamp: new Date(now - 2 * oneDay + 28 * 60000),
            actorType: 'HUMAN',
            actorName: 'Sarah Connor',
            action: 'Incident Resolved',
            details: 'Killed zombie connections and set tcp-keepalive timeout.',
          },
        ],
        hypotheses: [
          {
            statement: 'DDoS attack opening TCP sockets.',
            status: 'REFUTED',
            notes: 'Network traffic rate was normal.',
          },
          {
            statement: 'Orphaned containers not closing Redis TCP connections on SIGTERM.',
            status: 'VALIDATED',
            notes: 'Rolling deployments over the week accumulated 7,000 dead sockets.',
          },
        ],
        failedApproaches: [
          {
            actionTaken: 'Executed FLUSHALL to reset Redis state.',
            whyItFailed: 'Logged out all 50,000 active sessions globally and created an immediate auth login storm.',
            negativeImpact: 'Login storm brought down auth-service for 10 minutes.',
          },
        ],
        rootCause: 'Docker container SIGTERM signal was swallowed by npm start script, preventing graceful ioredis.quit() shutdown.',
        resolutionSummary: 'Wrapped container entrypoint with tini init process and set tcp-keepalive=60s in Redis config.',
        preventativeActions: ['Audit all container Dockerfiles for graceful SIGTERM signal handling.'],
        createdAt: new Date(now - 2 * oneDay),
        resolvedAt: new Date(now - 2 * oneDay + 28 * 60000),
        mttrMinutes: 28,
      },

      // INC-1005: Kafka Consumer Lag Surge
      {
        incidentNumber: 'INC-1005',
        title: 'Kafka consumer rebalance storm on email-notifications topic',
        description: 'Transactional emails delayed by 45 minutes. Notification worker consumer group flapping.',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        serviceId: serviceMap.notification,
        assignedEngineerId: engineerMap.sarah,
        errorMessage: 'CommitFailedException: Commit cannot be completed since the group has already rebalanced',
        errorSignature: 'CommitFailedException: group has already rebalanced',
        stackTrace: `CommitFailedException: Commit cannot be completed since the group has already rebalanced
    at KafkaConsumer.commitSync (/app/node_modules/kafkajs/lib/consumer/runner.js:312:15)
    at async processBatch (/app/src/consumers/emailWorker.js:77:9)`,
        rawLogs: '[2026-09-26 18:00:15] WARN  [notification-worker] Heartbeat failed, coordinator initiating rebalance.\n[2026-09-26 18:01:20] ERROR [notification-worker] CommitFailedException: group rebalance took 45s.',
        metricsSnapshot: { cpuUsage: 50, memoryUsage: 60, errorRate: 15.0, latencyP99: 8500 },
        timeline: [
          {
            timestamp: new Date(now - 1 * oneDay),
            actorType: 'SYSTEM',
            actorName: 'System',
            action: 'Incident Triggered',
            details: 'Consumer lag exceeded 15,000 messages.',
          },
          {
            timestamp: new Date(now - 1 * oneDay + 45 * 60000),
            actorType: 'HUMAN',
            actorName: 'Sarah Connor',
            action: 'Incident Resolved',
            details: 'Tuned batch poll limits and decoupled synchronous SMTP calls.',
          },
        ],
        hypotheses: [
          {
            statement: 'Kafka broker partition disk full.',
            status: 'REFUTED',
            notes: 'Broker disk space was at 42%.',
          },
          {
            statement: 'Synchronous SendGrid SMTP calls blocking Kafka poll loop.',
            status: 'VALIDATED',
            notes: 'SendGrid latency increased from 200ms to 4s, causing batch time to exceed max.poll.interval.ms.',
          },
        ],
        failedApproaches: [
          {
            actionTaken: 'Spun up 20 additional consumer pods to drain queue faster.',
            whyItFailed: 'Topic only had 8 partitions, so 12 pods sat idle while triggering 6 consecutive rebalance storms.',
            negativeImpact: 'Queue processing was completely frozen for 15 minutes during constant rebalancing.',
          },
        ],
        rootCause: 'Synchronous external HTTP requests inside the Kafka batch processor caused batch processing time to exceed the 300s max.poll.interval.ms.',
        resolutionSummary: 'Decreased max.poll.records to 50 and decoupled external SMTP delivery to an internal async worker pool.',
        preventativeActions: ['Never make synchronous external API calls directly inside a Kafka consumer poll loop.'],
        createdAt: new Date(now - 1 * oneDay),
        resolvedAt: new Date(now - 1 * oneDay + 45 * 60000),
        mttrMinutes: 45,
      },
    ]);

    // 5. Seed Initial System Settings
    console.log('[Seed Script] Seeding default system settings...');
    await Setting.create([
      {
        key: 'HINDSIGHT_DEFAULT_BANK',
        value: 'fixmemory-main',
        description: 'Default memory bank identifier for FixMemory AI incident memory retention.',
      },
      {
        key: 'LLM_PROVIDER',
        value: 'gemini',
        description: 'Primary LLM reasoning provider (Gemini 2.0 Flash / OpenAI).',
      },
      {
        key: 'AUTO_TRIAGE_SEVERITY_THRESHOLD',
        value: 'HIGH',
        description: 'Minimum severity level for automated AI agent investigation dispatch.',
      },
      {
        key: 'NEGATIVE_KNOWLEDGE_GUARD_ENABLED',
        value: true,
        description: 'Enforce prominent warnings on previously recorded failed approaches.',
      },
    ]);

    console.log('\x1b[32m[Seed Script] Successfully seeded:\x1b[0m');
    console.log('  - 4 Microservices');
    console.log('  - 3 DevOps/SRE Engineers');
    console.log('  - 4 Runbooks (with safe non-auto commands)');
    console.log('  - 5 Historical Incidents (with RCA & failed approaches)');
    console.log('  - Default System Settings');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m[Seed Script Failed]\x1b[0m', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();
