#!/usr/bin/env bash
# Run this ON THE PROXMOX HOST (via SSH), as root.
#
# Creates a small, unprivileged Debian 12 LXC container to run the
# Arte Saunas app. No Docker inside — just Node.js + systemd — to keep
# the resource footprint as low as possible, per the "menor uso de
# recursos possível" requirement.
#
# Usage:
#   ssh root@<proxmox-host>
#   nano create-lxc.sh   # adjust the variables below if needed
#   bash create-lxc.sh
set -euo pipefail

# ---- Adjust these if needed -------------------------------------------------
CTID=200                       # pick a free container ID (pct list to check)
HOSTNAME=artesaunas
STORAGE=local-lvm              # storage pool for the container's disk
TEMPLATE_STORAGE=local          # storage pool where CT templates are kept
DISK_GB=20                      # includes room for client file uploads (plans, photos), not just the db
RAM_MB=768
SWAP_MB=256
CORES=1
BRIDGE=vmbr0                    # your LAN bridge
# Leave IP=dhcp for DHCP, or set a static IP like 192.168.1.50/24
IP=dhcp
GATEWAY=                        # required only if IP is static, e.g. 192.168.1.1
# -----------------------------------------------------------------------------

TEMPLATE_PATTERN="debian-12-standard"

echo "==> Updating LXC template list"
pveam update

TEMPLATE=$(pveam available --section system | grep "$TEMPLATE_PATTERN" | awk '{print $2}' | sort -V | tail -1)
if [ -z "$TEMPLATE" ]; then
  echo "Could not find a $TEMPLATE_PATTERN template in 'pveam available'. Check available templates with: pveam available" >&2
  exit 1
fi

TEMPLATE_LOCAL_PATH="/var/lib/vz/template/cache/$TEMPLATE"
if [ ! -f "$TEMPLATE_LOCAL_PATH" ]; then
  echo "==> Downloading template $TEMPLATE"
  pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
fi

if [ "$IP" = "dhcp" ]; then
  NET_CONFIG="name=eth0,bridge=$BRIDGE,ip=dhcp"
else
  if [ -z "$GATEWAY" ]; then
    echo "GATEWAY must be set when using a static IP." >&2
    exit 1
  fi
  NET_CONFIG="name=eth0,bridge=$BRIDGE,ip=$IP,gw=$GATEWAY"
fi

echo "==> Creating CT $CTID ($HOSTNAME)"
pct create "$CTID" "$TEMPLATE_STORAGE:vztmpl/$TEMPLATE" \
  --hostname "$HOSTNAME" \
  --storage "$STORAGE" \
  --rootfs "$STORAGE:${DISK_GB}" \
  --memory "$RAM_MB" \
  --swap "$SWAP_MB" \
  --cores "$CORES" \
  --net0 "$NET_CONFIG" \
  --unprivileged 1 \
  --features nesting=0 \
  --onboot 1

echo "==> Starting CT $CTID"
pct start "$CTID"

echo "==> Waiting for network..."
sleep 5

echo
echo "Container $CTID ($HOSTNAME) created and started."
echo "Next steps:"
echo "  1. pct enter $CTID"
echo "  2. Inside the container, run infra/app/setup.sh (copy it in first, e.g. via"
echo "     'pct push $CTID infra/app/setup.sh /root/setup.sh')"
