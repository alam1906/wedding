FROM alpine:3.22

ARG PB_VERSION=0.40.1
ARG TARGETARCH
ARG GIT_SHA=unknown

LABEL org.opencontainers.image.revision=$GIT_SHA

RUN apk add --no-cache ca-certificates unzip wget \
	&& case "$TARGETARCH" in \
		amd64|arm64) PB_ARCH="$TARGETARCH" ;; \
		*) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
	esac \
	&& wget -qO /tmp/pocketbase.zip \
		"https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" \
	&& unzip /tmp/pocketbase.zip -d /pb \
	&& rm /tmp/pocketbase.zip \
	&& addgroup -S -g 10001 pocketbase \
	&& adduser -S -D -H -u 10001 -G pocketbase pocketbase \
	&& mkdir -p /pb/pb_data \
	&& chown -R pocketbase:pocketbase /pb

COPY --chown=pocketbase:pocketbase pb_hooks /pb/pb_hooks
COPY --chown=pocketbase:pocketbase pb_migrations /pb/pb_migrations

USER pocketbase
WORKDIR /pb

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -qO- http://127.0.0.1:8090/api/health >/dev/null || exit 1

ENTRYPOINT ["/pb/pocketbase"]
CMD ["serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--encryptionEnv=PB_ENCRYPTION_KEY"]
