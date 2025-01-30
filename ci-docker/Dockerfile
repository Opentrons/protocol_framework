#syntax=docker/dockerfile:1.7

FROM ubuntu:24.04 AS base

RUN apt-get update || (sleep 1 && apt-get update) \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    make \
    git \
    curl \
    ssh \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    wget \
    ca-certificates \
    libudev-dev \
    libsystemd-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libxml2-dev \
    libxmlsec1-dev \
    libffi-dev \
    liblzma-dev \
    locales \
    && locale-gen en_US.UTF-8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN echo '#!/bin/bash' > /etc/profile.d/env.sh \
    && echo 'export NVS_HOME="/root/.nvs"' >> /etc/profile.d/env.sh \
    && echo 'export PYENV_ROOT="/root/.pyenv"' >> /etc/profile.d/env.sh \
    && echo 'export YARN_CACHE_FOLDER="/root/.cache/yarn"' >> /etc/profile.d/env.sh \
    && echo 'export PIPENV_VENV_IN_PROJECT=1' >> /etc/profile.d/env.sh \
    && echo 'export PIP_CACHE_DIR="/root/.cache/pip"' >> /etc/profile.d/env.sh \
    && echo 'export PATH="$NVS_HOME:$PYENV_ROOT/bin:$PATH"' >> /etc/profile.d/env.sh \
    && echo 'export LANG=en_US.UTF-8' >> /etc/profile.d/env.sh \
    && echo 'export LANGUAGE=en_US:en' >> /etc/profile.d/env.sh \
    && echo 'export LC_ALL=en_US.UTF-8' >> /etc/profile.d/env.sh \
    && echo '[ -s "$NVS_HOME/nvs.sh" ] && . "$NVS_HOME/nvs.sh"' >> /etc/profile.d/env.sh \
    && echo 'eval "$(pyenv init --path)"' >> /etc/profile.d/env.sh \
    && echo 'eval "$(pyenv init -)"' >> /etc/profile.d/env.sh \
    && chmod +x /etc/profile.d/env.sh

RUN mkdir -p /root/.nvs /root/.pyenv \
    && git clone https://github.com/jasongin/nvs.git /root/.nvs \
    && git clone https://github.com/pyenv/pyenv.git /root/.pyenv

RUN bash -c " \
    source /etc/profile.d/env.sh && \
    nvs add 22.11.0 && \
    nvs use node/22.11.0/x64 && \
    nvs link node/22.11.0/x64 && \
    node --version && \
    npm install --global yarn@1 && \
    yarn config set cache-folder $YARN_CACHE_FOLDER \
    "

RUN bash -c " \
    source /etc/profile.d/env.sh && \
    pyenv install 3.10.13 && \
    pyenv global 3.10.13 && \
    pyenv rehash && \
    python --version \
    "

# Create initialization script
RUN echo '#!/bin/bash\n\
    source /etc/profile.d/env.sh\n\
    exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

# ========== CI IMAGE ==========
FROM base AS ci-js

WORKDIR /opentrons
COPY Makefile ./
COPY scripts/ scripts/
COPY package.json yarn.lock ./
COPY app/package.json app/Makefile app/
COPY app-shell/package.json app-shell/Makefile app-shell/
COPY app-shell-odd/package.json app-shell-odd/Makefile app-shell-odd/
COPY shared-data/package.json shared-data/Makefile shared-data/
COPY discovery-client/ discovery-client/
COPY components/package.json components/Makefile components/
COPY labware-designer/package.json labware-designer/Makefile labware-designer/
COPY labware-library/package.json labware-library/Makefile labware-library/
COPY opentrons-ai-client/package.json opentrons-ai-client/Makefile opentrons-ai-client/
COPY protocol-designer/package.json protocol-designer/Makefile protocol-designer/
COPY api-client/package.json api-client/Makefile api-client/
COPY react-api-client/package.json react-api-client/Makefile react-api-client/
COPY step-generation/package.json step-generation/Makefile step-generation/
COPY usb-bridge/node-client/package.json usb-bridge/node-client/Makefile usb-bridge/node-client/

RUN --mount=type=cache,target=/root/.cache/yarn \
    bash -c "\
    source /etc/profile.d/env.sh && \
    make setup-js \
    "

# The same approach of copying in just the files needed for make setup-py
# would only work if we could map what to copy in from the .git folder
# Our setup.py call into the git folder to get the version

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]

# ========== CI IMAGE ==========
FROM base AS ci

ARG GIT_REF=edge
ENV GIT_REF=${GIT_REF}

WORKDIR /opentrons

# Use a BuildKit cache mount. If `/tmp/git-repo` already exists, fetch & checkout.
RUN --mount=type=cache,id=opentrons-git-cache,target=/tmp/git-repo \
    set -eux; \
    if [ -d /tmp/git-repo/.git ]; then \
      echo "Using cached Opentrons/opentrons repo in /tmp/git-repo"; \
    else \
      git clone https://github.com/Opentrons/opentrons.git /tmp/git-repo; \
    fi && \
    cd /tmp/git-repo; \
    git fetch --all; \
    git fetch --tags --force; \
    git fetch origin "${GIT_REF}"; \
    git checkout "${GIT_REF}"; \
    cp -r /tmp/git-repo/. /opentrons

RUN --mount=type=cache,target=/root/.cache/yarn \
    bash -c "\
    source /etc/profile.d/env.sh && \
    make setup-js \
    "

RUN --mount=type=cache,target=/root/.cache/pip \
    bash -c "\
    source /etc/profile.d/env.sh && \
    make setup-py -j \
    "

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]
