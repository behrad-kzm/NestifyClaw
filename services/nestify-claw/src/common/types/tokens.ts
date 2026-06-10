/**
 * DI tokens for port interfaces (interfaces are erased at runtime).
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
export const GATEWAY_PORT = Symbol('GATEWAY_PORT');
