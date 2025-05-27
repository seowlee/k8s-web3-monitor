# 📡 Kubernetes Web3 Transaction Monitor (USDT)

## ✅ 프로젝트 설명

Ethereum 메인넷의 **USDT(테더)** `Transfer` 이벤트를 **12블록 간격으로 수집**하여
**Redis → MongoDB**로 실시간 저장하는 **Web3 트랜잭션 모니터링 시스템**입니다.

Kubernetes 기반 멀티 노드 클러스터에 배포되며, **실시간 수집 → Redis 큐 → MongoDB 저장**의 구조로 구성됩니다.

---

## 🛠️ 기술 스택

- **Node.js**: ethers.js, ioredis, mongodb
- **Redis**: 실시간 이벤트 큐
- **MongoDB**: TTL 기반 트랜잭션 저장소
- **Docker & Docker Compose**
- **Kubernetes**: Deployment, Service, ReplicaSet, NodePort, Ingress, MetalLB
- **Public Ethereum RPC**: `https://ethereum-rpc.publicnode.com`

---

## 📦 시스템 아키텍처

```
[Ethereum RPC]
│
┌───────▼────────┐
│ USDT Listener │
│ - ethers.js │
│ - getLogs() │
│ - Redis PUSH │
└───────┬────────┘
▼
[Redis Queue]
▼
┌───────┴────────┐
│ Worker Pod │
│ - Redis POP │
│ - Mongo Insert │
└────────────────┘

```

---

## 🧪 로컬 테스트 (Docker Compose)

```bash
docker-compose up --build
```

### 상태 확인

```bash
# Redis CLI
docker exec -it redis redis-cli
> LRANGE usdt-tx-list 0 -1

# MongoDB
docker exec -it mongo mongosh
> use web3monitor
> db.usdtTransfers.find().pretty()
```

---

## 🐳 Docker 이미지 빌드 & 푸시 (macOS)

```bash
# Listener
cd listener
docker build -t yourdockerid/usdt-listener .
docker push yourdockerid/usdt-listener

# Worker
cd ../worker
docker build -t yourdockerid/usdt-worker .
docker push yourdockerid/usdt-worker
```

---

## 🚀 Kubernetes 배포

### 💡 디렉토리 안내

- `manifests/full/`: 완전한 버전 (MetalLB + Ingress + PVC 포함)
- `manifests/minimal/`: 축소 버전 (NodePort 기반 빠른 실습용)

---

## ✅ 완전한 버전 배포 (MetalLB + Ingress)

> VMware Master 노드에서 실행

```bash
kubectl apply -f manifests/full/metallb-config.yaml
kubectl apply -f manifests/full/
```

### macOS에서 도메인 설정

```bash
sudo vim /etc/hosts

# 추가
192.168.0.240 listener.local
```

### 브라우저 접속

```
http://listener.local
```

---

## ✂️ 축소 버전 배포 (NodePort 기반)

```bash
kubectl apply -f manifests/minimal/
```

### 브라우저 접속 (Node IP\:NodePort)

```bash
http://192.168.56.101:32000
```

---

## 🔍 상태 확인 명령어

```bash
kubectl get pods
kubectl get svc
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl logs -f <listener-pod>
kubectl exec -it <mongo-pod> -- mongosh
kubectl exec -it <redis-pod> -- redis-cli
```

---

## 🧠 실습 노트

| 항목            | 완전한 버전      | 축소 버전           |
| --------------- | ---------------- | ------------------- |
| MetalLB         | ✅ 사용          | ❌ 생략             |
| Ingress         | ✅ 도메인 접속   | ❌ NodePort만       |
| PVC             | ✅ Mongo에 적용  | ❌ 휘발성 가능      |
| GitOps (ArgoCD) | 가능             | 생략                |
| 접속 방식       | `listener.local` | `192.168.X.X:32000` |

---

## 📁 디렉토리 구조 요약

```
K8S-WEB3-MONITOR/
├── listener/
├── worker/
├── manifests/
│   ├── full/
│   └── minimal/
├── docker-compose.yaml
└── README.md
```

---

## 🎯 확장 방향

- NFT, ERC20 다양화 (WETH, LINK 등)
- TTL 기반 자동 삭제 전략
- Express 서버 추가 → JSON API 제공
- React 기반 Dashboard 연동
- ArgoCD 기반 GitOps 자동화
