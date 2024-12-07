import {
    BatchSpanProcessor,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
    const client = Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'unknown',
        release: process.env.K_REVISION,
        tracesSampleRate: 1.0,
    });

    if (process.env.K_SERVICE) {
        const { TraceExporter } = await import(
            '@google-cloud/opentelemetry-cloud-trace-exporter'
        );

        client?.traceProvider?.addSpanProcessor(
            new BatchSpanProcessor(new TraceExporter({})),
        );
    }

    if (process.env.NODE_ENV === 'testing') {
        const { OTLPTraceExporter } = await import(
            '@opentelemetry/exporter-trace-otlp-proto'
        );

        client?.traceProvider?.addSpanProcessor(
            new SimpleSpanProcessor(
                new OTLPTraceExporter({
                    url: 'http://jaeger:4318/v1/traces',
                }),
            ),
        );
    }
}
