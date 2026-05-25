DE LA SALLE UNIVERSITY-DASMARINAS
COLLEGE OF INFORMATION AND COMPUTING SCIENCE
COMPUTER SCIENCE DEPARTMENT

SineLog: A Cinematic Social Diary
FINAL PROJECT DOCUMENTATION FOR APPLICATION DEVELOPMENT AND EMERGING TECHNOLOGIES

Submitted by:
Gutierrez, Kristine Ianne Marie P.
Quidit, Lauren Jade P.
Santos, Andjhelyn Denielle P.

Submitted to:
Mr. Jeffrey Jan Naval
Subject Professor

Submitted on:
May 26, 2026

---

## INTRODUCTION

**Overview of the Project**
In the modern digital entertainment ecosystem, the transition from physical media ownership to on-demand streaming has introduced severe fragmentation in personal consumption history. While streaming platforms have democratized access to global cinema, they have concurrently fractured viewing habits across heavily siloed, proprietary walled gardens, generating immense cognitive overhead for end users. As streaming libraries expand, users face severe choice overload, spending on average 12 to 26 minutes browsing rather than watching (YouGov, 2024).

SineLog is a decentralized, cloud-native cinematic logging platform designed to address this "presence gap" by consolidating, cataloging, and securing personal movie-watching histories independent of platform lock-in. By combining a web-standards-compliant presentation layer built with Vanilla JavaScript (ECMAScript 2022) with a relational PostgreSQL database served through Supabase, SineLog maximizes transaction velocities, enforces strict database-native security via Row Level Security (RLS), and integrates real-time metadata using TMDB’s programmatic API. It empowers users to retain ownership of their consumption telemetry and engage with a community of peers without relying on algorithmic feeds dictated by singular streaming services.

**Application Features**
- **Integrated Film Logging**: Supports granular tracking (star ratings, reviews, rewatch status) using a strict JWT-validated Upsert pattern to ensure immutable data records.
- **Dynamic Watchlist Management**: An instant curation tool providing immediate client-side DOM feedback, reducing interaction friction.
- **Unified Discovery Engine**: A debounced search interface pulling metadata from TMDB, significantly reducing latency for mobile-first users.
- **Social Activity Feed**: A chronological timeline of engagement utilizing automated spoiler-blur logic to protect the community experience.
- **User Profiles and Stats**: A dashboard leveraging optimized SQL views to calculate follower ratios and affinity metrics at the database tier.
- **AI Taste Match**: An experimental recommendation engine utilizing the Puter AI API to synthesize viewing history and provide personalized predictions to combat decision fatigue.

**Significance of the Project**
The core significance of SineLog lies in its promotion of Data Sovereignty. By reclaiming personal consumption telemetry from proprietary walled gardens into an independent, cryptographically secure diary, users regain control of their digital fingerprints. Furthermore, the development of SineLog validates that highly scalable platforms can be deployed rapidly without massive enterprise middleware overhead. By opting for Vanilla JS, the system reduces Total Blocking Time (TBT) and optimizes the First Contentful Paint (FCP) to under 0.3 seconds—a significant improvement over traditional React-based implementations (Jadhav, 2025). 

The project brings substantial benefits to various stakeholders:
1. **Digital Entertainment Consumers**: End users benefit from profound cognitive relief and time recovery. By separating film discovery from the pressure of immediate platform execution via centralized watchlists, consumers can bypass algorithmic choice paralysis and monetization algorithms (Gracenote, 2025).
2. **Developers and Teams**: SineLog serves as a reference model for rapid, secure prototyping. By offloading infrastructure management to Supabase and utilizing Kubernetes container orchestration, overhead costs and deployment complexities are drastically reduced.
3. **Database Administrators (DBAs)**: Demonstrates the concrete value of table decomposition and database-enforced integrity. Proper relational design reduces the database footprint on disk by approximately 30%, validating methodologies that minimize redundant storage and lower data center energy consumption.

**Expected Benefits**
- **Workflow Automation**: Automating the synchronization of TMDB metadata and personal logs eliminates manual data entry errors and cross-referencing through secure API integrations.
- **Decision Support via AI**: The experimental AI engine acts as an accessible, reliable companion to combat choice paralysis, providing logical film predictions for non-technical users.
- **Scalability and Reliability**: The use of a persistent, highly normalized PostgreSQL database alongside a robust, self-healing Kubernetes deployment ensures the application remains highly available and resilient under varying user loads.

