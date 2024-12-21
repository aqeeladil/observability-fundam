# Golang Eks Observability Setup

### Step 1: Launch and connect to the EC2 Instance:
- Select the latest Ubuntu AMI.
- Choose a t2.medium or larger instance type (for sufficient resources).
- Assign a security group allowing: 
    - SSH (Port `22`)
    - HTTP (Port `80`)
    - NodeJS app (Port `3001` & `3002`)
    - Grafana UI (Port `3000`)
    - Prometheus (Port `9090`)
    - Alertmanager (Port `9093`)
    - Kibana (Port `5601`)
    - Jaeger (Port `16686`)
    - `3000-30002` (Kibana, Grafana, Jaeger)
    - NodePort range (`30000-32767`)
- Connect to the instance.
    - `ssh -i "your-key.pem" ubuntu@<instance-public-ip>`

### Step 2: Update the System & Install Pre-requisites
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl tar unzip -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
# To ensure Docker Compose is accessible from any directory:
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
docker-compose --version

# Install Kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Aws CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
rm awscliv2.zip

# Configure awscli (Obtain ```Access-Key-ID``` and ```Secret-Access-Key``` from the AWS Management Console).
aws configure

# Install eksctl
curl -LO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"
tar -xzf eksctl_$(uname -s)_amd64.tar.gz
sudo mv eksctl /usr/local/bin
eksctl version
rm eksctl_$(uname -s)_amd64.tar.gz

# Install Helm
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### Step 3: Set Up the EKS Cluster
```bash
# Create an EKS Cluster.
eksctl create cluster --name=observability \ 
                    --region=us-east-1 \
                    --zones=us-east-1a,us-east-1b \
                    --without-nodegroup
```
```bash
# Associate an IAM OIDC (OpenID Connect) provider with the cluster, allowing the cluster to integrate with AWS IAM roles.
# This step is essential for enabling Prometheus, external-dns, ALB ingress, and other AWS services. 

eksctl utils associate-iam-oidc-provider \
    --region us-east-1 \
    --cluster observability \
    --approve
```
```bash
# Add a private managed node group to the cluster.

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
```bash
# Update ./kube/config file to access the cluster using kubectl.
aws eks update-kubeconfig --name observability

# Verify the cluster.
kubectl get nodes
```

### Step 4: Configure AWS EBS Storage Class using eksctl
```bash
# Create IAM Role for Service Account.

eksctl create iamserviceaccount \
    --name ebs-csi-controller-sa \
    --namespace ebs-resource \
    --cluster observability \
    --role-name AmazonEKS_EBS_CSI_DriverRole \
    --role-only \
    --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
    --approve

# This command creates an IAM role for the EBS CSI controller.
# IAM role allows EBS CSI controller to interact with AWS resources, specifically for managing EBS volumes in the Kubernetes cluster.
# We will attach the Role with service account
```
```bash
# Retrieve ARN of the IAM role created for the EBS CSI controller service account.

ARN=$(aws iam get-role --role-name AmazonEKS_EBS_CSI_DriverRole --query 'Role.Arn' --output text)
```
```bash
# Deploy EBS CSI Driver as an addon to your Kubernetes cluster.
# It uses the previously created IAM service account role to allow the driver to manage EBS volumes securely.

eksctl create addon --cluster observability --name aws-ebs-csi-driver --version latest \
    --service-account-role-arn $ARN --force
```

### Step 5: Understand the Application
- We have two very simple microservice A (`microservice-a`) & B (`microservice-a`), Built with Golang using the Gin web framework for handling HTTP requests.
- **Microservice A** API Endpoints:
    - `GET /hello-a` – Returns a greeting message
    - `GET /call-b` – Calls another service (Service B) and returns its response
    - `GET /getme-coffee` – Fetches and returns data from an external coffee API
- **Microservice B** API Endpoints:
    - `GET /hello-b` – Returns a greeting message
    - `GET /call-a` – Calls another service (Service A) and returns its response
    - `GET /getme-coffee` – Fetches and returns data from an external coffee API
- **Observability:**
    - OpenTelemetry SDK integrated for tracing and metrics.
    - Metrics and traces are exported to the OpenTelemetry Collector via OTLP over HTTP.
- **Instrumentation:**
    - Uses OpenTelemetry middleware (otelgin) for automatic request tracing.
    - Instruments HTTP clients with otelhttp for distributed tracing of outbound requests.

### Step 6: Dockerize & push it to the registry
```bash
docker build -t <<NAME_OF_YOUR_REPO>>:<<TAG>> microservice-a/
docker build -t <<NAME_OF_YOUR_REPO>>:<<TAG>> microservice-b/

docker login
docker push  <<NAME_OF_YOUR_REPO>>:<<TAG>>
docker push  <<NAME_OF_YOUR_REPO>>:<<TAG>>
```

### Step 7: Create Namespace for observability components
```bash
kubectl create namespace olly
```

### Step 8: Install Elasticsearch on K8s
```bash
helm repo add elastic https://helm.elastic.co

