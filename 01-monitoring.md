# Introduction to Monitoring

## Metrics vs Monitoring

Metrics are measurements or data points that tell you what is happening. For example, the number of steps you walk each day, your heart rate, or the temperature outside—these are all metrics. Metrics like CPU utilization, memory usage, or HTTP request counts help assess system health, diagnose issues, and make decisions.

Monitoring is the process of keeping an eye on these metrics over time to understand what’s normal, identify changes, and detect problems. It's like watching your step count daily to see if you're meeting your fitness goal or checking your heart rate to make sure it's in a healthy range.

**Monitoring builds upon metrics by:**
- Collecting Metrics: Automatically pulling or receiving metrics.
- Visualizing Metrics: Converting raw data into user-friendly dashboards (e.g., If CPU utilization spikes unexpectedly, a monitoring system could generate a Slack message alert for engineers).
- Alerting: Triggering notifications or alerts based on predefined conditions (e.g., CPU usage > 80%).

**Prometheus and Grafana are popular tools used for monitoring and visualization:**
- Prometheus: An open-source monitoring and alerting system with a time-series database.
- Grafana: A visualization tool that retrieves data from Prometheus (and other sources) to display it on customizable dashboards.
- Prometheus fetches data from Kubernetes API server (default metrics). Grafana pulls data from Prometheus and displays it.

## Why Monitoring Matters

Monitoring your Kubernetes cluster is essential for ensuring the health and performance of your applications and infrastructure. Single Kubernetes clusters are manageable, but monitoring becomes critical in environments with multiple clusters (e.g., development, staging, production). 

- Use monitoring to:
    - Detect Problems Early
    - Measure Performance:
    - Ensure Availability:
    
Here are some reasons why monitoring your Kubernetes cluster is important:

- **Identify issues and troubleshoot:** By monitoring your Kubernetes cluster, you can quickly identify issues in deployments, services, or clusters (such as application crashes, resource bottlenecks, and network problems). With real-time monitoring, you can troubleshoot issues before they escalate and impact your users.

- **Optimize performance and capacity:** Monitoring allows you to track the performance of your applications and infrastructure over time, and identify opportunities to optimize performance and capacity. By understanding usage patterns and resource consumption, you can make informed decisions about scaling your infrastructure and improving the efficiency of your applications.

- **Ensure high availability:** Kubernetes is designed to provide high availability for your applications, but this requires careful monitoring and management. By monitoring your cluster and setting up alerts, you can ensure that your applications remain available even in the event of failures or unexpected events.

- **Security and compliance:** Monitoring your Kubernetes cluster can help you identify potential security risks and ensure compliance with regulations and policies. By tracking access logs and other security-related metrics, you can quickly detect and respond to potential security threats.

## Prometheus

Prometheus is an open-source systems monitoring and alerting toolkit originally built at SoundCloud.

1. **Scrapes Metrics:** Pulls data from various sources (using exporters or application endpoints).
2. **Stores Metrics:** Saves data in a time-series database, where each data point is timestamped.
3. **Supports Querying:** Allows users to analyze metrics using a query language called PromQL (Prometheus Query Language).
4. **Integrates with Grafana:** Enhances visualization via rich dashboards.
5. **Manages Alerts:** Configures alerts through its Alert Manager.
6. **Usage:** It can be configured and set up on both bare-metal servers and container environments like Kubernetes.

Prometheus is a popular choice for Kubernetes monitoring for several reasons:

- **Open-source:** Prometheus is an open-source monitoring and alerting system that helps you collect and store metrics about your software systems and infrastructure, and analyze that data to gain insights into their health and performance. It is free to use and has a large community of contributors. This means that you can benefit from ongoing development, bug fixes, and feature enhancements without paying for a commercial monitoring solution.

- **Native Kubernetes support:** Prometheus is designed to work seamlessly with Kubernetes, making it easy to deploy and integrate with your Kubernetes environment. It provides pre-configured Kubernetes dashboards and supports auto-discovery of Kubernetes services and pods.

- **Powerful query language:** Prometheus provides a powerful query language that allows you to easily retrieve and analyze metrics data. This allows you to create custom dashboards and alerts, and to troubleshoot issues more easily.

- **Scalability:** Prometheus is designed to be highly scalable, allowing you to monitor large and complex Kubernetes environments with ease. It supports multi-node architectures and can handle large volumes of data without significant performance degradation.

- **Integrations:** Prometheus integrates with a wide range of other tools and systems, including Grafana for visualization, Alertmanager for alerting, and Kubernetes API server for metadata discovery. With Prometheus, you can easily monitor metrics such as CPU usage, memory usage, network traffic, and application-specific metrics, and use that data to troubleshoot issues, optimize performance, and create alerts to notify you when things go wrong.

## Why Use Grafana with Prometheus?