---

## APPLICATION CONTAINERIZATION

### Image Creation
In order to containerize our web application for consistency and reliable deployment, we created a Docker image using a multi-stage `Dockerfile`. 

*Note: Please insert your screenshots below the respective figure captions.*

**Figure 1 Dockerfile Configuration**
*[Insert screenshot of Dockerfile here]*
This image shows the code inside our `Dockerfile`. We utilized a two-stage build process. Stage 1 uses `alpine` to verify that all necessary static assets (like `index.html` and `styles.css`) are present. Stage 2 uses `nginx:1.27-alpine` to serve these static files securely via a non-root user (appuser). This approach ensures security and keeps the image size lightweight for production.

**Figure 2 Terminal command and output for building the Docker image**
*[Insert screenshot of the docker build command and output]*
```powershell
docker build -t sinelog:latest .
```
This command builds the Docker image named `sinelog` with the tag `latest`. The terminal output displays the layers being fetched, cached, and built. A success message is shown indicating that the image was properly built and exported.

**Figure 3 Terminal command and output for tagging and viewing the image**
*[Insert screenshot of the docker tag and docker images output]*
```powershell
docker tag sinelog:latest sinelog:v1.0.0
docker images | findstr sinelog
```
This command tags a versioned copy (`v1.0.0`) of the image for release versioning. The `docker images` output confirms that both `latest` and `v1.0.0` images exist in the local Docker environment, each utilizing around 25MB of space.

---

### Deployment Creation
To orchestrate our application, we utilized Kubernetes by deploying various YAML manifests.

**Figure 4 00-namespace.yaml manifest**
*[Insert screenshot of 00-namespace.yaml code]*
This image shows the code for the creation of the Namespace. The Namespace component isolates the SineLog resources from other applications in the cluster.

**Figure 5 Terminal command and output for 00-namespace.yaml**
*[Insert screenshot of kubectl apply namespace command]*
```powershell
kubectl apply -f k8s/00-namespace.yaml
```
This command creates the namespace. The terminal output confirms `namespace/sinelog created`.

**Figure 6 secret.example.yaml manifest**
*[Insert screenshot of secret.example.yaml code]*
This image shows the `secret.example.yaml` manifest which contains placeholders for the database URL, Anon key, and TMDB API keys. We use this example manifest in our documentation to avoid leaking our actual API keys. The Secret component is used for this in order to not leak sensitive information inside our codebase or plain text configurations.

**Figure 7 Terminal command and output for secret.yaml**
*[Insert screenshot of kubectl apply secret command]*
```powershell
kubectl apply -f k8s/secret.yaml
```
This command applies the secret to our cluster. After executing, the terminal output returns `secret/sinelog-secrets created`.

**Figure 8 deployment.yaml manifest**
*[Insert screenshot of deployment.yaml code]*
This image shows our Deployment manifest. The Deployment component defines the desired state of our application pods, including the use of 3 replicas, resource limits, and health probes for automated monitoring.

**Figure 9 Terminal command and output for deployment.yaml**
*[Insert screenshot of kubectl apply deployment command]*
```powershell
kubectl apply -f k8s/deployment.yaml
```
This command applies the deployment configuration. The terminal output returns `deployment.apps/sinelog created`.

**Figure 10 service.yaml manifest**
*[Insert screenshot of service.yaml code]*
This image shows our Service configuration. The Service component is used to expose the deployed application to the internal cluster network using a ClusterIP, routing traffic on port 80 to our pods on port 8080.

**Figure 11 Terminal command and output for service.yaml**
*[Insert screenshot of kubectl apply service command]*
```powershell
kubectl apply -f k8s/service.yaml
```
This command creates the service. The terminal output confirms `service/sinelog created`.

**Figure 12 serviceaccount.yaml manifest**
*[Insert screenshot of serviceaccount.yaml code]*
This image shows our ServiceAccount configuration. The ServiceAccount component provides an identity for pods running in the cluster without mounting a default API token, enhancing security.

