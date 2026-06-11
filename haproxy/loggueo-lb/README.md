# Load Balancer — unwheels-auth

**Fuente de verdad para enrutamiento (Service Discovery):** HAProxy con `option httpchk GET /readyz`.

| Archivo | Algoritmo |
|---------|-----------|
| `haproxy.round-robin.cfg` | Round-Robin (activo por defecto en compose) |
| `haproxy.least-conn.cfg` | Least connections |
| `haproxy.ip-hash.cfg` | Source IP hash (sticky) |

Cambiar algoritmo: editar el volumen en `FrontEnd/docker-compose.yml` (`loggueo-service`) y:

```bash
docker compose up -d --no-deps loggueo-service
```

Los configs en `FrontEnd/nginx/loggueo-lb/` quedaron como referencia histórica (nginx OSS no soporta health check activo en upstream sin NGINX Plus).
