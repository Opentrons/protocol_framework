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


ENV NVS_HOME="/root/.nvs"
ENV PYENV_ROOT="/root/.pyenv"
ENV PATH="$NVS_HOME:$PYENV_ROOT/bin:$PATH"

RUN git clone https://github.com/jasongin/nvs.git "$NVS_HOME" \
    && echo 'export NVS_HOME="/root/.nvs"' >> /root/.bashrc \
    && echo '[ -s "$NVS_HOME/nvs.sh" ] && . "$NVS_HOME/nvs.sh"' >> /root/.bashrc \
    && bash -c "source /root/.bashrc && nvs install"


RUN git clone https://github.com/pyenv/pyenv.git "$PYENV_ROOT" \
    && echo 'export PYENV_ROOT="/root/.pyenv"' >> /root/.bashrc \
    && echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> /root/.bashrc \
    && echo 'eval "$(pyenv init --path)"' >> /root/.bashrc \
    && echo 'eval "$(pyenv init -)"' >> /root/.bashrc

RUN bash -c " \
    source $NVS_HOME/nvs.sh && \
    nvs add 22.11.0 && \
    nvs use 22.11.0 && \
    node --version && \
    npm install --global yarn@1 \
    "

RUN bash -c " \
    export PATH=\"$PYENV_ROOT/bin:\$PATH\" && \
    eval \"\$(pyenv init --path)\" && \
    pyenv install 3.10.13 && \
    pyenv global 3.10.13 && \
    python --version \
    "

FROM base AS ci

WORKDIR /opentrons
COPY . .

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

RUN bash -c " \
    source $NVS_HOME/nvs.sh && \
    export PATH=\"$PYENV_ROOT/bin:\$PATH\" && \
    eval \"\$(pyenv init --path)\" && \
    eval \"\$(pyenv init -)\" && \
    nvs use 22.11.0 && \
    python --version && \
    make setup -j\
    "

FROM base AS dev

WORKDIR /opentrons
VOLUME ["/opentrons"]
EXPOSE 5178
EXPOSE 3195

# Create initialization script
RUN echo '#!/bin/bash\n\
source $NVS_HOME/nvs.sh\n\
export PATH="$PYENV_ROOT/bin:$PATH"\n\
eval "$(pyenv init --path)"\n\
eval "$(pyenv init -)"\n\
nvs use 22.11.0\n\
make setup -j\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]