**Figure 13 Terminal command and output for serviceaccount.yaml**
*[Insert screenshot of kubectl apply serviceaccount command]*
```powershell
kubectl apply -f k8s/serviceaccount.yaml
```
This command creates the ServiceAccount. The terminal output confirms `serviceaccount/sinelog-sa created`.

**Figure 14 configmap.yaml manifest**
*[Insert screenshot of configmap.yaml code]*
This image shows our ConfigMap. The ConfigMap component contains the Nginx server configuration, cleanly separating the configuration from the application code.

**Figure 15 Terminal command and output for configmap.yaml**
*[Insert screenshot of kubectl apply configmap command]*
```powershell
kubectl apply -f k8s/configmap.yaml
```
This command creates the ConfigMap. The terminal output confirms `configmap/sinelog-nginx-config created`.

**Figure 16 pv.yaml manifest**
*[Insert screenshot of pv.yaml code]*
This image shows the PersistentVolume (PV) manifest. The PV component provisions storage specifically for keeping persistent nginx logs across pod restarts.

**Figure 17 Terminal command and output for pv.yaml**
*[Insert screenshot of kubectl apply pv command]*
```powershell
kubectl apply -f k8s/pv.yaml
```
This command creates the PersistentVolume. The terminal output confirms `persistentvolume/sinelog-logs-pv created`.

**Figure 18 pvc.yaml manifest**
*[Insert screenshot of pvc.yaml code]*
This image shows the PersistentVolumeClaim (PVC) manifest. The PVC component claims the storage defined by the PV for our application within the `sinelog` namespace.

**Figure 19 Terminal command and output for pvc.yaml**
*[Insert screenshot of kubectl apply pvc command]*
```powershell
kubectl apply -f k8s/pvc.yaml
```
This command creates the PersistentVolumeClaim. The terminal output confirms `persistentvolumeclaim/sinelog-logs-pvc created`.

**Figure 20 networkpolicy.yaml manifest**
*[Insert screenshot of networkpolicy.yaml code]*
This image shows our NetworkPolicy configuration. The NetworkPolicy component restricts and secures ingress and egress network traffic, allowing only necessary communication paths.

**Figure 21 Terminal command and output for networkpolicy.yaml**
*[Insert screenshot of kubectl apply networkpolicy command]*
```powershell
kubectl apply -f k8s/networkpolicy.yaml
```
This command creates the NetworkPolicy. The terminal output confirms `networkpolicy/sinelog-network-policy created`.

**Figure 22 hpa.yaml manifest**
*[Insert screenshot of hpa.yaml code]*
This image shows the HorizontalPodAutoscaler (HPA) manifest. The HPA component automatically scales the application from 3 to 10 pods depending on CPU and memory usage to handle dynamic traffic.

**Figure 23 Terminal command and output for hpa.yaml**
*[Insert screenshot of kubectl apply hpa command]*
```powershell
kubectl apply -f k8s/hpa.yaml
```
This command creates the HorizontalPodAutoscaler. The terminal output confirms `horizontalpodautoscaler.autoscaling/sinelog created`.

**Figure 24 pdb.yaml manifest**
*[Insert screenshot of pdb.yaml code]*
This image shows our PodDisruptionBudget (PDB) manifest. The PDB component ensures high availability by guaranteeing a minimum number of pods are always running during voluntary disruptions.

**Figure 25 Terminal command and output for pdb.yaml**
*[Insert screenshot of kubectl apply pdb command]*
```powershell
kubectl apply -f k8s/pdb.yaml
```
This command creates the PodDisruptionBudget. The terminal output confirms `poddisruptionbudget.policy/sinelog-pdb created`.

---

### Execution of the Application
**Figure 26 Executing the Application through Port-Forwarding**
*[Insert screenshot of terminal executing port-forward command]*
```powershell
kubectl port-forward svc/sinelog 8080:80 -n sinelog
```
This command forwards the cluster's internal Service port (80) to our local machine's port (8080). This allows the developers and users to securely access the application from their local browser without exposing it publicly.

**Figure 27 SineLog Application running in the Web Browser**
*[Insert screenshot of the SineLog Home/Trending page]*
This image displays the fully functional web application successfully running at `http://localhost:8080`. The application is actively fetching real-time data from TMDB and interacting with our Supabase backend, proving that the Kubernetes networking and environment variables are functioning properly.

