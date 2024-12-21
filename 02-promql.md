## PromQL (Prometheus Query Language)

PromQL is a domain-specific language for querying metrics. PromQL enables granular analysis of metrics, making it easier to identify patterns or outliers. It supports operations like filtering by labels (e.g., namespaces or pods) and aggregating (e.g., sums, averages).

## Key Features of PromQL:

- Selecting Time Series: You can select specific metrics with filters and retrieve their data.
- Mathematical Operations: PromQL allows for mathematical operations on metrics.
- Aggregation: You can aggregate data across multiple time series.
- Functionality: PromQL includes a wide range of functions to analyze and manipulate data.

## Labels:

Metrics are paired with Labels. Labels are key-value pairs that allow you to differentiate between dimensions of a metric, such as different services, instances, or endpoints.

**Example:**
`container_cpu_usage_seconds_total{namespace="kube-system", endpoint="https-metrics"}`

- `container_cpu_usage_seconds_total` is the metric.
- `{namespace="kube-system", endpoint="https-metrics"}` are the labels.

## Basic Examples of PromQL

```bash
# Shows the rate of HTTP requests in the last 5 minutes
rate(http_requests_total[5m])

# Aggregates CPU usage for a specific instance
sum(cpu_usage{instance="app-server"})

# Averages memory usage over the past hour
avg_over_time(memory_usage[1h])

# Return all time series with the metric `container_cpu_usage_seconds_total`
container_cpu_usage_seconds_total

# Return all time series with the metric `container_cpu_usage_seconds_total` and the given `namespace` and `pod` labels
container_cpu_usage_seconds_total{namespace="kube-system",pod=~"kube-proxy.*"}

# Return a whole range of time (in this case 5 minutes up to the query time) for the same vector, making it a range vector
container_cpu_usage_seconds_total{namespace="kube-system",pod=~"kube-proxy.*"}[5m]
```

## Aggregation & Functions in PromQL

Aggregation in PromQL allows you to combine multiple time series into a single one, based on certain labels.

- **Sum Up All CPU Usage**:
    `sum(rate(node_cpu_seconds_total[5m]))`
    - This query aggregates the CPU usage across all nodes.

- **Average Memory Usage per Namespace:**
    `avg(container_memory_usage_bytes) by (namespace)`
    - This query provides the average memory usage grouped by namespace.

- **rate() Function:**
    - The rate() function calculates the per-second average rate of increase of the time series in a specified range.
    `rate(container_cpu_usage_seconds_total[5m])`
    - This calculates the rate of CPU usage over 5 minutes.

- **increase() Function:**
    - The increase() function returns the increase in a counter over a specified time range.
    `increase(kube_pod_container_status_restarts_total[1h])`
    - This gives the total increase in container restarts over the last hour.

- **histogram_quantile() Function:**
    - The histogram_quantile() function calculates quantiles (e.g., 95th percentile) from histogram data.
    `histogram_quantile(0.95, sum(rate(apiserver_request_duration_seconds_bucket[5m])) by (le))`
    - This calculates the 95th percentile of Kubernetes API request durations.
