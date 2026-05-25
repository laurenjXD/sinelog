# SineLog — Kubernetes Deployment Guide

> **Course:** WPH University Elective — Introduction to Kubernetes
> **Project:** SineLog (film diary & social web application)
> **Stack:** Static frontend (HTML/CSS/JS) · Nginx · Supabase · TMDB API
> **Cluster:** Docker Desktop (local Kubernetes)

**Application demo script (JavaScript flows):** [PRESENTATION.md](PRESENTATION.md)

---

## Prerequisites

| Requirement | Check |
|---|---|
| Docker Desktop installed | `docker --version` |
| Kubernetes enabled in Docker Desktop | Settings → Kubernetes → Enable |
| kubectl installed | `kubectl version --client` |
| Context set to docker-desktop | `kubectl config current-context` |

```powershell
# Verify all prerequisites
docker --version
kubectl version --client
kubectl config current-context   # Must output: docker-desktop
```

---

## Project Structure

```
sinelog/
├── Dockerfile               # Multi-stage build (alpine → nginx:alpine)
├── k8s/
│   ├── namespace.yaml        # Namespace: sinelog
│   ├── serviceaccount.yaml   # ServiceAccount (no API token mount)
│   ├── secret.yaml           # API keys (TMDB, Supabase) — base64 encoded
│   ├── configmap.yaml        # Nginx configuration
│   ├── pv.yaml               # PersistentVolume — 512Mi for nginx logs
│   ├── pvc.yaml              # PersistentVolumeClaim — binds to PV
│   ├── deployment.yaml       # 3 replicas, rolling update, probes
│   ├── service.yaml          # ClusterIP service (port 80 → 8080)
│   ├── networkpolicy.yaml    # Restrict traffic (ingress + egress rules)
│   ├── hpa.yaml              # HorizontalPodAutoscaler (3–10 replicas)
│   └── pdb.yaml              # PodDisruptionBudget (min 2 always up)
├── index.html
├── app.js              # Router, config, utilities
├── auth.js / nav.js / modal.js / store.js / tmdb.js
├── ui/                 # home, feed, profile, search-page
├── styles.css
└── *.md                # README, PRESENTATION, system_design, research
```

---

## Step 1 — Build the Docker Image

```powershell
cd "d:\downloads gyatt\sinelog-complete\sinelog"

# Build the image
docker build -t sinelog:latest .

# Tag a versioned copy (used later for version update demo)
docker tag sinelog:latest sinelog:v1.0.0
docker images | findstr sinelog
```

**Expected output:**
```
sinelog   latest    <id>   ...   ~25MB
sinelog   v1.0.0    <id>   ...   ~25MB
```

---

## Step 2 — Apply Kubernetes Manifests

> **Order matters.** Namespace must exist before namespace-scoped resources. PV must exist before PVC.

# alternative
```powershell
kubectl apply -f k8s/namespace.yaml; kubectl apply -f k8s/secret.yaml; kubectl apply -f k8s/configmap.yaml; kubectl apply -f k8s/pv.yaml; kubectl apply -f k8s/pvc.yaml; kubectl apply -f k8s/deployment.yaml; kubectl apply -f k8s/service.yaml; kubectl apply -f k8s/networkpolicy.yaml; kubectl apply -f k8s/pdb.yaml
```

---

## Step 3 — Verify All Resources Are Running

```powershell
# Watch pods until all 3 show STATUS: Running
kubectl get pods -n sinelog -w

# Overview of all resources in the namespace
kubectl get all -n sinelog

# Check storage
kubectl get pv
kubectl get pvc -n sinelog

# Check secrets and configmaps
kubectl get secrets,configmaps -n sinelog
```

**Expected pod output:**
```
NAME                       READY   STATUS    RESTARTS   AGE
sinelog-<id>-xxxxx         1/1     Running   0          30s
sinelog-<id>-yyyyy         1/1     Running   0          30s
sinelog-<id>-zzzzz         1/1     Running   0          30s
```

**Expected PV/PVC output:**
```
NAME               STATUS   VOLUME           CAPACITY   ACCESS MODES
sinelog-logs-pvc   Bound    sinelog-logs-pv  512Mi      RWO
```

---

## Step 4 — Access the Application (Port-Forward)

```powershell
kubectl port-forward svc/sinelog 8080:80 -n sinelog
```

Open **http://localhost:8080** in your browser.

> Keep this terminal open. The app will be accessible as long as port-forward is running.
> Press `Ctrl+C` to stop.

### Quick application smoke test (after port-forward)

Before Kubernetes demos, confirm the **JavaScript app** works through Nginx:

1. Home page loads trending films (TMDB key in Secret → `env-config.js`).
2. Search → movie modal opens (`SL.Modal`).
3. Sign in → log a film → appears on profile/feed (Supabase).

