## Setting Up Monitoring for a AWS EKS Cluster 

### Step 1: Launch and Configure an EC2 Instance

1. **Launch EC2 Instance:**
    - Select the latest Ubuntu AMI.
    - Use a t2.medium instance type (minimum recommended).
    - Configure key pair for SSH access.
    - Ensure the instance has an IAM role with access to EKS.
    - Assign a security group allowing: SSH (Port `22`), HTTP (Port `80`) and Grafana UI (Port `3000`), Prometheus (Port `9090`).
    - Ensure Kubernetes context points to your EKS cluster.
2. **Connect to the Instance:**
    `ssh -i "your-key.pem" ubuntu@<instance-public-ip>`
3. **Install Required Tools:**
```bash
    sudo apt update
    sudo apt install curl unzip -y

    # Install awscli
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    aws --version

    # Configure awscli (Obtain ```Access-Key-ID``` and ```Secret-Access-Key``` from the AWS Management Console).
    aws configure
    
    # Install kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/

    # Install eksctl
    curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
    sudo mv /tmp/eksctl /usr/local/bin
    eksctl version

    # Install Helm
    curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
```

### Step 2: Create EKS Cluster

1. **Create an EKS Cluster**
```bash
    eksctl create cluster --name=observability \ 
                          --region=us-east-1 \
                          --zones=us-east-1a,us-east-1b \
                          --without-nodegroup
```
2. **Associate IAM OIDC (OpenID Connect) Provider**
Enable the IAM OIDC provider for your EKS cluster (required for Prometheus and other service roles):  
```bash
    eksctl utils associate-iam-oidc-provider \
        --region us-east-1 \
        --cluster observability \
        --approve
```
3. **Add a Node Group**
```bash
    eksctl create nodegroup --cluster=observability \
                            --region=us-east-1 \
                            --name=observability-ng-private \
                            --node-type=t3.medium \
                            --nodes-min=2 \
                            --nodes-max=3 \
                            --node-volume-size=20 \
                            --managed \
                            --asg-access \
                            --external-dns-access \
                            --full-ecr-access \
                            --appmesh-access \
                            --alb-ingress-access \
                            --node-private-networking
```
4. **Verify the Cluster**
```bash
    # Update ./kube/config file

    aws eks update-kubeconfig --name observability
    kubectl get nodes
```

### Step 3: Install kube-prometheus-stack (Prometheus, Grafana, Alert Manager) 

**NOTE:** *The kube-prometheus-stack is a Helm chart that bundles Prometheus, Grafana, Alert Manager, and various exporters for Kubernetes environments.*
 
```bash
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update

    # Create Namespace for Monitoring
    kubectl create ns monitoring

    # Deploy the Monitoring Stack
    # This installs: Prometheus, Grafana, AlertManager, Node Exporter, Kube-State-Metrics
    helm install monitoring prometheus-community/kube-prometheus-stack \
        -n monitoring \
```
```bash
    # Verify the Installation
    kubectl get pods -n monitoring
    kubectl get all -n monitoring
```

### Step 4: Access Monitoring UIs

1. **Prometheus UI**
    `kubectl port-forward service/prometheus-stack-kube-prometheus-prometheus -n monitoring 9090:9090 --address 0.0.0.0`
    - Access at `http://<EC2-Public-IP>:9090`.
2. **Grafana UI**
    `kubectl port-forward service/monitoring-grafana -n monitoring 3000:80 --address 0.0.0.0`
    - Access at `http://<EC2-Public-IP>:3000`.
    - Default username: `admin`, Default password: `prom-operator` (or retrieve it with `kubectl get secret`):
    `kubectl get secret monitoring-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode`
3. **Alertmanager UI**:
    `kubectl port-forward service/alertmanager-operated -n monitoring 9093:9093 --address 0.0.0.0`
    - Access at `http://<EC2-Public-IP>:9093`.
4. **Configure Prometheus as a Data Source in Grafana**
    - Log in to Grafana using the `admin` credentials.
    - Navigate to `Configuration` > `Data Sources` > `Add Data Source`.
    - Select Prometheus and enter URL: `http:prometheus-stack-kube-prometheus-prometheus:9090`
    - Save and test the connection.
5. **Import Pre-Built Dashboards**
    - Go to `Create` > `Import`.
    - Use Grafana’s dashboard library and import ID `3119` for Kubernetes cluster monitoring.

### Step 5: Deploy and Monitor NGINX Application

1. **Deploy Application**
    `kubectl apply -f nginx-deployment.yaml`
2. **Monitor Metrics**
    - In Prometheus, search for metrics like:
    `rate(http_requests_total[5m])`
    - Grafana Dashboards: Create custom Grafana panel for the NGINX service.
        - CPU Usage:
        `sum(rate(container_cpu_usage_seconds_total[5m])) by (namespace, pod)`
        - Memory Usage:
        `sum(container_memory_usage_bytes) by (namespace, pod)`
3. **Apply Alerts**
    `kubectl apply -f alert-rules.yaml -n monitoring`

### Step 6: Test the Setup

1. **Simulate Traffic:** 
    - Generate traffic to the NGINX application:
    ```bash
    kubectl run -it load-generator --image=busybox -- /bin/sh
    while true; do wget -q -O- http://nginx-service.monitoring.svc.cluster.local; done
    ```
2. **Observe Metrics:**
    - View metrics in Prometheus and Grafana dashboards.
    - Check for triggered alerts.

### Step 7: Clean UP

```bash
    # Uninstall Monitoring Stack
    helm uninstall monitoring --namespace monitoring

    # Delete namespace
    kubectl delete ns monitoring

    # Delete Cluster & everything else
    eksctl delete cluster --name observability
```
