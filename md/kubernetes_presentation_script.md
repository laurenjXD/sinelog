# SineLog Kubernetes Deployment & Demonstration Script

**Members:**
- Kristine Ianne Marie P. Gutierrez (Part 1)
- Lauren Jade P. Quidit (Part 2)
- Andjhelyn Denielle P. Santos (Part 3)

---

## Part 1: Containerization & Orchestration (Kristine)

**[Scene: Kristine's screen showing the Terminal and VS Code `Dockerfile`]**

**Kristine:** 
"Hello everyone, we are the developers of SineLog, a Cinematic Social Diary. Today, we will be demonstrating our application's containerization and deployment using Kubernetes. My name is Kristine, and I will walk you through the creation of our Docker image and our Kubernetes manifests.

To begin, we containerized our frontend application using a multi-stage Dockerfile. In stage one, we build and verify the static assets. In stage two, we use an Nginx Alpine image, running as a non-root user for security, to serve those assets. 

**[Visual: Kristine executes `docker build -t sinelog:latest .`]**

I am now building the Docker image by running `docker build -t sinelog:latest .` in our terminal. This command packages our entire application into a portable image. We also tag it with a version number like `v1.0.0` for our release tracking.

**[Visual: Kristine switches to showing the `k8s/` folder manifests]**

With the image ready, we use Kubernetes to orchestrate the deployment. We have configured several components to make this work:
1. **Namespace:** To isolate our project environment.
2. **Secrets:** To securely store our Supabase database credentials and TMDB API keys as base64-encoded strings, keeping them safely out of our source code.
3. **ConfigMap & Volumes:** We use a ConfigMap for our custom Nginx server configuration and a PersistentVolume with a PersistentVolumeClaim to securely store Nginx access and error logs.
4. **Deployment & Service:** Our deployment spins up 3 replicas of the SineLog pod. The Service creates an internal load balancer on port 80 to route traffic directly to these pods. 

**[Visual: Kristine executes `kubectl apply -f k8s/`]**

Now, I will apply all these manifests to our cluster by running the `kubectl apply` command. As you can see on the terminal output, all of our Kubernetes resources are successfully created."

---

## Part 2: Execution & Application Features (Lauren)

**[Scene: Lauren's screen showing the Terminal and then the Web Browser]**

**Lauren:**
"Hi, I'm Lauren. Now that Kristine has successfully deployed our Kubernetes components, I will demonstrate how we execute the application and walk you through its core technical features.

**[Visual: Lauren executes the port-forward command in the terminal]**

Because our Kubernetes Service is configured as a `ClusterIP` for strict internal security—preventing external public access by default—I need to securely expose it to my local machine for development. I will do this by running `kubectl port-forward svc/sinelog 8080:80 -n sinelog`. This command bridges the internal cluster network, safely forwarding port 80 of our Nginx pods to port 8080 on my local machine.

**[Visual: Lauren opens the browser to `http://localhost:8080` and briefly highlights the fast load time]**

I can now open `localhost:8080` in the web browser. Here is SineLog running live from our Kubernetes cluster. Because we opted for a framework-less Vanilla JavaScript (ECMAScript 2022) presentation layer rather than a heavy component library, you'll notice our First Contentful Paint is optimized to under 0.3 seconds. 

As a cinematic social diary, SineLog addresses the 'presence gap' in modern streaming by allowing users to independently discover and log their favorite films. On our homepage, you see our Unified Discovery Engine pulling trending movie metadata in real-time directly from the TMDB programmatic API.

**[Visual: Lauren demonstrates using the search bar and selecting a movie]**

I can use our debounced search interface to find a specific movie. The debouncing ensures we aren't spamming the TMDB API with requests on every keystroke, which significantly reduces network latency, especially for mobile users. Clicking on a movie instantly opens our dynamic modal. Right within this modal, you can find our experimental AI Taste Match feature. By integrating the Puter AI API, our system synthesizes the user's viewing history to generate highly personalized film predictions, helping combat the choice paralysis that plagues modern streaming platforms.

**[Visual: Lauren fills out the log modal: giving a star rating, typing a review, and clicking save]**

Since our `SL.Auth` module detects an active session, I can log this film. I'll give it a star rating, add a brief review, and hit save. When I click save, our frontend securely communicates directly with our PostgreSQL database using the Supabase JavaScript client, bypassing the need for a traditional backend server. 

**[Visual: Lauren navigates to the Social Activity Feed, pointing out a blurred review]**

If we navigate to the Social Activity Feed, you can see my newly logged film appearing chronologically in the timeline. To achieve this performance, we aren't running complex Javascript joins; instead, our `SL.Store` abstraction layer queries optimized SQL Views directly on the database, using pagination ranges to strictly download only 20 records at a time. You'll also notice our automated spoiler-blur logic protecting the community experience for longer reviews.

**[Visual: Lauren clicks on the Profile tab and highlights the user stats]**

Finally, in the Profile tab, users can track their historical stats like follower ratios and genre affinity, all calculated efficiently at the database tier via those SQL views."

---

## Part 3: Reliability & Scaling Operations (Andjhelyn)

**[Scene: Andjhelyn's screen showing a split terminal view for watching pods]**

**Andjhelyn:**
"Hello, my name is Andjhelyn, and I will be concluding our presentation by demonstrating the operational power of Kubernetes through self-healing, scaling, updates, and rollbacks.

**[Visual: Andjhelyn shows running pods, then deletes one]**

First is the **Self-Healing feature**. Currently, we have 3 pods running perfectly. I will simulate a critical crash by manually deleting one of the pods using `kubectl delete pod`. 
Kubernetes immediately detects that the desired state of 3 replicas is not met. As you can see in the watch terminal, it instantly creates a replacement pod to restore the application’s health without any manual intervention.

**[Visual: Andjhelyn scales the deployment up to 5, then down to 3]**

Next is **Application Scaling**. If SineLog experiences a sudden surge in user traffic, we can scale our application horizontally. I will manually scale our deployment up to 5 replicas using `kubectl scale deployment sinelog --replicas=5`. 
You can see Kubernetes instantly spinning up two additional pods to distribute the heavy load. When the traffic subsides, we can just as easily scale back down to 3 replicas to save on cluster resources.

**[Visual: Andjhelyn performs a rolling update to v2.0.0]**

Now, let's look at an **App Version Update**. When our developers release a new version, we can deploy it with zero downtime. I will run `kubectl set image` to update our deployment to version `v2.0.0`. 
By watching the rollout status, you can see Kubernetes performs a rolling update—starting new pods one by one and only terminating the old pods once the new ones are completely ready and healthy.

**[Visual: Andjhelyn performs a rollout undo]**

Finally, if that new update unexpectedly contained a critical bug, we can immediately perform an **App Rollback**. By running `kubectl rollout undo deployment`, Kubernetes instantly reverts the pods back to the previous stable version, completely minimizing any disruption to our users.

That concludes our demonstration of SineLog's containerization and Kubernetes orchestration. Thank you for watching!"
