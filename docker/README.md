# FixMemory AI Docker Services

This directory contains container definitions for external services.

### Services:
- **Hindsight Memory Engine**: Open-source biomimetic agent memory engine (`ghcr.io/vectorize-io/hindsight:latest`).
- **MongoDB Atlas**: Primary database is hosted on MongoDB Atlas (managed cloud service, connection string specified in `server/.env`).

```yaml
version: '3.8'

services:
  hindsight:
    image: ghcr.io/vectorize-io/hindsight:latest
    container_name: fixmemory-hindsight
    ports:
      - "8888:8888"
    environment:
      - HINDSIGHT_API_PORT=8888
      - HINDSIGHT_API_LLM_PROVIDER=gemini
      - HINDSIGHT_API_LLM_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```