1. **Better Visualizations:** Prometheus’s UI is basic; Grafana provides intuitive dashboards with advanced features like filtering, graphing, and drill-downs.
2. **Authentication and Permissions:** Grafana supports user management, enabling role-based access control.
3. **Multi-source Monitoring:** Grafana can combine data from multiple sources (e.g., Prometheus, InfluxDB, Nagios).
4. **Default Dashboards:** Pre-built dashboards display metrics like pod CPU/memory usage. Users can: 
    - Filter by namespace or pod. 
    - Adjust the time range (e.g., last 5 minutes, 1 day).
5. **Custom Dashboards:** Users can create custom dashboards by:
    - Writing PromQL queries (e.g., for pod restarts).
    - Saving these queries as widgets on Grafana dashboards.
    - Sharing dashboards with teams for daily monitoring.
6. **Multi-source Support:** Grafana supports integration with various monitoring systems, allowing flexibility if an organization switches tools.

## Prometheus Architecture

The architecture of Prometheus is designed to be highly flexible, scalable, and modular. It consists of several core components, each responsible for a specific aspect of the monitoring process.

![Alt text](https://prometheus.io/assets/architecture.png).

![Prometheus Architecture](images/prometheus-architecture.gif).

### 1. Prometheus Server

Prometheus server is the core of the monitoring system. It is responsible for scraping metrics (data) from various configured targets (e.g; Kubernetes objects exposed by the Kubernetes API server), storing them in its time-series database (TSDB), and serving queries through its HTTP API.
- Components:
    - **Retrieval**: This module handles the scraping of metrics from endpoints, which are discovered either through static configurations or dynamic service discovery methods.
    - **TSDB (Time Series Database)**: The data scraped from targets is stored in the TSDB, which is designed to handle high volumes of time-series data efficiently. Metrics are timestamped and stored with key-value pairs, enabling efficient querying and tracking over time.
    - **HTTP Server**: This provides an API for querying data using PromQL, retrieving metadata, and interacting with other components of the Prometheus ecosystem.
    - **Storage**: The scraped data is stored on local disk (HDD/SSD) in a format optimized for time-series data.

### 2. Service Discovery

Service discovery automatically identifies and manages the list of scrape targets (i.e., services or applications) that Prometheus monitors. This is crucial in dynamic environments like Kubernetes where services are constantly being created and destroyed.
- Components:
    - **Kubernetes**: In Kubernetes environments, Prometheus can automatically discover services, pods, and nodes using Kubernetes API, ensuring it monitors the most up-to-date list of targets.
    - **File SD (Service Discovery)**: Prometheus can also read static target configurations from files, allowing for flexibility in environments where dynamic service discovery is not used.

### 3. Pushgateway

Prometheus uses pull-based scraping, but it allows a push gateway when needed:

**Pull Mechanism:**
- Prometheus actively queries endpoints to retrieve metrics.
- Configured targets can include system nodes, Kubernetes services, or application endpoints.

**Push Gateway:**
- Used for short-lived jobs or tasks that have a limited lifespan that can't be scraped directly.
- Applications push metrics to this gateway, and Prometheus retrieves them.

    - It's particularly useful for batch jobs  and would otherwise not have their metrics collected.

### 4. Alertmanager

The Alertmanager is responsible for managing alerts generated by the Prometheus server. Alerts get triggered when predefined conditions are met. Alerts can be sent to communication channels like Slack or email.

### 5. Data Exporters

Exporters are small applications that collect custom metrics from various third-party systems and expose them in a format Prometheus can scrape. They are essential for monitoring systems that do not natively support Prometheus.
- Types of Exporters:
    - Common exporters include the Node Exporter (for hardware metrics), the MySQL Exporter (for database metrics), and various other application-specific exporters.
    - **Node Exporter:** A daemon running on each Kubernetes node. Collects system-level metrics like CPU and memory utilization. It runs as a Kubernetes DaemonSet to ensure one instance per node.
    - **Kube-State Metrics:** A pod that scrapes Kubernetes API server metrics (e.g; pod statuses, replica sets, deployments, and custom resources) that are not exposed by default by the Kubernetes API server. Only a single instance is needed since it communicates with the API server.
    - **Custom Metrics:** Metrics generated by applications, such as HTTP request latencies or user activity. These require developers to instrument the application using tools like OpenTelemetry. Developers can expose application-specific metrics via /metrics endpoints using Prometheus libraries. To enable Prometheus to collect these custom metrics, the exposed endpoints must be added to its configuration.

### 6. PromQL (Prometheus Query Language)

PromQL is a domain-specific language for querying metrics. PromQL enables granular analysis of metrics, making it easier to identify patterns or outliers. It supports operations like filtering by labels (e.g., namespaces or pods) and aggregating (e.g., sums, averages).

### 7. Prometheus Web UI

The Prometheus Web UI allows users to explore the collected metrics data, run ad-hoc PromQL queries, and visualize the results directly within Prometheus.

### 8. API Clients
- API clients interact with Prometheus through its HTTP API to fetch data, query metrics, and integrate Prometheus with other systems or custom applications.


