## Kubernetes Monitoring Setup (Minikube, Prometheus, Grafana)

### 1. Launch the EC2 Instance:
- Use a t2.medium instance or higher (ensure at least 4GB RAM).
- Open the following ports in the security group: `30000-32767` (for NodePort services like Prometheus and Grafana), `22` (for SSH)

```bash
# SSH into the EC2 Instance
ssh -i <your-key.pem> ubuntu@<ec2-public-ip>

# Update the System
sudo apt update && sudo apt upgrade -y
```

### 2. Install Prerequisites
```bash
sudo apt install curl

# Install Kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3. Set Up the Minikube Cluster
```bash
# Start Minikube
minikube start --driver=none

# Verify Minikube
kubectl get nodes
```

### 4. Install Prometheus Using Helm
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack
kubectl get pods
kubectl expose service prometheus-kube-prometheus-prometheus --type=NodePort --name=prometheus-ext

# Get the Prometheus Port
kubectl get svc prometheus-ext
```
Access Prometheus at `http://<ec2-public-ip>:<prometheus-nodeport>`

### 5. Install Grafana Using Helm
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install grafana grafana/grafana
kubectl expose service grafana --type=NodePort --name=grafana-ext

kubectl get svc grafana-ext

# Get Grafana Admin Password
kubectl get secret grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```
Access Grafana at `http://<ec2-public-ip>:<grafana-nodeport>`

### 6. Configure Prometheus as a Data Source in Grafana
- Log in to Grafana using the `admin` credentials.
- Navigate to `Configuration` > `Data Sources` > `Add Data Source`.
- Select Prometheus and enter URL: `http://<ec2-public-ip>:<prometheus-nodeport>`
- Save and test the connection.

### 7. Import a Pre-Built Kubernetes Dashboard in Grafana
- Go to Dashboards > Create > Import.
- Enter Dashboard ID: `3662`(or any predefined ID for Kubernetes monitoring).
- Click Load, select Prometheus as the data source and click Import.

A complete Kubernetes dashboard is now displayed, showing:
- Node metrics
- API server health
- Pod statuses
- Deployment replicas

### 8. Expose and Use Cube State Metrics
```bash
kubectl get pods
kubectl expose service kube-state-metrics --type=NodePort --name=cube-state-metrics-ext
kubectl get svc cube-state-metrics-ext
```
Access Cube State Metrics at `http://<ec2-public-ip>:<cube-state-metrics-nodeport>/metrics`

**Configure Cube State Metrics in Prometheus:**
```bash
kubectl get cm
kubectl edit configmap prometheus-server
```

Add the following scrape config:
```yaml
- job_name: 'kube-state-metrics'
  static_configs:
    - targets: ['<ec2-public-ip>:<cube-state-metrics-nodeport>']
```

**Restart Prometheus:**
`kubectl rollout restart deployment prometheus-server`

### 9. View the Dashboard
- Refresh the imported Grafana dashboard to see real-time metrics from Kubernetes, including:
  - Node health
  - Deployment replicas
  - Pod statuses
  - API server performance




