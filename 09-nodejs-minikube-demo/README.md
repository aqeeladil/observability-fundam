# Practical Demonstration: Node Exporter, Kube-State-Metrics, Custom Metrics

## Setting up Prometheus, Grafana, and integrating with Kubernetes (minikube) on an EC2 Ubuntu instance.

### 1. Launch and update the EC2 Instance:

- Use a t2.medium instance or higher (ensure at least 4GB RAM).
- Assign a security group allowing: SSH (Port `22`), HTTP (Port `80`) and Grafana UI (Port `3000`), Prometheus (Port `9090`).

```bash
# SSH into the EC2 Instance
ssh -i <your-key.pem> ubuntu@<ec2-public-ip>

# Update the System
sudo apt update && sudo apt upgrade -y
```

### 2. Install Prerequisites

```bash
sudo apt install curl

# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x minikube-linux-amd64
sudo mv minikube-linux-amd64 /usr/local/bin/minikube

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3. Set Up the Minikube Cluster

```bash
# Start Minikube
# none driver directly installs Minikube components on the host.
minikube start --driver=none

# Verify Minikube
kubectl get nodes
```

### 4. Install Prometheus and Grafana Using Helm

```bash
# Add Helm Repo for Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus Stack
# This installs: Prometheus, Grafana, AlertManager, Node Exporter, Kube-State-Metrics
helm install prometheus-stack prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace

# Check pods and services
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 5. Access the Monitoring Stack

1. **Prometheus UI**
    `kubectl port-forward svc/prometheus-stack-kube-prometheus-prometheus -n monitoring 9090:9090 --address 0.0.0.0`
    - Access at `http://<EC2-Public-IP>:9090`.
2. **Grafana UI**
    `kubectl port-forward svc/prometheus-stack-grafana -n monitoring 3000:80 --address 0.0.0.0`
    - Access at `http://<EC2-Public-IP>:3000`.
    - Default username: `admin`, Default password: `prom-operator` (or retrieve it with `kubectl get secret`):
    `kubectl get secret prometheus-stack-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode`
3. **Alertmanager UI**:
    `kubectl port-forward svc/prometheus-stack-alertmanager -n monitoring 9093:9093 --address 0.0.0.0`
    - Access at `http://<EC2-Public-IP>:9093`
4. **Configure Data Source:**
    - Grafana should auto-detect Prometheus as a data source (If not, manually add it).
    - Navigate to Configuration > Data Sources.
    - Click Add Data Source.
    - Select Prometheus and set the URL to Prometheus service:
        `http://prometheus-stack-kube-prometheus-prometheus:9090`
    - Save and test the connection.

### 6. Test Metrics Collection

1. **View Node Exporter Metrics**
    `kubectl port-forward svc/prometheus-stack-kube-prometheus-node-exporter -n monitoring 9100:9100`
    - Access at `http://<EC2-Public-IP>:9100/metrics`.
2. **View Kube-State-Metrics**
    `kubectl port-forward svc/prometheus-stack-kube-state-metrics -n monitoring 8080:8080`
    - Access at `http://<EC2-Public-IP>:8080/metrics`.
3. **Simulate Pod Crashes**
    - Deploy a crashing pod and monitor restarts:
    `kubectl run busybox-crash --image=busybox --restart=Never -- /bin/sh -c "exit 1"`
    `kubectl get pods`
4. **In Prometheus, use PromQL to query metrics like:**
    - `kube_pod_container_status_restarts_total`: Pod restarts.
    - `node_cpu_seconds_total`: CPU usage.
    - Customize queries by adding filters, e.g.:
        - `kube_pod_container_status_restarts_total{namespace="default"}`

### 7. Set up an alert to trigger for pod restarts

1. **Edit the Prometheus rules file**
    `kubectl edit prometheusrule prometheus-stack-kube-prometheus-prometheus-rulefiles -n monitoring`
2. **Add an alert rule**
```yaml
    groups:
    - name: example-alerts
    rules:
    - alert: HighPodRestarts
        expr: sum(kube_pod_container_status_restarts_total) > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "High pod restarts detected"
          description: "A pod has restarted more than 10 times in the last minute."
```

<br>

### 8. Custom Metrics Setup

1. **Node.js Application Exposing Metrics at `/metrics`**
```bash
# Build and push the Docker image:
docker build -t <your-dockerhub-username>/http-metrics-app:latest .
docker push <your-dockerhub-username>/http-metrics-app:latest

# Apply the deployment
kubectl apply -f http-metrics-deployment.yaml

# Apply the ServiceMonitor configuration for Prometheus to Scrape Metrics
kubectl apply -f http-metrics-servicemonitor.yaml
```
2. **Forward the service port**
    `kubectl port-forward svc/http-metrics-service 3000:3000`
    - Access metrics at: `http://<EC2-Public-IP>:3000/metrics`
3. **Generate traffic to your application:**
    `curl http://<EC2-Public-IP>:3000`
    `curl http://<EC2-Public-IP>:3000/metrics`
    - Check the metrics in Prometheus or Grafana to visualize live data.

### 9. Query in Prometheus

- Open Prometheus and search for the metric `http_requests_total`
- Enter `http_requests_total` in the Graph tab.
- Check if the metric appears with labels like `method` and `status`.
- Other relevant queries to try:
    - `rate(http_requests_total[1m])`
    - `rate(http_requests_total[1m]) by (method)`
    - `rate(http_requests_total{status="500"}[1m])`
    - `(rate(http_requests_total{status="500"}[1m]) / rate(http_requests_total[1m])) * 100`

### 10. Visuale in Grafana

**Create a Custom Dashboard**
- Click + Create > Dashboard > Add new panel.
- Enter the PromQL queries:
    - `rate(http_requests_total[1m]) by (method)`
    - `(rate(http_requests_total{status="500"}[1m]) / rate(http_requests_total[1m])) * 100`
- Choose line graph for trends.
- Add thresholds (e.g., highlight error rates above 5%).
- Save the dashboard.

### 11. Set up an alert to trigger if error rates exceed 5% for 1 minute

1. **Edit the Prometheus rules file**
`kubectl edit prometheusrule prometheus-stack-kube-prometheus-prometheus-rulefiles -n monitoring`
2. **Add the alert rule**
```yaml
groups:
- name: example-alerts
  rules:
  - alert: HighErrorRate
    expr: (rate(http_requests_total{status="500"}[1m]) / rate(http_requests_total[1m])) * 100 > 5
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 5% for the last 1 minute."
```
3. **Reload Prometheus to apply the new rule**
`kubectl delete pod -l app=prometheus -n monitoring`
4. **Test Alerts: Simulate errors by hitting the `/error` endpoint:**
`curl http://<ec2-ip-address>:3000/error`
5. **Check alerts in Prometheus under the "Alerts" tab.**

### 12. Clean Up Resources

To delete all resources created:
```bash
helm uninstall prometheus-stack -n monitoring
kubectl delete namespace monitoring
kubectl delete -f http-metrics-deployment.yaml
kubectl delete -f http-metrics-servicemonitor.yaml
```