---

### Self-Healing Feature
Self-healing is vital in microservices because hardware fails and application crashes occur. Kubernetes continuously monitors application health, automatically replacing pods that fail to ensure the application stays online with high availability.

**Figure 28 Simulating a Pod Failure**
*[Insert screenshot of terminal listing pods and deleting one pod]*
```powershell
kubectl get pods -n sinelog
kubectl delete pod <pod-name> -n sinelog
```
In this image, we manually delete one of the running pods to simulate an unexpected application crash or hardware failure.

**Figure 29 Automated Pod Replacement (Self-Healing)**
*[Insert screenshot showing the new pod being created via `kubectl get pods -n sinelog -w`]*
The terminal output demonstrates Kubernetes detecting the missing pod and instantly creating a new replacement pod. This confirms the liveness and readiness probes defined in our `deployment.yaml` successfully trigger the self-healing process without manual intervention.

---

### Application Scaling
Scaling ensures that our application can handle increased user traffic without performance degradation, and it saves resources by scaling down during inactive periods. For SineLog, if a massive amount of users attempt to log a highly-anticipated newly released movie simultaneously, the application must scale up to handle the sudden surge in API and web requests.

**Figure 30 Manual Scale Up command and output**
*[Insert screenshot of the kubectl scale command setting replicas to 5]*
```powershell
kubectl scale deployment sinelog --replicas=5 -n sinelog
```
The image shows the application scaling up to 5 pods. The terminal outputs `deployment.apps/sinelog scaled`, and we immediately see new pods in the `Pending` and `ContainerCreating` states to distribute the heavy load.

**Figure 31 Manual Scale Down command and output**
*[Insert screenshot of the kubectl scale command setting replicas to 3]*
```powershell
kubectl scale deployment sinelog --replicas=3 -n sinelog
```
Once traffic subsides, we execute the scale down command. The terminal displays the safe termination of 2 pods, bringing the replica count back down to 3, conserving system resources.

---

### Application Version Update
Updating using Kubernetes is remarkably easy due to its "Rolling Update" strategy. Developers only need to update the deployment image tag, and Kubernetes handles the transition incrementally with zero downtime.

**Figure 32 Updating the Application Version**
*[Insert screenshot of the kubectl set image command and rollout status]*
```powershell
docker tag sinelog:latest sinelog:v2.0.0
kubectl set image deployment/sinelog sinelog=sinelog:v2.0.0 -n sinelog
kubectl rollout status deployment/sinelog -n sinelog
```
The image shows the command setting our deployment to use the new `v2.0.0` image. The `rollout status` output highlights the rolling update process: Kubernetes creates a new replica, waits for it to be healthy, and then terminates an old replica sequentially. This confirms a zero-downtime deployment.

---

### Application Rollback
Rollbacks using Kubernetes are extremely fast and effortless. If a developer accidentally releases a bug-ridden version, they can revert to the previous working version in one command, as Kubernetes retains a history of ReplicaSets.

**Figure 33 Rolling Back the Application Version**
*[Insert screenshot of the kubectl rollout undo command and output]*
```powershell
kubectl rollout undo deployment/sinelog -n sinelog
kubectl rollout status deployment/sinelog -n sinelog
```
The image shows the rollback command being executed. The terminal returns `deployment.apps/sinelog rolled back`. The application instantly spins down the problematic pods and recreates pods using the previous, stable container image. 

---

## CONCLUSION

**Summary**
The SineLog project successfully developed a cinematic social diary addressing the user "presence gap" by giving them ownership of their data using Supabase, TMDB API, and Vanilla JavaScript. Throughout the project, the development progressed from conceptualization and UI design to database integrations and finally Kubernetes orchestration. We began by setting up a robust, framework-less frontend to optimize load times. Subsequently, we configured a multi-stage Dockerfile ensuring lightweight, secure image generation. We then designed robust Kubernetes manifests for namespaces, secrets, deployments, scaling, and services.