Full presenter checklist: [PRESENTATION.md § Demonstration Flow](PRESENTATION.md#3-demonstration-flow--live-presentation-script).

---

## Demo 1 — Self-Healing Feature

> **Concept:** Kubernetes automatically restarts pods when they crash or are deleted. Liveness and readiness probes in `deployment.yaml` enable this.

**Open a second terminal:**

```powershell
# Step 1 — List running pods
kubectl get pods -n sinelog

# Step 2 — Delete one pod (copy a pod name from the output above)
kubectl delete pod <pod-name> -n sinelog

# Step 3 — Watch Kubernetes immediately create a replacement
kubectl get pods -n sinelog -w
```

**Expected behavior:** The deleted pod disappears and a new pod reaches `Running` within ~15 seconds.

> **Narration:** *"When we manually delete a pod — simulating a crash — Kubernetes detects the desired replica count is not met and automatically creates a replacement. This is the self-healing feature."*

---

## Demo 2 — App Scaling (Up and Down)

> **Concept:** Scale the number of pods manually, and observe the HPA monitoring automatic scaling.

### Scale Up (manual)

```powershell
kubectl scale deployment sinelog --replicas=5 -n sinelog

# Watch new pods spin up
kubectl get pods -n sinelog -w
```

**Expected:** 2 new pods created, total = 5 running.

### Scale Down (manual)

```powershell
kubectl scale deployment sinelog --replicas=3 -n sinelog

# Watch pods terminate
kubectl get pods -n sinelog -w
```

**Expected:** 2 pods gracefully terminate, total = 3 running.


## Demo 3 — App Version Update (Rolling Update)

> **Concept:** Deploy a new version with zero downtime using rolling updates.

```powershell
# Step 1 — Tag current image as v2.0.0 (simulate a new build)
docker tag sinelog:latest sinelog:v2.0.0

# Step 2 — Update the running deployment to use the new image
kubectl set image deployment/sinelog sinelog=sinelog:v2.0.0 -n sinelog

# Step 3 — Watch the rolling update happen (zero downtime)
kubectl rollout status deployment/sinelog -n sinelog
kubectl get pods -n sinelog -w
```

**Expected output:**
```
Waiting for deployment "sinelog" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "sinelog" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "sinelog" rollout to finish: 1 old replicas are pending termination...
deployment "sinelog" successfully rolled out
```

```powershell
# Step 4 — Confirm new image is being used
kubectl describe deployment sinelog -n sinelog | findstr Image
```

> **Narration:** *"The rolling update strategy in our deployment sets maxUnavailable to 0 — meaning new pods must be ready before old ones are removed. This guarantees zero downtime during updates."*

---

## Demo 4 — App Rollback

> **Concept:** Instantly revert to the previous version if a bad deployment is released.

```powershell
# Step 1 — View deployment history
kubectl rollout history deployment/sinelog -n sinelog

# Step 2 — Roll back to the previous version
kubectl rollout undo deployment/sinelog -n sinelog

# Step 3 — Confirm rollback status
kubectl rollout status deployment/sinelog -n sinelog

# Step 4 — Verify pods are healthy after rollback
kubectl get pods -n sinelog
```

**Expected output:**
```
deployment.apps/sinelog rolled back
deployment "sinelog" successfully rolled out
```

> **Narration:** *"With kubectl rollout undo, we instantly revert to the last known-good deployment. Kubernetes tracks revision history, so rollback is fast and reliable."*

---

## All Kubernetes Components Summary

| Component | Kind | Purpose |
|---|---|---|
| `namespace.yaml` | Namespace | Isolates all sinelog resources |
| `serviceaccount.yaml` | ServiceAccount | Pod identity, no API token mount |
| `secret.yaml` | Secret | TMDB API key + Supabase credentials |
| `configmap.yaml` | ConfigMap | Nginx server configuration |
| `pv.yaml` | PersistentVolume | 512Mi storage for nginx logs (hostPath) |
| `pvc.yaml` | PersistentVolumeClaim | Claims the PV within sinelog namespace |
| `deployment.yaml` | Deployment | 3 replicas, rolling update, health probes |
| `service.yaml` | Service | ClusterIP — routes port 80 to pod 8080 |
| `networkpolicy.yaml` | NetworkPolicy | Restricts ingress/egress traffic |
| `hpa.yaml` | HorizontalPodAutoscaler | Auto-scale 3–10 pods on CPU/memory |
| `pdb.yaml` | PodDisruptionBudget | Minimum 2 pods always available |

---

## Cleanup

```powershell
# Delete all sinelog namespace resources
kubectl delete namespace sinelog

# Delete the PersistentVolume (cluster-scoped, must delete separately)
kubectl delete pv sinelog-logs-pv

# Confirm everything is gone
kubectl get all -n sinelog
kubectl get pv
```

---

## Troubleshooting

| Problem | Command | Fix |
|---|---|---|
| Pods stuck in `Pending` | `kubectl describe pod <name> -n sinelog` | Check events for resource or PVC issues |
| `ImagePullBackOff` | `kubectl describe pod <name> -n sinelog` | Ensure `docker build` ran successfully |
| `CrashLoopBackOff` | `kubectl logs <pod-name> -n sinelog` | Check nginx config or permission errors |
| PVC stuck in `Pending` | `kubectl describe pvc -n sinelog` | Apply `pv.yaml` first, check storageClassName matches |
| Port-forward disconnects | Re-run port-forward command | Normal — it's not a persistent connection |
| HPA shows `<unknown>` | `kubectl top pods -n sinelog` | Metrics Server may not be installed |
