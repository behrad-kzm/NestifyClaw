/**
 * Dependency-injection tokens for every core port.
 *
 * Ports are TypeScript interfaces (erased at runtime), so we bind and inject
 * them through these symbols:
 *   providers: [{ provide: ROUTING_PORT, useClass: RoutingService }]
 *   constructor(@Inject(ROUTING_PORT) private readonly routing: RoutingPort) {}
 */
export const SECRETS_PORT = Symbol('SECRETS_PORT');
export const INBOUND_PORT = Symbol('INBOUND_PORT');
export const ROUTING_PORT = Symbol('ROUTING_PORT');
export const SESSION_STORE_PORT = Symbol('SESSION_STORE_PORT');
export const AGENT_RUNTIME_PORT = Symbol('AGENT_RUNTIME_PORT');
export const APPROVAL_PORT = Symbol('APPROVAL_PORT');
export const DELIVERY_PORT = Symbol('DELIVERY_PORT');
export const MEDIA_PORT = Symbol('MEDIA_PORT');
export const COMMANDS_PORT = Symbol('COMMANDS_PORT');
export const STATE_STORE_PORT = Symbol('STATE_STORE_PORT');
export const MESSAGE_ENGINE_PORT = Symbol('MESSAGE_ENGINE_PORT');
