# Note: n8n have also 1.102.1-amd64 and 1.102.1-arm64 for AMD and ARM support.
# Note: We use a fixed n8n version, so the professor have the same version then we have executed it.
#       You may want to upgrade to the latest n8n verion. Pleace first check, if the workfow is behave the same as intented!
FROM n8nio/n8n:1.102.1

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
