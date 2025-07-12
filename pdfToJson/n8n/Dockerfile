FROM n8nio/n8n

# Switch to root to install packages
USER root

# Install Python and required build tools
RUN apk update && \
    apk add python3 py3-pip curl

# Upgrade pip and create venv
RUN python3 -m venv /opt/.venv
ENV PATH="/opt/.venv/bin:$PATH"

# Install Python packages from requirements.txt
COPY n8n_io/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Switch back to node user
USER node
