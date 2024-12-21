## Introduction to Instrumentation

Instrumentation refers to the process of integrating your applications, systems, or services with monitoring tools like Prometheus by emitting custom metrics. This is essential for understanding application behavior and performance.

This involves embedding/writting code or using tools to collect metrics, logs, or traces that provide insights into how the system is performing.

**Importance of Instrumentation:**
- It helps you gain visibility into the internal state of your applications and infrastructure.
- By collecting key metrics like CPU usage, memory consumption, request rates, error rates, etc., you can understand the health and performance of your system.
- When something goes wrong, instrumentation allows you to diagnose the issue quickly by providing detailed insights.
- Without instrumentation, even the most advanced observability stack (e.g., Prometheus, Grafana, EFk, Jaeger) is of little use since it won’t receive detailed data (metrics, logs, and traces) from the applications.
- For example, generic exporters like Node Exporter provide system-level metrics (CPU, memory usage), but they can't tell how many users logged into your app or how long an HTTP request took.
- Instrumentation enables capturing business-specific metrics such as:
    - Number of user logins.
    - Accounts created within a timeframe.
    - Latency of specific APIs.
- Developers typically instrument the metrics, while DevOps teams set up the monitoring stack.

**Code-Level Instrumentation** 
- You can add instrumentation directly in your application code to expose metrics. For example, in a `Node.js` application, you might use a library like prom-client to expose custom metrics.

## Instrumentation in Prometheus:

- **Exporters**: Prometheus uses exporters to collect metrics from different systems. These exporters expose metrics in a format that Prometheus can scrape and store.
    - **Node Exporter**: Collects system-level metrics from Linux/Unix systems.
    - **MySQL Exporter (For MySQL Database)**:  Collects metrics from a MySQL database.
    - **PostgreSQL Exporter (For PostgreSQL Database)**: Collects metrics from a PostgreSQL database.
- **Custom Metrics**: You can instrument your application to expose custom metrics that are relevant to your specific use case. For example, you might track the number of user logins per minute.

## Types of Metrics in Prometheus

Prometheus provides four main metric types, each suited for different use cases:

1. **Counter**:
    - A metric that only increases. Tracks metrics that grow over time and can never be decremented. It is used for counting events like the number of HTTP requests, user account creations, errors, or tasks completed.
    - **Example**: Counting the number of times a container restarts in your Kubernetes cluster
    - **Metric Example**: `kube_pod_container_status_restarts_total`
2. **Gauge**:
    - A Gauge is a metric that represents a single numerical value that can go up and down. Suitable for metrics that reflect a current state and can vary. It is typically used for things like memory usage, CPU usage, or the current number of active users.
    - **Example**: Monitoring the memory usage of a container in your Kubernetes cluster.
    - **Metric Example**: `container_memory_usage_bytes`
3. **Histogram**:
    - A Histogram samples observations (usually things like request durations or response sizes) and counts them in configurable buckets to measure distributions.
    - It also provides a sum of all observed values and a count of observations.
    - **Example**: Measuring the response time of Kubernetes API requests in various time buckets.
    - **Metric Example**: `apiserver_request_duration_seconds_bucket`
4. **Summary**:
    - Similar to a Histogram, a Summary samples observations and provides a total count of observations, their sum, and configurable quantiles (percentiles).
    - **Example**: Monitoring the 95th percentile of request durations to understand high latency in your Kubernetes API.
    - **Metric Example**: `apiserver_request_duration_seconds_sum`