helm install elasticsearch \
 --set replicas=1 \
 --set volumeClaimTemplate.storageClassName=gp2 \
 --set persistence.labels.enabled=true elastic/elasticsearch -n olly
```

### Step 9: Export Elasticsearch CA Certificate
- This command retrieves the CA certificate from the Elasticsearch master certificate secret and decodes it, saving it to a ca-cert.pem file.
```bash
kubectl get secret elasticsearch-master-certs -n olly -o jsonpath='{.data.ca\.crt}' | base64 --decode > ca-cert.pem
```

### Step 10: Create ConfigMap for Jaeger's TLS Certificate
- Creates a ConfigMap in the olly namespace, containing the CA certificate to be used by Jaeger for TLS.
```bash
kubectl create configmap jaeger-tls --from-file=ca-cert.pem -n olly
```

### Step 11: Create Secret for Elasticsearch TLS
- Creates a Kubernetes Secret in the olly namespace, containing the CA certificate for Elasticsearch TLS communication.
```bash
kubectl create secret generic es-tls-secret --from-file=ca-cert.pem -n olly
```

### Step 12: Retrieve Elasticsearch Username & Password
```bash
# for username
kubectl get secrets --namespace=olly elasticsearch-master-credentials -ojsonpath='{.data.username}' | base64 -d
# for password
kubectl get secrets --namespace=olly elasticsearch-master-credentials -ojsonpath='{.data.password}' | base64 -d

# Retrieves the password for the Elasticsearch cluster's master credentials from the Kubernetes secret.
# The password is base64 encoded, so it needs to be decoded before use.
# Please write down the password for future reference.
```

### Step 13: Install Kibana
```bash
helm install kibana --set service.type=LoadBalancer elastic/kibana -n olly
```
- Kibana provides a user-friendly interface for exploring and visualizing data stored in Elasticsearch.
- It is exposed as a LoadBalancer service, making it accessible from outside the cluster.
- To verify the setup, access the Kibana dashboard by entering the `LoadBalancer DNS name followed by :5601 in your browser.
    - `http://LOAD_BALANCER_DNS_NAME:5601`
- Use the username and password retrieved in previous steps to log in.
- Once logged in, create a new data view in Kibana and explore the logs collected from your Kubernetes cluster.

### Step 14: Install Fluentbit with Custom Values/Configurations
- 👉 **Note**: Please update the `HTTP_Passwd` field in the `fluentbit-values.yml` file with the password retrieved earlier.
```bash
helm repo add fluent https://fluent.github.io/helm-charts
helm install fluent-bit fluent/fluent-bit -f fluentbit-values.yaml -n olly
```

### Step 15: Install Jaeger with Custom Values
- **Note**: Please update the `password` field and other related field in the `jaeger-values.yaml` file with the password retrieved earlier.
-  Command installs Jaeger into the olly namespace using a custom `jaeger-values.yaml` configuration file. Ensure the password is updated in the file before installation.
```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

helm install jaeger jaegertracing/jaeger -n olly --values jaeger-values.yaml
```

### Step 16: Access UI - Port Forward Jaeger Query Service
`kubectl port-forward svc/jaeger-query 8080:80 -n olly --address 0.0.0.0`

### Step 17: Install Opentelemetry-collector
`helm install otel-collector open-telemetry/opentelemetry-collector -n olly --values otel-collector-values.yaml`

### Step 18: Install prometheus
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install  prometheus prometheus-community/prometheus -n olly --values prometheus-values.yaml
```

### Step 19: Deploy the applicaiton
- ***Note:*** - Review the Kubernetes manifest files located in `./k8s-manifest`. and you should change image name & tag with your own image
```bash
kubectl apply -k k8s-manifests/
```
- ***Note***: wait for 5 minutes till you load balancer comes in running state

## Step 20: Generate Load
- Script: `test.sh` takes two load balancer DNS addresses as input arguments and alternates requests between them using curl.
- `test.sh` Continuously sends random HTTP requests every second to predefined routes on two provided load balancer DNSs
- ***Note:*** Keep the script running in another terminal to quickly gather metrics & traces.

```bash
./test.sh http://Microservice_A_LOAD_BALANCER_DNS http://Microservice_B_LOAD_BALANCER_DNS
```

### Step 21: Access the UI of Prometheus
```bash
kubectl port-forward svc/prometheus-server 9090:80 -n olly
```
- Look for your application's metrics like `request_count`, `request_duration_ms`, `active_requests` and other to monitor request rates & performance.

### Step 22: Access the UI of Jaeger
```bash
kubectl port-forward svc/jaeger-query 8080:80 -n olly
```
-  Look for traces from the service name microservice-a, microservice-b and operations such as `[/hello-a, /call-b, and /getme-coffee]` or `[/hello-b, /call-a, and /getme-coffee]` to monitor request flows and dependencies.

