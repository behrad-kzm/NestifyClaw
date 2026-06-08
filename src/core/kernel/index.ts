/**
 * Kernel barrel (bucket A: contracts + DI tokens).
 *
 * The kernel is contracts-only: there is deliberately no `KernelModule`,
 * because it has no runtime providers. Types and token symbols are imported
 * directly wherever they are needed.
 */
export * from './models';
export * from './ports';
export * from './tokens';
