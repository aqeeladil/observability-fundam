# Introduction to Observability

Observability is the ability to understand the internal state (app, infrastructure, network) of a system by analyzing the data it produces, including metrics, logs and traces. Observability helps us understand why our systems are behaving the way they are. It enables diagnosis of issues, understanding of system behavior, and implementation of proactive measures.

It goes beyond traditional monitoring by answering:
- What: Identifies the current system state.
- Why: Explains deviations from expected behavior.
- How: Provides actionable insights to resolve issues.

1. **Monitoring(Metrics):** 
    - Involves tracking system metrics like CPU usage, memory usage, and network performance.
    - Provides alerts based on predefined thresholds and conditions. 
    - Helps analyze historical trends.
2. **Logging(Logs):** 
    - Capture detailed event information (e.g., errors, debug data) from various components of a system. 
    - Provides specific reasons for anomalies or failures.
3. **Tracing(Traces):** 
    - Involves tracking the flow of a request or transaction as it moves through different services and components (e.g., from frontend to database) within a system.
    - Helps identify bottlenecks and failures.

![Introduction to Observability](images/Introduction-to-Observability.png)

![why-monitoring-why-observability](images/why-monitoring-why-observability.png)

<br>

## Difference Between Monitoring and Observability?

**Monitoring:**
- A subset of observability focused on metrics and alerts.
- It focuses on tracking specific metrics and alerting on predefined conditions
- Provides real-time system status and thresholds.

**Observability:**
- Includes monitoring but also provides logs and traces for deeper insights.

<br>

## What Can Be Monitored?

- **Infrastructure:** CPU usage, memory usage, disk I/O, network traffic.
- **Applications:** Response times, error rates, throughput.
- **Databases:** Query performance, connection pool usage, transaction rates.
- **Network:** Latency, packet loss, bandwidth usage.
- **Security:** Unauthorized access attempts, vulnerability scans, firewall logs.

## What Can Be Observed?

- **Metrics:** Quantitative data points like CPU load, memory consumption, and request counts.
- **Logs:** Detailed records of events and transactions within the system.
- **Traces:** Data that shows the flow of requests through various services and components.

<br>

## Bare-Metal Servers vs Kubernetes

**Bare-Metal Servers:**
- Relatively static infrastructure and limited scalability.
- Focuses on hardware (CPU, disk, memory).
- Minimal observability needs.
- Nagios, Zabbix, or Prometheus for basic monitoring.
- Challenges: Hardware failures and resource limits.
- Metrics: CPU, memory, disk usage on physical servers.
- Logging: Logs from OS and applications on a single server.
- Tracing: Minimal tracing, single-application focus.
- Use Case: Monitoring disk space usage.

**Kubernetes:**
- Dynamic, containerized environments with scaling.
- Focuses on hardware (CPU, disk, memory) and extends to containers, pods, services, and nodes.
- High observability needs due to distributed architecture. Requires advanced tools.
- Prometheus, Grafana, Jaeger, OpenTelemetry for deep observability.
- Challenges: Container orchestration, service communication, and ephemeral pods.
- Metrics: Pod restarts, cluster health, container resource usage.
- Logging: Logs aggregated across multiple containers and nodes.
- Tracing: Distributed tracing across services in a microservices architecture.
- Use Case: Observing a failing pod in a Kubernetes cluster and tracing request failures.

<br>

## Why Observability Matters

Modern systems are complex and distributed. Observability ensures:
- Rapid identification and resolution of issues.
- Maintenance of SLAs and customer satisfaction.
- Efficient resource utilization and cost savings.

## Practical Use Case

**For example, a Resume Builder application:**
- Running on Kubernetes with AWS infrastructure.
- Observability ensures service-level agreements (SLAs) like 99.9% uptime and request response times are met.
    - metrics identify SLA violations.
    - logs explain failures.
    - traces pinpoint issues.

<br>

## What are the Tools Available?

**Monitoring Tools**: 
- Prometheus: Open-source metrics collection and alerting.
- Grafana: Data visualization and analytics
- Nagios: Monitoring system for network and system health.
- Zabbix: Monitors servers, networks, and cloud environments.
- Datadog: Cloud-based monitoring with integrations for modern systems.

**Observability Tools**:

- Metrics Collection: Prometheus, CloudWatch (AWS), Azure Monitor.
- Log management: EFK/ELK Stack (Elasticsearch, Fluent-Bit/Logstash, Kibana).
- Distributed Tracing: Jaeger, OpenTelemetry, Zipkin.
- eBPF: High-performance observability for networking and applications.
- All-in-One Platforms: Splunk, Dynatrace, New Relic.
