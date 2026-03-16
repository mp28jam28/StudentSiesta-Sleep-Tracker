# Intelligent Trust-Based Cloud Security System

## Overview
Modern cloud systems allow many customers to share the same computing resources, but fixed permissions assume user behavior never changes. In reality, users or services can become risky over time.

This project proposes an intelligent security system that monitors user and service activity in real time and automatically adjusts access levels. If suspicious behavior is detected, the system can revoke permissions or rotate security keys to protect cloud resources.

A layered access control architecture is used to maintain system availability while minimizing disruption to legitimate users.

- **Layer 1:** Role-Based Access Control (RBAC) ensures users can normally access the resources they are authorized to use.
- **Layer 2:** Intelligent monitoring analyzes activity and can override permissions if suspicious behavior is detected.

Instead of shutting down entire cloud services during security incidents, the system isolates only the risky account or process so the rest of the cloud environment continues operating normally.

The project will also include simulated attacks to evaluate how effectively the system detects threats and protects the cloud environment.

---

## Project Setup Environment
The project environment will include a cloud simulation setup using containerized microservices.

Possible tools include:

- **Docker** for containerization
- **Kubernetes** for orchestration (may be used instead of Docker depending on development needs)

### Programming Language
- **Python** will serve as the primary language due to its strong ecosystem of machine learning and security libraries.

### Core Components
- Access control models
- Anomaly detection modules
- Basic cloud architecture infrastructure

---

## Project Deliverables
- Dynamic trust evaluation algorithm  
- Packet capture analysis (using **Wireshark** / **GNS3**)  
- Policy enforcement engine  
- Attack simulation report  
- Performance and security analysis report  

---

## Skills Required
- **Cloud Architecture** – for designing and configuring the environment  
- **Python Development** – for machine learning models and backend systems  
- **Cloud Simulation Tools** – such as Docker or Kubernetes  
- **Network Security Fundamentals** – to design detection and protection mechanisms  