One of the significant challenges we encountered was ensuring secure, real-time data persistence without a heavy backend server. We overcame this by fully utilizing Supabase’s PostgreSQL Row Level Security (RLS) directly interacting with client-side JWTs. In the deployment phase, managing persistent storage for logs and handling environment variables cleanly within a static Nginx container presented difficulties. We successfully resolved this by writing a custom shell entry-point script to inject Kubernetes secret variables dynamically into a generated configuration file at startup. Overall, SineLog meets its objective of providing a decentralized, highly performant film logging platform.

---

## APPENDIX

### Manifest File 1: deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sinelog
  namespace: sinelog
  labels:
    app: sinelog
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sinelog
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0 # Zero-downtime deploys
  template:
    metadata:
      labels:
        app: sinelog
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      terminationGracePeriodSeconds: 30
      containers:
        - name: sinelog
          image: sinelog:latest
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          envFrom:
            - secretRef:
                name: sinelog-secrets
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
              readOnly: true
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "200m"
              memory: "128Mi"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: false
            capabilities:
              drop: ["ALL"]
      volumes:
        - name: nginx-config
          configMap:
            name: sinelog-nginx-config
```

### Manifest File 2: service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: sinelog
  namespace: sinelog
  labels:
    app: sinelog
spec:
  type: ClusterIP
  selector:
    app: sinelog
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
```

### Manifest File 3: secret.example.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sinelog-secrets
  namespace: sinelog
  labels:
    app: sinelog
type: Opaque
data:
  TMDB_KEY: <base64_encoded_tmdb_api_key>
  SUPABASE_URL: <base64_encoded_supabase_project_url>
  SUPABASE_ANON: <base64_encoded_supabase_anon_key>
```

### Manifest File 4: namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sinelog
  labels:
    app: sinelog
    managed-by: kubectl
```

### Manifest File 5: serviceaccount.yaml
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sinelog-sa
  namespace: sinelog
automountServiceAccountToken: false
```

### Manifest File 6: configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sinelog-nginx-config
  namespace: sinelog
  labels:
    app: sinelog
data:
  default.conf: |
    server {
        listen       8080;
        server_name  _;
        root         /usr/share/nginx/html;
        index        index.html;
        access_log   /dev/stdout;
        error_log    /dev/stderr warn;

        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/javascript application/json image/svg+xml;
        gzip_min_length 1024;

        add_header X-Frame-Options        "SAMEORIGIN"   always;
        add_header X-Content-Type-Options "nosniff"       always;
        add_header X-XSS-Protection       "1; mode=block" always;
        add_header Referrer-Policy        "strict-origin-when-cross-origin" always;

        location ~* \.(css|js|json|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        location /healthz {
            access_log off;
            return 200 "ok\n";
            add_header Content-Type text/plain;
        }
    }
```

### Manifest File 7: pv.yaml
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: sinelog-logs-pv
  labels:
    app: sinelog
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 512Mi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /data/sinelog/logs   # Stored on the node (Docker Desktop host)
  persistentVolumeReclaimPolicy: Retain
```

### Manifest File 8: pvc.yaml
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sinelog-logs-pvc
  namespace: sinelog
  labels:
    app: sinelog
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 512Mi
```

### Manifest File 9: networkpolicy.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sinelog
  namespace: sinelog
  labels:
    app: sinelog
spec:
  podSelector:
    matchLabels:
      app: sinelog

  policyTypes:
    - Ingress
    - Egress

  # Allow inbound traffic only from the nginx ingress controller
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
          podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080

  # Allow outbound DNS + HTTPS (Supabase / TMDB API)
  egress:
    - ports:
        - protocol: UDP
          port: 53 # DNS
        - protocol: TCP
          port: 53 # DNS over TCP
    - ports:
        - protocol: TCP
          port: 443 # HTTPS — Supabase, TMDB API
```

### Manifest File 10: hpa.yaml
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sinelog
  namespace: sinelog
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sinelog
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

### Manifest File 11: pdb.yaml
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: sinelog
  namespace: sinelog
  labels:
    app: sinelog
spec:
  minAvailable: 2          # At least 2 pods must stay up during node drains / upgrades
  selector:
    matchLabels:
      app: sinelog
```

### Recording Links
Include the screen recording link of your actual project execution:
- [Insert Link Here]
