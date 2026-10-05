# 05 — AWS, CLOUD & INFRASTRUCTURE ARCHITECTURE

This track covers cloud-native infrastructure, Kubernetes scaling, container orchestration, AWS services, networking, and production reliability.

---

## 🧭 Sub-Modules & Topics

### 📁 [01-kubernetes-and-containers/](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/01-kubernetes-and-containers)
* [01_kubernetes_hpa_horizontal_pod_autoscaling_complete_guide.md](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/01-kubernetes-and-containers/01_kubernetes_hpa_horizontal_pod_autoscaling_complete_guide.md) — Complete Kubernetes HPA Architecture: The 4 Types of Autoscalers (HPA, VPA, Cluster Autoscaler, KEDA), Scaling Math & Algorithms, YAML Blueprints, Stabilization Windows, and Failure Modes.

### 📁 [02-ec2-linux-and-deployment-pipelines/](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/02-ec2-linux-and-deployment-pipelines)
* [01_aws_vpc_ec2_networking_and_latency_guide.md](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/02-ec2-linux-and-deployment-pipelines/01_aws_vpc_ec2_networking_and_latency_guide.md) — AWS VPC, Subnets, Public/Private IPs, Elastic IPs, Security Group chaining, and sub-millisecond inter-instance communication (VPC fabric vs Placement Groups).
* [02_nginx_reverse_proxy_internals_and_virtual_hosting.md](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/02-ec2-linux-and-deployment-pipelines/02_nginx_reverse_proxy_internals_and_virtual_hosting.md) — Nginx Master/Worker architecture, Linux epoll, Host header demultiplexing, SNI TLS termination, reverse proxy buffering, and complete staging/prod virtual host blueprints.
* [03_multi_env_node_architecture_single_vs_multi_instance.md](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/02-ec2-linux-and-deployment-pipelines/03_multi_env_node_architecture_single_vs_multi_instance.md) — Single EC2 vs Multi-EC2 topologies, Linux OOM killer risks, CPU starvation, PM2 cluster mode, pm2 reload vs restart, and runtime secrets management via AWS SSM.
* [04_production_zero_downtime_ci_cd_and_observability.md](file:///Users/flixstock/Desktop/personal%20project/learn/05-AWS-AND-INFRASTRUCTURE/02-ec2-linux-and-deployment-pipelines/04_production_zero_downtime_ci_cd_and_observability.md) — Automated Bitbucket Pipelines, atomic symlink deployment scripting, decoupled `/healthz` & `/readyz` probes, and centralized CloudWatch log aggregation.
