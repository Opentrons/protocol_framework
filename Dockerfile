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

# Set up environment variables in `/etc/profile.d/env.sh`
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

# Install Node.js Version Switcher (NVS)
RUN git clone https://github.com/jasongin/nvs.git "$NVS_HOME" \
    && bash -c "source /etc/profile.d/env.sh && nvs install"

# Install Pyenv for Python
RUN git clone https://github.com/pyenv/pyenv.git "$PYENV_ROOT"

# Install Node.js 22 & Configure Yarn Cache
RUN bash -c " \
    source /etc/profile.d/env.sh && \
    nvs add 22.11.0 && \
    nvs use node/22.11.0/x64 && \
    nvs link node/22.11.0/x64 && \
    node --version && \
    npm install --global yarn@1 && \
    yarn config set cache-folder $YARN_CACHE_FOLDER \
    "

# Install Python 3.10
RUN bash -c " \
    source /etc/profile.d/env.sh && \
    pyenv install 3.10.13 && \
    pyenv global 3.10.13 && \
    pyenv rehash && \
    python --version \
    "

# Create initialization script to ensure all containers load env variables
RUN echo '#!/bin/bash\n\
    source /etc/profile.d/env.sh\n\
    exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

# ========== CI IMAGE ==========
FROM base AS ci

WORKDIR /opentrons
COPY . .

RUN bash -c " \
    source /etc/profile.d/env.sh && \
    make setup-py -j && \
    make setup-js \
    "

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]

# ========== DEV IMAGE ==========
FROM base AS dev

WORKDIR /opentrons
VOLUME ["/opentrons"]
EXPOSE 5178
EXPOSE 3195

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]
